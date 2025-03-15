import json
import copy
from collections import defaultdict
from decimal import Decimal

from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ImproperlyConfigured
from django.db import models as db_models
from django.db.models import F, JSONField, OuterRef, Q, Subquery
from django.db.models.functions import JSONObject
from django.utils.timezone import datetime, now, timedelta

infinite_defaultdict = lambda: defaultdict(infinite_defaultdict)


class NoFieldFoundError(Exception):
    pass


def get_field_from_model(model, field_name):
    try:
        return [f for f in model._meta.fields if f.name == field_name][0]
    except IndexError:
        try:
            first_rel = [
                v
                for k, v in model._meta.fields_map.items()
                if k == f"{model.__name__}_{field_name}+"
            ][0]
        except IndexError:
            raise NoFieldFoundError(
                f'No field named "{field_name}" on model {model.__name__}'
            )
        else:
            first_fk = first_rel.field
            try:
                second_fk = [
                    f
                    for f in first_fk.model._meta.fields
                    if f != first_fk and f.is_relation
                ][0]
            except IndexError:
                raise NotImplementedError(
                    f'Not a proper implementation for m2m (for field "{model.__name__}.{field_name})"'
                )
            else:
                second_fk.is_m2m = True
                second_fk.initial_related_name = field_name  # TODO?
                # TODO use get_field
                second_fk.original_blank = model._meta.get_field(field_name).blank
                return second_fk


def get_field_from_model_ext(model, field_name):
    if "__" in field_name:
        fk, field_name = field_name.split("__", 1)
        f = model._meta.get_field(fk)
        model = f.related_model
        return get_field_from_model_ext(model, field_name)
    return get_field_from_model(model, field_name)


def field_from_field(f, field, model):
    via = field.get("via", None)
    if via:
        return field_from_field_transformers[via](f, field, model)
    if isinstance(f, db_models.AutoField):
        return {"k": f.name, "type": "HiddenField", "required": True, "validators": []}
    if isinstance(f, db_models.BooleanField):
        return {
            "k": f.name,
            "type": "BooleanField",
            "label": f.verbose_name.capitalize(),
            "required": False,  # TODO
            "validators": [],
        }
    if isinstance(f, db_models.CharField):
        if f.choices:
            return {
                "k": f.name,
                "type": "SelectField",
                "label": f.verbose_name.capitalize(),
                "required": not f.blank,
                "options": [{"value": k, "label": v} for k, v in f.choices],
                "is_choices": True,
                "default": getattr(f, "default", None),
            }
        return {
            "k": f.name,
            "type": "TextField",
            "label": f.verbose_name.capitalize(),
            "required": not f.blank,
            "validators": [
                {"type": "maxLength", "value": f.max_length},
            ],
            "read_only": field.get("read_only"),
        }
    if isinstance(f, db_models.TextField):  # TODO refactor with above
        return {
            "k": f.name,
            "type": "TextareaField",
            "label": f.verbose_name.capitalize(),
            "required": not f.blank,
            "validators": [],
            "readonly": field.get("readonly"),
        }
    if isinstance(f, db_models.ForeignKey):
        label_expr = field.get("label_expr", None) or F("name")
        options = None
        optgroup = field.get("optgroup", None)
        if optgroup:
            option_level_model = f.related_model
            group_level_model = get_field_from_model(
                option_level_model, optgroup
            ).related_model
            options = list(
                group_level_model.objects.annotate(
                    options=Subquery(
                        option_level_model.objects.filter(
                            **{f"{optgroup}__pk": OuterRef("pk")}
                        )
                        .values(f"{optgroup}__pk")
                        .values(
                            s=ArrayAgg(JSONObject(value=F("id"), label=label_expr))
                        ),
                        output_field=ArrayField(JSONField()),
                    )
                ).values("options", label=F("name"))
            )
        else:
            options = list(
                f.related_model.objects.values(value=F("pk"), label=label_expr)
            )
        is_m2m = getattr(f, "is_m2m", False)
        return {
            "k": f.initial_related_name if is_m2m else f.name,
            "type": "SelectField",
            "label": f.verbose_name.capitalize(),
            "multiple": is_m2m,
            "is_m2m": is_m2m,
            "required": (not f.original_blank) if is_m2m else (not f.blank),
            "options": options,
            "placeholder": field.get("placeholder", None),
            "validators": [],
            "label_expr": field.get("label_expr", None),
        }
    if isinstance(f, db_models.ManyToManyField):
        options = None
        optgroup = field.get("optgroup", None)
        if optgroup:
            option_level_model = f.related_model
            group_level_model = get_field_from_model(
                option_level_model, optgroup
            ).related_model
            options = list(
                group_level_model.objects.annotate(
                    options=Subquery(
                        option_level_model.objects.filter(
                            **{f"{optgroup}__pk": OuterRef("pk")}
                        )
                        .values(f"{optgroup}__pk")
                        .values(s=ArrayAgg(JSONObject(value=F("id"), label=F("name")))),
                        output_field=ArrayField(JSONField()),
                    )
                ).values("options", label=F("name"))
            )
        else:
            options = list(
                f.related_model.objects.values(value=F("pk"), label=F("name"))
            )
        ret = {
            "k": f.name,
            "type": "SelectField",
            "label": f.verbose_name.capitalize(),
            "required": not f.blank,
            "options": options,
            "placeholder": field.get("placeholder", None),
            "validators": [],
        }
        return ret
    if isinstance(f, db_models.SmallIntegerField):
        validators = []
        if "min" in field:
            validators.append({"type": "minNumber", "value": field["min"]})
        validators.append({"type": "maxNumber", "value": field.get("max", 32767)})
        return {
            "k": f.name,
            "type": "NumberField",
            "label": f.verbose_name.capitalize(),
            "required": not f.blank,
            "validators": validators,
        }
    if isinstance(f, ArrayField) and isinstance(f.base_field, db_models.CharField):
        validators = []
        if "min" in field:
            validators.append({"type": "minNumber", "value": field["min"]})
        return {
            "k": f.name,
            "type": "TextareaField",
            "subtype": "Array",
            "label": f.verbose_name.capitalize(),
            "required": not f.blank,
            "validators": validators,
        }
    if isinstance(f, db_models.ImageField):
        return {
            "k": f.name,
            "type": "ImageField",
            "label": f.verbose_name.capitalize(),
            "required": not f.blank,
            "upload_to": f.upload_to,
            "validators": [],
        }
    if isinstance(f, db_models.DateField):
        return {
            "k": f.name,
            "type": "DateField",
            "label": f.verbose_name.capitalize(),
            "required": not f.blank,
            "validators": [],
        }
    if isinstance(f, db_models.DecimalField):
        return {
            "k": f.name,
            "type": "DecimalField",
            "label": f.verbose_name.capitalize(),
            "required": not f.blank,
            "validators": [],
        }


def apply_from_field(field, model):
    from_field = field.get("from_field", None)
    if from_field:
        try:
            model_field = get_field_from_model(model, from_field)
        except NoFieldFoundError:
            if "via" not in field:
                raise ImproperlyConfigured(
                    f'No field "{from_field}" on model "{model}"'
                )
                del field["from_field"]
            model_field = None
        result = field_from_field(model_field, field, model)
        result.update(field)
        field = result
    elif "via" in field:
        via = field.get("via", None)
        return field_from_field_transformers[via](None, field, model)
    return field


model_redefiners = ["ForeignKeyListField"]


def walk_with_model(struct, func, model):
    fields = struct.get("fields", None)
    if fields:
        if struct.get("type", None) in model_redefiners:
            model = model._meta.fields_map[struct["k"]].related_model
        struct["fields"] = [walk_with_model(f, func, model) for f in fields]
    return func(struct, model)


def find_option(options, value):
    for option in options:
        if option["value"] == value:
            return option


def find_options(options, values):
    return [option for option in options if option["value"] in values]


def plain_options(v):
    if v["options"] and "options" in v["options"][0]:
        result = []
        for o1 in v["options"]:
            result.extend(o1["options"])
        return result
    else:
        return v["options"]


def read_field(obj, v, getter=getattr, raw=False):
    if v["type"] == "SelectField":  # For now foreign key only
        if raw and v.get("multiple"):
            return find_options(
                plain_options(v),
                [int(x) for x in (getter(obj, v["k"]) or "").split(",") if x],
            )
        if raw and not v.get("multiple"):
            value = getter(obj, v["k"], v.get("default"))
            return find_option(v["options"], value)
        label_expr = v.get("label_expr") or F("name")
        if not v.get("is_m2m"):
            if v.get("is_choices"):
                # print("default is", v["default"], v["options"])
                return [
                    *[
                        option
                        for option in v["options"]
                        if getter(obj, v["k"], v["default"]) == option["value"]
                    ],
                    None,
                ][0]
            id_ = getter(obj, v["k"] + "_id")
            if id_ is None:
                return None
            value_obj = getter(obj, v["k"])
            if not value_obj:
                return None
            return {
                "value": id_,
                "label": value_obj.__class__.objects.filter(pk=value_obj.pk)
                .values(label_a23r238r23r8=label_expr)
                .first()["label_a23r238r23r8"],
            }
        else:
            return [
                {"value": subObj["pk"], "label": subObj["label_a23r238r23r8"]}
                for subObj in getter(obj, v["k"]).values(
                    "pk", label_a23r238r23r8=label_expr
                )
            ]
    elif v["type"] == "BooleanField":
        return getter(obj, v["k"]) or False
    elif v["type"] == "TextField":
        return getter(obj, v["k"]) or ""
    elif v["type"] == "TextareaField" and v.get("subtype", None) != "Array":
        return getter(obj, v["k"]) or ""
    elif v["type"] == "RichTextField":
        return getter(obj, v["k"]) or ""
    elif v["type"] == "TextareaField" and v.get("subtype", None) == "Array":
        return "\n".join((getter(obj, v["k"]) or []))
    elif v["type"] == "DecimalField":
        return str(getter(obj, v["k"]))
    elif v["type"] == "ImageField":
        return {"data": getter(obj, v["k"]).name}
    elif v["type"] == "TextDisplay":
        return None
    elif v["type"] == "DateField":
        return (
            getter(obj, v["k"])
            if raw
            else (
                getter(obj, v["k"]).strftime("%d.%m.%Y")
                if getter(obj, v["k"])
                else None
            )
        )
    elif v["type"] == "DefinedField" and not v.get("simple_defined_field"):
        try:
            current = v["definitions"][getattr(obj, v["master_field"]).pk]
        except:
            pass
        else:
            return read_k_fields(obj, current)
    else:
        return getter(obj, v["k"])


def read_k_fields(obj, fields):
    data = {}

    def walk1(struct, data, obj):
        k = struct.get("k", None)
        if struct.get("type", []) == "ForeignKeyListField":
            try:
                data[k] = []
            except:
                pass
            related_attr = obj.__class__._meta.fields_map[k].related_name or f"{k}_set"
            for i, child in enumerate(getattr(obj, related_attr).all()):
                data[k].append({})
                # print("will call with", child, type(child))
                walk1(
                    {k: v for k, v in {**struct, "type": "Fields"}.items() if k != "k"},
                    data[k][i],
                    child,
                )
        elif k:
            data[k] = read_field(obj, struct)
        else:
            for f in struct.get("fields", []):
                walk1(f, data, obj)

    walk1(fields, data, obj)

    return data


def apply_model_to_fields(fields, model):
    return walk_with_model(fields, apply_from_field, model)


def read_fields(fields, obj):
    fields = walk_with_model(fields, apply_from_field, obj.__class__)
    return {
        "fields": fields,
        "data": read_k_fields(obj, fields) if obj.pk else None,
    }


def get_k_fields(fields):
    def walk1(struct, func, path=None):
        if not path:
            path = []
        k = struct.get("k", None)
        if k:
            path = [*path, k]
        for f in struct.get("fields", []):
            walk1(f, func, path)
        if k:
            func(struct, path)

    def assign_by_path(d, path, value):
        p = r = d
        rk = None
        for k in path:
            p = r
            rk = k
            r = r[k]
        if (rk not in p) or not p[rk].keys():
            p[rk] = value
        if (rk in p) and value.get("type", None) == "ForeignKeyListField":
            value = copy.deepcopy(value)
            del value["fields"]
            p[rk]["_field"] = value
        return r

    k_fields = infinite_defaultdict()

    def walk1_func(struct, path):
        if not path:
            return
        return assign_by_path(k_fields, path, struct)

    walk1(fields, walk1_func)
    return k_fields


def read_field_into_qs(obj, v):
    getter = lambda obj, k, default=None: obj.get(k, default) if obj else None
    qs_k = v.get("qs_k", v["k"])
    if v["type"] == "SelectField":
        if v.get("is_choices"):
            if not v.get("is_expressions"):
                value = [x for x in (getter(obj, v["k"]) or "").split(",") if x]
                if value:
                    return {f"{qs_k}__in": value}
                elif v.get("only_in_default"):
                    return {f"{qs_k}__in": v.get("only_in_default")}
            else:
                value = [
                    *[x for x in (getter(obj, v["k"]) or "").split(",") if x],
                    None,
                ][0]
                return v["expressions"].get(value, {})
        elif v["multiple"]:
            value = [int(x) for x in (getter(obj, v["k"]) or "").split(",") if x]
            if value:
                return {f"{qs_k}__in": value}
        else:
            raise NotImplementedError()
    elif v["type"] == "DateField":
        value = getter(obj, v["k"])
        if value:
            value = datetime.strptime(value, "%d.%m.%Y").date()
            return {
                qs_k: value,
            }
    elif v["type"] == "BooleanField":
        value = getter(obj, v["k"])
        value = value == "yes"
        return {
            qs_k: value,
        }
    else:
        print(f"No read_field_into_qs implementation for field {v['k']}")
        return {}
    return {}


def walk_the_tree(tree, f, parents=None):
    if not parents:
        parents = []
    fields = tree.get("fields")
    tree = {k: v for k, v in tree.items()}
    if fields:
        tree["fields"] = [walk_the_tree(field, f, [*parents, tree]) for field in fields]
    return f(tree, parents)


def write_fields(fields, obj, data, files=None):
    fields = walk_with_model(fields, apply_from_field, obj.__class__)
    k_fields = get_k_fields(fields)

    def get_by_path(struct, path):
        r = struct
        for k in path:
            try:
                r = r[k]
            except (IndexError, KeyError):
                return None
        return r

    def set_by_path(struct, path, value):
        r = struct
        for k in path[:-1]:
            try:
                r = r[k]
            except (IndexError, KeyError):
                return None
        r[path[-1]] = value

    import json

    print(json.dumps(fields, indent=4, ensure_ascii=False, default=repr))
    print(json.dumps(k_fields, indent=4, ensure_ascii=False, default=repr))

    def assign_field(obj, v, path2=None, setter=setattr):
        if isinstance(v, defaultdict):
            return  # XXX fix
        if v.get("readonly"):
            return
        json_collection_k = v.get("json_collection")
        if v.get("json_collection"):
            del v["json_collection"]
            obj2 = getattr(obj, json_collection_k, None)
            if not obj2:
                obj2 = {}
                setattr(obj, json_collection_k, obj2)
                obj2 = getattr(obj, json_collection_k, None)
            print("existing obj2", obj2)
            assign_field(obj2, v, path2, setter=lambda o, k, v: o.__setitem__(k, v))
            return
        val = get_by_path(data, path2)
        if v["type"] == "SelectField":  # For now foreign key only
            if v.get("is_choices"):
                setter(obj, v["k"], val.get("value", None) if val else None)
            elif not v.get("is_m2m"):
                setter(obj, v["k"] + "_id", val and val.get("value", None))
            else:
                val = val or []
                values = [x["value"] for x in val]
                m2m_related = getattr(obj, v["k"])
                for vv in m2m_related.all():
                    if vv.pk not in values:
                        m2m_related.remove(vv)
                existing = [x.pk for x in m2m_related.all()]
                for vv in val or []:
                    if vv["value"] not in existing:
                        m2m_related.add(m2m_related.model.objects.get(pk=vv["value"]))
        elif v["type"] == "BooleanField":
            setter(obj, v["k"], val or False)
        elif v["type"] == "TextField":
            setter(obj, v["k"], val or "")
        elif v["type"] == "TextareaField" and v.get("subtype", None) != "Array":
            setter(obj, v["k"], val or "")
        elif v["type"] == "RichTextField":
            setter(obj, v["k"], val or "")
        elif v["type"] == "TextareaField" and v.get("subtype", None) == "Array":
            setter(obj, v["k"], (val or "").split("\n"))
        elif v["type"] == "ImageField":
            setter(obj, v["k"], val.get("data") if val else None)
        elif v["type"] == "DecimalField":
            setter(obj, v["k"], Decimal(str(val or 0)))
        elif v["type"] == "DateField":
            setter(obj, v["k"], datetime.strptime(val, "%d.%m.%Y") if val else None)
        elif v["type"] == "DefinedField" and not v.get("simple_defined_field"):
            try:
                current = v["definitions"][parent_val[v["master_field"]]["value"]]
            except:
                pass
            else:
                obj.save()
                write_fields(current, obj, val, files)
        else:
            setter(obj, v["k"], val)

    def walk2(items, obj, path=[]):
        for k, v in items.items():
            # if not isinstance(v, dict) or not 'type' in v:
            #    continue
            path2 = [*path, k]
            if (
                "_field" not in v
                and not v.get("is_m2m", False)
                and not v["type"] == "AttachmentsField"
            ):
                assign_field(obj, v, path2)
        # print(obj, obj.__dict__)
        obj.save()
        for k, v in items.items():
            # if not isinstance(v, dict) or not 'type' in v:
            #    continue
            path2 = [*path, k]
            if "_field" not in v and v.get("is_m2m", False):
                assign_field(obj, v, path2)
        for k, v in items.items():
            # if not isinstance(v, dict) or not 'type' in v:
            #    continue
            if v["type"] != "AttachmentsField":
                continue
            m2m_field = obj.__class__._meta.get_field(k)
            value = get_by_path(data, [*path, k])
            existing_ids = [x["id"] for x in value.get("existing", [])]
            manager = getattr(obj, k)
            for att in manager.all():
                if att.id not in existing_ids:
                    manager.remove(att)
            for added in value.get("added", []):
                uid = added["its_uid_for_file_to_upload_239r8h239rh239r"]
                file = files[uid]
                doc = m2m_field.related_model.objects.create(
                    document_name=file.name,
                    document=file,
                )
                manager.add(doc)
            # m2m_field.related_model
        # print(obj, obj.__dict__)
        print("items", items)
        for k, v in items.items():
            # if not isinstance(v, dict) or not 'type' in v:
            #    continue
            if v["type"] == "AttachmentsField":
                continue
            if k == "_field":
                continue
            path2 = [*path, k]
            if "_field" in v:
                fk_field = obj.__class__._meta.fields_map[k].field
                updated_items = get_by_path(data, path2) or []
                existing_items = fk_field.model.objects.filter(**{fk_field.name: obj})
                existing_items.filter(
                    ~Q(pk__in=[x.get("id", None) for x in updated_items])
                ).delete()
                for j, x in enumerate(updated_items):
                    id_ = x.get("id", None)
                    print("aaa", id_)
                    if id_:
                        child = fk_field.model.objects.get(
                            pk=id_
                        )  # TODO if it was deleted?
                    else:
                        child = fk_field.model()
                    setattr(child, fk_field.name, obj)
                    if v["_field"].get("ordered"):
                        set_by_path(data, [*path2, j, "order"], j + 1)
                    walk2(v, child, [*path2, j])

    walk2(k_fields, obj)
    return obj


class StatusOptions:
    default = False

    @classmethod
    def get_code(cls):
        return cls.__name__.upper()

    @classmethod
    def get_default(cls):
        for c in cls.__subclasses__():
            if c.default:
                return c.get_code()

    @classmethod
    def get_choices(cls, limit_to=None):
        return [
            (c.get_code(), c.name)
            for c in cls.__subclasses__()
            if (not limit_to) or (c in limit_to)
        ]

    @classmethod
    def get_options(cls, *args, **kwargs):
        return [{"value": k, "label": v} for (k, v) in cls.get_choices(*args, **kwargs)]

    @classmethod
    def get_args(cls):
        return {"choices": cls.get_choices(), "default": cls.get_default()}

    @classmethod
    def get_for(cls, value):
        for c in cls.__subclasses__():
            if c.get_code() == value:
                return c
        else:
            # XXX shouldn't happen
            return type("StatusOptionPlaceholder", (object,), {"name": "<нет>"})

    @classmethod
    def get_field(cls, verbose_name=None):
        extra = {}
        if verbose_name:
            extra["verbose_name"] = verbose_name
        f = db_models.CharField(max_length=32, **extra, **cls.get_args())
        f.choices_class = cls
        return f
