import locale
import re
from functools import partial
from django.db import models


def unique(a):
    r = []
    for x in a:
        if x not in r:
            r.append(x)
    return r


def dissoc(d, *keys):
    return {k: v for k, v in d.items() if k not in keys}


def menu_view(k):
    def menu_view_decorator(cls):
        menu_views[k].append(cls)
        return cls

    return menu_view_decorator


def all_subclasses(cls):
    for c in cls.__subclasses__():
        for s in all_subclasses(c):
            yield s
        yield c


def validation_error_message(e):
    if hasattr(e, "message"):
        if e.params:
            return e.message % e.params
        else:
            return e.message
    if hasattr(e, "error_list"):
        return validation_error_message(e.error_list[0])
    raise NotImplemented


def identity(e):
    return e


def walk(inner, outer, coll):
    if isinstance(coll, list):
        return outer([inner(e) for e in coll])
    elif isinstance(coll, dict):
        return outer(dict([inner(e) for e in coll.items()]))
    elif isinstance(coll, tuple):
        return outer([inner(e) for e in coll])
    else:
        return outer(coll)


def prewalk(fn, coll):
    return walk(partial(prewalk, fn), identity, fn(coll))


def postwalk(fn, coll):
    return walk(partial(postwalk, fn), fn, coll)


def prewalk_demo(coll):
    def prn(e):
        # print "Walked:", e
        return e

    return prewalk(prn, coll)


def postwalk_demo(coll):
    def prn(e):
        # print "Walked:", e
        return e

    return postwalk(prn, coll)


class ClassHierarchy:
    @classmethod
    def as_snake_case(cls):
        """
        in_progress, work_order
        """
        return "_".join(cls._as_split_name()).lower()

    @classmethod
    def as_unseparated_name(cls):
        """
        E.g. for fieldname: inprogress, workorder
        """
        return "".join(cls._as_split_name()).lower()

    @classmethod
    def as_choice_key(cls):
        """
        Class name for use as a key for choices: IN_PROGRESS, WORK_ORDER
        """
        return "_".join(cls._as_split_name()).upper()

    @classmethod
    def as_part_of_url(cls):
        """
        Class name for use in URLs: in-progress, work-order
        """
        return "-".join(cls._as_split_name()).lower()

    @classmethod
    def as_regular(cls):
        """
        Class name to use as variable name etc: InProgress, WorkOrder
        """
        return "".join(cls._as_split_name())

    @classmethod
    def as_title(cls):
        """
        Class name as human-readable name: In Progress, Work Order
        """
        return " ".join(cls._as_split_name())

    @classmethod
    def _as_own_name(cls):
        try:
            # if a class has at lease one parent
            return cls.__name__.replace(cls.mro()[1].__name__, "")
        except:
            return cls.__name__

    @classmethod
    def _as_split_name(cls):
        splits = list(re.findall("[A-Z][^A-Z]*", cls._as_own_name()))
        result = []
        is_all_upper = lambda x: x == x.upper()
        for s in splits:
            # Join back together abbreviations like "JSON"
            if (
                len(result)
                and is_all_upper(result[-1])
                and is_all_upper(s)
                #and len(s) == 1
            ):
                result[-1] = result[-1] + s
            else:
                result.append(s)
        return result

    @classmethod
    def as_choices(cls, **options):
        """
        Convert class hierarchy to choices field
        """
        names = []
        default = None
        for c in cls.__subclasses__():
            k = c.as_choice_key()
            names.append((k, c.as_title()))
            if getattr(c, "default", False):
                default = k
        return models.CharField(
            max_length=64,
            choices=[
                (k, v)
                for k, v in names
                if k not in [c.as_choice_key() for c in options.get("exclude", [])]
            ],
            default=default,
            *options.get("extra_args", []),
            **options.get("extra_kwargs", {}),
        )
