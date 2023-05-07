import os
import glob
import json
import locale
import uuid
import requests
import pprint
from itertools import groupby
from collections import defaultdict
from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from proxy.views import proxy_view
import networkx as nx
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


from django.conf import settings
from django.db import models as db_models
from django.contrib.postgres.aggregates import ArrayAgg, StringAgg
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate, login, logout
from django.db.models import (
    Func,
    CharField,
    Count,
    F,
    Max,
    Min,
    OuterRef,
    Q,
    Subquery,
    Value,
    Case,
    When,
    Avg,
)
from django.db.models.functions import Concat, JSONObject, Now, Cast
from django.http import JsonResponse as JsonResponseOriginal
import datetime as python_datetime
from django.utils.timezone import datetime, now, timedelta
from django.views import View
from django.views.generic.base import TemplateView
from django.contrib.auth.password_validation import validate_password
from proxy.views import proxy_view
from typing import Generator
from django.http import JsonResponse as JsonResponseOriginal, HttpResponseRedirect
from .fiddles import FiddleType

from . import models
from .framework import (
    get_field_from_model,
    get_field_from_model_ext,
    read_fields,
    write_fields,
    apply_model_to_fields,
    read_k_fields,
)
from .utils import (
    unique,
    dissoc,
    all_subclasses,
    validation_error_message,
    postwalk,
)


def react_static(request, path):
    if path.lower().endswith(".css") or path.lower().endswith(".js"):
        remoteurl = "http://127.0.0.1:3000/static/" + path
    else:
        remoteurl = "http://127.0.0.1:3000/react-static/" + path
    return proxy_view(request, remoteurl, {})


def hot_update(request, path):
    remoteurl = "http://127.0.0.1:3000/" + path
    return proxy_view(request, remoteurl, {})


def default_json(x):
    if isinstance(x, Generator):
        return [i for i in x]
    if isinstance(x, python_datetime.datetime):
        return str(x)
    if isinstance(x, python_datetime.date):
        return str(x)
    if isinstance(x, Decimal):
        return str(x)
    try:
        return str(x)
    except Exception as e:
        print(f"Don't know how to convert: {x} {type(x)}")
        return repr(x)


def JsonResponse(*args, **kwargs):
    kwargs["json_dumps_params"] = {"default": default_json}
    return JsonResponseOriginal(*args, **kwargs)


def get_home_redirect(request):
    suffix = ""
    if request.LANGUAGE_CODE != "en":
        suffix = f"{request.LANGUAGE_CODE}/"
    return "https://andrewboltachev.site/" + suffix


class HomeRedirectView(View):
    def get(self, request, *args, **kwargs):
        return HttpResponseRedirect(get_home_redirect(request))


class HomeView(TemplateView):
    template_name = "home.html"


full_name_expr = Concat("first_name", Value(" "), "last_name")
full_name_expr2 = lambda k: Concat(f"{k}__first_name", Value(" "), f"{k}__last_name")


def media_upload(request):
    import base64
    from django.core.files.base import ContentFile
    from django.core.files.storage import default_storage

    body = request.POST  # json.loads(request.body)
    image_data = request.FILES["image"]
    # format, imgstr = image_data.split(';base64,')
    # print("format", format)
    ext = image_data.name.split(".")[-1]

    cfile = image_data  # ContentFile(base64.b64decode(imgstr))
    file_name = str(uuid.uuid4()) + "." + ext
    full_name = body["upload_to"] + file_name
    path = default_storage.save(full_name, cfile)
    return JsonResponse({"filename": path})


class ApiView(View):
    SHOULD_LOGIN_NOTIFICATION = {
        "type": "warning",
        "text": "Please, login or register",
    }

    def get(self, request, *args, **kwargs):
        user = None
        if not self.request.user.is_anonymous:
            user = {
                "id": self.request.user.id,
                "username": self.request.user.username,
                "first_name": self.request.user.first_name,
                "last_name": self.request.user.last_name,
                "email": self.request.user.email,
            }
        data = {
            "title": self.title,
            "wrapper": self.WRAPPER,
            "template": self.TEMPLATE,
            "user": user,
        }
        data.update(self.get_data(request, *args, **kwargs))
        return JsonResponse(data, safe=False)

    def should_login(self):
        return False

    def dispatch(self, request, *args, **kwargs):
        if self.should_login():
            return JsonResponse(
                {
                    "pushState": "/register",
                    "notification": self.SHOULD_LOGIN_NOTIFICATION,
                }
            )
        else:
            return super().dispatch(request, *args, **kwargs)

    def already_logged_in(self):
        if not self.request.user.is_anonymous:
            return {
                "pushState": self.request.GET.get("next", "/"),
                "notification": {
                    "type": "info",
                    "text": "You're already logged in",
                },
            }


def all_api_views():
    for sc in all_subclasses(ApiView):
        if hasattr(sc, "url_path"):
            yield sc


class MainView(ApiView):
    WRAPPER = "MainWrapper"


class LoginApiView(MainView):
    in_menu = False
    url_path = "/login"
    title = "Вход на сайт"
    TEMPLATE = "LoginScreen"

    fields = {
        "type": "Fields",
        "fields": [
            {
                "from_field": "username",
            },
            {
                "k": "password",
                "type": "TextField",
                "label": "Password",
                "subtype": "password",
                "required": True,
            },
        ],
        "context": {},
    }

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        already_logged_in = self.already_logged_in()
        if already_logged_in:
            return already_logged_in
        return read_fields(self.fields, models.User())

    def post(self, request, *args, **kwargs):
        already_logged_in = self.already_logged_in()
        if already_logged_in:
            result = already_logged_in
        else:
            data = json.loads(request.body)

            user = authenticate(
                username=data["data"]["username"], password=data["data"]["password"]
            )
            if user:
                login(request, user)
                result = {
                    "pushState": "/",
                    "notification": {
                        "type": "success",
                        "text": f"Logged in as {user.username}",
                    },
                }  # TODO "next" functionality
            else:
                result = {
                    "action": "setErrors",
                    "errors": {"username": True, "password": True},
                    "error": "Wrong username or password",
                }
        return JsonResponse(result)


class LogoutApiView(MainView):
    in_menu = False
    url_path = "/logout"
    title = ""
    TEMPLATE = None

    def already_logged_out(self):
        if self.request.user.is_anonymous:
            return {
                "pushState": self.request.GET.get("next", "/login"),
                "notification": {
                    "type": "info",
                    "text": "You aren't logged in yet",
                },
            }

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        already_logged_out = self.already_logged_out()
        if already_logged_out:
            return already_logged_out
        logout(request)
        return {
            "pushState": "/",
            "notification": {"type": "info", "text": "Logged in"},
        }


class Error404ApiView(MainView):
    in_menu = False
    url_path = "/404"
    title = "Error: Page not found"
    TEMPLATE = "PageNotFound"

    def get_data(self, request, *args, **kwargs):
        return {}


class LogicoreFormsDemoApiView(MainView):
    in_menu = False
    url_path = "/logicore-forms-demo"
    title = "andrewboltachev.club"
    TEMPLATE = "LogicoreFormsDemoView"

    def get_fields(self):
        return {}

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {}


class HomeApiView(MainView):
    in_menu = False
    url_path = "/"
    title = "andrewboltachev.site"
    TEMPLATE = "GenericForm"

    def get_fields(self):
        return {}

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {
            "redirect": get_home_redirect(request),
        }


class StratagemsApiView(MainView):
    in_menu = False
    url_path = "/stratagems/"
    title = "Stratagems"
    TEMPLATE = "ListView"

    def get_fields(self):
        return {
            "type": "Fields",
            "fields": [
                {"from_field": "name"},
                {"from_field": "kind"},
                {
                    "type": "DefinedField",
                    "master_field": "kind",
                    "simple_defined_field": True,
                    "k": "params",
                    "definitions": {
                        "PYTHONREFACTORING1": {
                            "type": "Fields",
                            "fields": [
                                # {"from_field": "directory"},
                                {
                                    "k": "directory",
                                    "type": "TextField",
                                    "label": "Choose a directory",
                                    "required": True,
                                },
                            ],
                        },
                        "WEBDASHBOARD1": {
                            "type": "Fields",
                            "fields": [],
                        },
                    },
                },
            ],
            "layout": "ModalLayout",
        }

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {
            "items": list(
                models.Stratagem.objects.values(
                    "id", "name", "kind", "created_dt", "modified_dt"
                )
            ),
            "create_form": read_fields(self.get_fields(), models.Stratagem()),
        }

    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)["data"]
        if data.get("action") == "delete":
            models.Stratagem.objects.filter(id=data["id"]).delete()
            return JsonResponse({"redirect": f"/stratagems/"})
        if not data.get("params"):
            data["params"] = {}
        obj = write_fields(self.get_fields(), models.Stratagem(), data)
        return JsonResponse({"redirect": f"/{obj.id}"})


class StratagemApiView(MainView):
    in_menu = False
    url_path = "/<int:id>"
    title = "Hello world"
    TEMPLATE = "GenericForm"

    def get_fields(self, kind):
        fields = {
            "CLOJUREGRAPH1": [
                {"k": "data", "type": "ClojureGraph1Field"},
            ],
            "PYTHONREFACTORING1": [
                {"k": "data", "type": "PythonRefactoring1Field"},
            ],
            "WEBDASHBOARD1": [
                {"k": "data", "type": "WebDashboard1Field"},
            ],
            "ZENDOCUMENT1": [
                {"k": "data", "type": "ZenDocument1Field"},
            ],
        }
        return {
            "type": "Fields",
            "fields": [
                {"from_field": "name"},
                {"k": "params", "type": "HiddenField"},
                *fields[kind],
            ],
            # "layout": "ModalLayout"
        }

    def get_obj(self):
        return models.Stratagem.objects.get(pk=self.kwargs["id"])

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        obj = self.get_obj()
        return {**read_fields(self.get_fields(obj.kind), obj)}

    def post(self, request, *args, **kwargs):
        obj = self.get_obj()
        data = json.loads(request.body)["data"]
        obj = write_fields(self.get_fields(obj.kind), obj, data)
        return JsonResponse({"navigate": f"/{obj.id}"})


class GraphLayoutView(APIView):
    def post(self, request, format=None):
        data = request.data["data"]
        g = nx.DiGraph()
        for item in data["nodes"]:
            g.add_node(item["id"])
        for item in data["edges"]:
            g.add_edge(item["source"], item["target"])
        pos = nx.nx_pydot.pydot_layout(g)
        # pos = nx.spectral_layout(g, scale=200)
        return Response(
            {
                "nodes": [
                    {
                        **node,
                        "position": {
                            "x": pos[node["id"]][0],
                            "y": pos[node["id"]][1],
                        },
                        #'width': 230, 'height': '50'
                    }
                    for node in data["nodes"]
                ],
                "edges": data["edges"],
            }
        )


class GetFileView(APIView):
    def get(self, request, *args, **kwargs):
        path = request.GET.get("path")
        basePath = request.GET.get("basePath")
        if not basePath:
            basePath = ""
        else:
            basePath = basePath.rstrip("/")
        if basePath and path:
            basePath += "/"
        fullPath = os.path.abspath(basePath + path) + "/"
        print("fullPath", fullPath)
        files = [
            {
                "filename": filename.replace(fullPath, ""),
                "dir": os.path.isdir(filename),
            }
            for filename in glob.glob(f"{fullPath}**")
        ]
        if path:
            files.insert(0, {"filename": "..", "dir": True})
        return Response(
            {
                "path": fullPath.replace(basePath, ""),
                "files": files,
                "selected": files[0]["filename"],
            }
        )


def read_file(filename):
    with open(filename, "r") as f:
        return f.read()


def default_json(x):
    if isinstance(x, Generator):
        return [i for i in x]
    if isinstance(x, python_datetime.datetime):
        return str(x)
    if isinstance(x, python_datetime.date):
        return str(x)
    if isinstance(x, Decimal):
        return str(x)
    try:
        return str(x)
    except Exception as e:
        print(f"Don't know how to convert: {x} {type(x)}")
        return repr(x)


def JsonResponse(*args, **kwargs):
    kwargs["json_dumps_params"] = {"default": default_json}
    return JsonResponseOriginal(*args, **kwargs)


class GetFileNodesView(View):
    def get(self, request, *args, **kwargs):
        filePath = request.GET.get("path")
        basePath = request.GET.get("basePath")
        if not basePath:
            basePath = ""
        else:
            basePath = basePath.rstrip("/")
        if basePath and filePath:
            basePath += "/"
        path = f"{basePath}{filePath}"
        import libcst
        from main.parser.python import serialize_dc

        module = libcst.parse_module(read_file(path))
        serialized = serialize_dc(module)
        return JsonResponse({"code": serialized})


class PythonView(MainView):
    in_menu = False
    url_path = "/python"
    title = "Hello world"
    TEMPLATE = "LanguageView"

    def get_data(self, request, *args, **kwargs):
        return {
            "value": "",
            "result": None,
        }

    def post(self, request, *args, **kwargs):
        from main.parser.python import serialize_dc
        import libcst

        data = json.loads(request.body)["data"]
        try:
            result = serialize_dc(libcst.parse_module(data["value"]))
        except Exception as e:
            result = str(e)
        else:
            try:
                result = (
                    result["body"][0] if len(result["body"]) == 1 else result["body"]
                )
            except Exception as e:
                result = str(e)
        return JsonResponse(
            {
                # "navigate": f"/python"
                "result": result,
            }
        )


class CodeSearchsApiView(MainView):
    in_menu = False
    url_path = "/logicore-code/"
    title = "Code search Examples"
    TEMPLATE = "ListView"

    def get_fields(self):
        return {
            "type": "Fields",
            "fields": [
                {"from_field": "name"},
                {"from_field": "kind"},
            ],
            "layout": "ModalLayout",
        }

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {
            "baseUrl": "/logicore-code/",
            "items": list(
                models.CodeSearch.objects.values(
                    "id", "name", "kind", "created_dt", "modified_dt"
                )
            ),
            "create_form": read_fields(self.get_fields(), models.CodeSearch()),
        }

    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)["data"]
        if data.get("action") == "delete":
            models.CodeSearch.objects.filter(id=data["id"]).delete()
            return JsonResponse({"redirect": f"/logicore-code/"})
        obj = write_fields(self.get_fields(), models.CodeSearch(), data)
        return JsonResponse({"redirect": f"/logicore-code/{obj.id}"})


class CodeSearchApiView(MainView):
    in_menu = False
    url_path = "/logicore-code/<int:id>"
    title = "Hello world"
    TEMPLATE = "GenericForm2"

    def get_fields(self, kind):
        return {
            "type": "Fields",
            "fields": [
                {"from_field": "name"},
                {
                    "type": "Fields",
                    "fields": [
                        {"from_field": "data"},
                        {"k": "result", "type": "CodeDisplay", "label": "Result"},
                        {"from_field": "grammar"},
                        {"k": "funnel", "type": "CodeDisplay", "label": "Funnel"},
                        {"k": "error", "type": "HiddenField"},
                        {"k": "result_grammar", "type": "HiddenField"},
                        {"k": "result_code", "type": "HiddenField"},
                        {"k": "t1", "type": "HiddenField"},
                        {"k": "t2", "type": "HiddenField"},
                    ],
                    "layout": "CodeSearchLayout",
                },
            ],
            # "layout": "ModalLayout"
        }

    def get_obj(self):
        def select_keys(m, ks):
            return {k: v for k, v in m.items() if k in ks}

        import libcst
        from main.parser.python import serialize_dc

        obj = models.CodeSearch.objects.get(pk=self.kwargs["id"])
        obj.error = False
        obj.result = "<...>"
        obj.funnel = "<...>"
        # additional
        obj.result_grammar = ""
        obj.result_code = ""
        obj.t1 = None
        obj.t2 = None
        try:
            module = libcst.parse_module(obj.data)
            code = serialize_dc(module)
            code = select_keys(code, ["body", "type"])
        except Exception as e:
            obj.error = True
            obj.result = f"Code parse error: {e}"
            obj.funnel = ""
            return obj
        try:
            module = libcst.parse_module(obj.grammar)
            grammar = serialize_dc(module)
            grammar = select_keys(grammar, ["body", "type"])
        except Exception as e:
            obj.error = True
            obj.result = f"Grammar parse error: {e}"
            obj.funnel = ""
            return obj
        obj.result_code = grammar
        try:
            resp = requests.post(
                "http://localhost:3002/python-matcher-1",
                json={
                    "kind": obj.kind,
                    "data": code,
                    "grammar": grammar,
                },
            )
        except requests.exceptions.ConnectionError:
            obj.error = True
            obj.result = "Connection error"
            obj.funnel = ""
        else:
            resp_json = resp.json()
            if resp.status_code == 200:
                obj.t1 = resp_json.get("t1")
                obj.t2 = resp_json.get("t2")
                if resp_json.get("error"):
                    obj.error = True
                    obj.result = resp_json["error"]
                    obj.funnel = json.dumps(resp_json["funnel"])
                    obj.result_grammar = resp_json["grammar"]
                else:
                    obj.result = json.dumps(resp_json["result"])
                    obj.funnel = json.dumps(resp_json["funnel"])
                    obj.result_grammar = resp_json["grammar"]
            elif resp.status_code == 400:
                obj.error = True
                obj.result = resp_json["error"]
                obj.funnel = ""
            else:
                obj.error = True
                obj.result = f"Unknown error: status ({resp.status_code})"
                obj.funnel = ""
        return obj

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        obj = self.get_obj()
        return {
            "submitButtonWidget": "CodeSearchSubmit",
            **read_fields(self.get_fields(obj.kind), obj),
        }

    def post(self, request, *args, **kwargs):
        obj = self.get_obj()
        data = json.loads(request.body)["data"]
        obj = write_fields(self.get_fields(obj.kind), obj, data)
        return JsonResponse({"navigate": f"/logicore-code/{obj.id}"})


class MatcherFiddlesApiView(MainView):
    in_menu = False
    url_path = "/structure-explorer/"
    title = "Structure Explorer"
    TEMPLATE = "FiddleListView"

    def get_fields(self):
        return {
            "type": "Fields",
            "fields": [
                {"from_field": "name"},
            ],
            "layout": "ModalLayout",
        }

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {
            "baseUrl": self.url_path,
            "items": list(
                models.MatcherFiddle.objects.values(
                    "id", "name", "created_dt", "modified_dt"
                )
            ),
            "create_form": read_fields(self.get_fields(), models.MatcherFiddle()),
        }

    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)["data"]
        if data.get("action") == "delete":
            models.MatcherFiddle.objects.filter(id=data["id"]).delete()
            return JsonResponse({"redirect": f"/logicore-code/"})
        obj = write_fields(self.get_fields(), models.MatcherFiddle(), data)
        return JsonResponse({"redirect": f"/logicore-code/{obj.id}"})


class MatcherFiddleNewApiView(MainView):
    in_menu = False
    url_path = "/structure-explorer/new"
    title = "Hello world"
    TEMPLATE = "GenericForm2"

    def get_data(self, request, *args, **kwargs):
        obj = models.MatcherFiddle.objects.create(name="Hello world")
        return {
            "data": {},
            "fields": {"type": "Fields", "fields": []},
            "redirect": f"/structure-explorer/{obj.uuid}",
        }


class MatcherFiddleApiView(MainView):
    in_menu = False
    url_path = "/structure-explorer/<uuid:uuid>"
    title = "Hello world"
    TEMPLATE = "GenericForm2"

    def get_fields(self):
        return {
            "type": "Fields",
            "fields": [
                {"from_field": "name"},
                {
                    "type": "Fields",
                    "fields": [
                        {"from_field": "data"},
                        {"k": "result", "type": "CodeDisplay", "label": "Result"},
                        {"from_field": "grammar"},
                        {"k": "funnel", "type": "CodeDisplay", "label": "Funnel"},
                        {"k": "error", "type": "HiddenField"},
                    ],
                    "layout": "CodeSearchLayout",
                },
            ],
            # "layout": "ModalLayout"
        }

    def get_obj(self):
        def select_keys(m, ks):
            return {k: v for k, v in m.items() if k in ks}

        import libcst
        from main.parser.python import serialize_dc

        obj = models.MatcherFiddle.objects.get(uuid=self.kwargs["uuid"])
        obj.error = False
        obj.result = "<...>"
        obj.funnel = "<...>"
        # additional
        obj.result_grammar = ""
        obj.result_code = ""
        obj.t1 = None
        obj.t2 = None
        """
        try:
            module = libcst.parse_module(obj.data)
            code = serialize_dc(module)
            code = select_keys(code, ["body", "type"])
        except Exception as e:
            obj.error = True
            obj.result = f"Code parse error: {e}"
            obj.funnel = ""
            return obj
        try:
            module = libcst.parse_module(obj.grammar)
            grammar = serialize_dc(module)
            grammar = select_keys(grammar, ["body", "type"])
        except Exception as e:
            obj.error = True
            obj.result = f"Grammar parse error: {e}"
            obj.funnel = ""
            return obj
        obj.result_code = grammar
        try:
            resp = requests.post("http://localhost:3002/python-matcher-1", json={
                "data": code,
                "grammar": grammar,
            })
        except requests.exceptions.ConnectionError:
            obj.error = True
            obj.result = "Connection error"
            obj.funnel = ""
        else:
            resp_json = resp.json()
            if resp.status_code == 200:
                obj.t1 = resp_json.get("t1")
                obj.t2 = resp_json.get("t2")
                if resp_json.get("error"):
                    obj.error = True
                    obj.result = resp_json["error"]
                    obj.funnel = json.dumps(resp_json["funnel"])
                    obj.result_grammar = resp_json["grammar"]
                else:
                    obj.result = json.dumps(resp_json["result"])
                    obj.funnel = json.dumps(resp_json["funnel"])
                    obj.result_grammar = resp_json["grammar"]
            elif resp.status_code == 400:
                obj.error = True
                obj.result = resp_json["error"]
                obj.funnel = ""
            else:
                obj.error = True
                obj.result = f"Unknown error: status ({resp.status_code})"
                obj.funnel = ""
        """
        return obj

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        obj = self.get_obj()
        return {
            "submitButtonWidget": "CodeSearchSubmit",
            **read_fields(self.get_fields(), obj),
        }

    def post(self, request, *args, **kwargs):
        obj = self.get_obj()
        data = json.loads(request.body)["data"]
        obj = write_fields(self.get_fields(), obj, data)
        return JsonResponse({"navigate": f"/structure-explorer/{obj.uuid}"})


class JSONExplorerApiView(MainView):
    in_menu = False
    url_path = "/json-explorer/"
    title = "JSON explorer"
    TEMPLATE = "JSONExplorerGadget"

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {}

    def post(self, request):
        data = json.loads(request.body)["data"]
        code = data["source"]
        del data["source"]

        try:
            code = json.loads(code)
        except Exception as e:
            return JsonResponse(
                {
                    "funnel": "",
                    "result": "Source JSON decode error",
                    "error": True,
                }
            )

        def f(node):
            if (
                (type(node) == list)
                and len(node)
                and type(node[0]) == dict
                and all([k in node[0] for k in ["uuid", "key", "value"]])
            ):
                print(node)
                node = {element["key"]: element["value"] for element in node}
            if (type(node) == dict) and ("uuid" in node) and ("key" not in node):
                node = node["value"]
            if (type(node) == dict) and ("grammar_data" in node):
                args = []
                for k, v in sorted(node["grammar_data"].items(), key=lambda x: x[0]):
                    args.append(v)
                node = {
                    "tag": node["grammar_type"],
                }
                if len(args) == 0:
                    pass
                elif len(args) == 1:
                    node["contents"] = args[0]
                else:
                    node["contents"] = args
            return node

        # print(json.dumps(data, indent=4))
        grammar = postwalk(f, data)
        error = False
        result = ""
        funnel = ""
        try:
            resp = requests.post(
                "http://localhost:3002/json-matcher-1",
                json={
                    "data": code,
                    "grammar": grammar,
                },
            )
        except requests.exceptions.ConnectionError:
            error = True
            result = "Connection error"
            funnel = ""
        else:
            resp_json = resp.json()
            if resp.status_code == 200:
                if "error" in resp_json:
                    error = True
                    result = resp_json["error"]
                    funnel = ""
                else:
                    result = json.dumps(resp_json["result"])
                    funnel = "\n".join([json.dumps(x) for x in resp_json["funnel"]])
            elif resp.status_code == 400:
                error = True
                result = resp_json["error"]
                funnel = ""
            else:
                error = True
                result = f"Unknown error: status ({resp.status_code})"
                funnel = ""
        return JsonResponse(
            {
                "error": error,
                "result": result,
                "funnel": funnel,
            }
        )


# Fiddle
# Fiddles Collection
# List
# Fiddle itself
class FiddleTypesApiView(MainView):
    url_path = "/toolbox/"
    url_name = "fiddle-types"
    title = "..."
    TEMPLATE = "FiddleTypes"
    WRAPPER = "FiddleWrapper"

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {
            "items": [
                {"url": c.as_part_of_url(), "title": c.as_title()}
                for c in FiddleType.__subclasses__()
            ],
        }


class FiddleTypeMixin:
    def dispatch(self, request, *args, **kwargs):
        self.c = None
        if "kind" in self.kwargs:
            for c in FiddleType.__subclasses__():
                if c.as_part_of_url() == self.kwargs["kind"]:
                    self.c = c
                    break
        # migrate from session to user
        if request.user.is_authenticated:
            owned = [
                int(x) for x in request.session.get("FIDDLES_OWNED", "").split(",") if x
            ]
            fiddles = models.Fiddle.objects.filter(pk__in=owned)
            fiddles.update(user=self.request.user)
            request.session.set("FIDDLES_OWNED", "")
        return super().dispatch(request, *args, **kwargs)


# class FiddleItemsApiView(FiddleTypeMixin, MainView):
#    pass


class MyFiddleListApiView(FiddleTypeMixin, MainView):
    url_path = "/toolbox/mine/"
    url_name = "my-fiddle-list"
    title = "..."
    TEMPLATE = "MyFiddleList"
    WRAPPER = "FiddleWrapper"

    def get_data(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            owned = [
                int(x) for x in request.session.get("FIDDLES_OWNED", "").split(",") if x
            ]
            qs = models.Fiddle.objects.filter(pk__in=owned)
        else:
            qs = models.Fiddle.objects.filter()
        items = list(
            qs.values("kind", "created_dt", "uuid", "rev")
            .annotate(
                title=Concat(
                    F("kind"),
                    Value(": "),
                    F("uuid"),
                    Value(" / "),
                    F("rev"),
                    Value(" - "),
                    F("created_dt"),
                    output_field=CharField(),
                )
            )
            .order_by("-created_dt")
        )
        for item in items:
            for c in models.FiddleType.__subclasses__():
                if c.as_choice_key() == item["kind"]:
                    item["url_key"] = c.as_part_of_url()
            item["url"] = 1
        return {"items": items}


@method_decorator(csrf_exempt, name="dispatch")
class NewFiddleItemApiView(FiddleTypeMixin, MainView):
    url_path = "/toolbox/<kind>/"
    url_name = "new-fiddle-item"
    title = "..."
    TEMPLATE = "Fiddle"
    WRAPPER = "FiddleWrapper"

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        if not self.c:
            return {
                "template": "FiddleNotFound",
            }
        uid = str(self.kwargs.get("uuid", ""))
        rev = int(self.kwargs.get("rev", 1))
        obj = None
        if uid:
            try:
                obj = models.Fiddle.objects.get(uuid=uid, rev=rev)
            except models.Fiddle.DoesNotExist:
                return {
                    "template": "FiddleNotFound",
                }
        return {
            "kind": self.c.as_choice_key(),
            "uuid": uid,
            "rev": rev,
            "val": obj.data if obj else None,
            **self.c.get_data(self),
        }

    def post(self, request, *args, **kwargs):
        owned = []
        if request.user.is_anonymous:
            owned = [
                int(x) for x in request.session.get("FIDDLES_OWNED", "").split(",") if x
            ]
        data = json.loads(request.body)["data"]
        if not self.c:
            return JsonResponse({"error": "FiddleType not found"}, status=400)

        uid = str(self.kwargs.get("uuid", ""))
        rev = int(self.kwargs.get("rev", 1))
        first_obj = None
        last_obj = None
        continue_last = False
        if uid:
            # first of existing - "base" object. it's id is in session or user is author
            # last of existing - is "parent" of the one being created
            existing = models.Fiddle.objects.filter(uuid=uid, rev__lte=rev).order_by(
                "rev"
            )
            first_obj = existing.first()
            last_obj = existing.last()
            if existing:
                if (first_obj.user == request.user) or (first_obj.pk in owned):
                    continue_last = True
        new_rev = 1
        if first_obj and continue_last:
            # Get the max available rev
            max_rev = (
                models.Fiddle.objects.filter(uuid=uid).aggregate(Max("rev"))["rev__max"]
                or 0
            )
            new_rev = max_rev + 1
        else:
            uid = str(uuid.uuid4())
        new_obj = models.Fiddle.objects.create(
            # Definition
            kind=self.c.as_choice_key(),
            version="000",  # TODO
            # Revision
            uuid=uid,
            rev=new_rev,
            parent=last_obj if not continue_last else None,
            # Data
            data=data["val"],
            # Ownership
            user=request.user if not request.user.is_anonymous else None,
        )
        url = ""
        if request.LANGUAGE_CODE != "en":
            url = url + "/" + request.LANGUAGE_CODE
        url += "/toolbox/" + self.c.as_part_of_url() + "/" + uid + "/"
        if new_rev > 1:
            url += str(new_rev) + "/"

        if request.user.is_anonymous:
            owned.append(new_obj.pk)
            request.session["FIDDLES_OWNED"] = ",".join(map(str, owned))
        return JsonResponse({"redirect": url}, status=200)


class ExistingFiddleItemApiView(NewFiddleItemApiView):
    url_path = "/toolbox/<kind>/<uuid>/"
    url_name = "existing-fiddle-item"


class RevisionFiddleItemApiView(ExistingFiddleItemApiView):
    url_path = "/toolbox/<kind>/<uuid>/<rev>/"
    url_name = "revision-fiddle-item"


@csrf_exempt
def haskell_api(request, path):
    return proxy_view(request, f"http://localhost:3042/{path}", {})


@csrf_exempt
def python_api(request, proc):
    import libcst
    from main.parser.python import serialize_dc, unserialize_dc

    data = json.loads(request.body)

    if proc == "step1":
        try:
            module = libcst.parse_module(data["grammar"])
            grammar = serialize_dc(module)
        except Exception as e:
            return JsonResponse({"error": str(e)})
        try:
            module = libcst.parse_module(data["code"])
            code = serialize_dc(module)
        except Exception as e:
            return JsonResponse({"error": str(e)})
        print("step1")
        pprint.pprint(grammar)
        pprint.pprint(code)
        try:
            resp = requests.post(
                "http://localhost:3042/pythonStep1",
                json={"pattern": grammar, "value": code},
            )
        except Exception as e:
            return JsonResponse({"error": str(e)})
        if resp.status_code != 200:
            return JsonResponse({"error": f"Haskell API returned: {resp.content.decode('utf-8')}"})
        return JsonResponse(resp.json())
    elif proc == "step2":
        try:
            module = libcst.parse_module(data["grammar"])
            grammar = serialize_dc(module)
        except Exception as e:
            print(e)
            return JsonResponse({"error": str(e)})
        thinValue = data["thinValue"]
        try:
            resp = requests.post(
                "http://localhost:3042/pythonStep2",
                json={"pattern": grammar, "thinValue": thinValue},
            )
        except Exception as e:
            print(e)
            return JsonResponse({"error": str(e)})
        if resp.status_code != 200:
            return JsonResponse({"error": f"Haskell API returned: {resp.content.decode('utf-8')}"})
        try:
            j = resp.json()
            code = unserialize_dc(j["code"]).code
        except Exception as e:
            print(e)
            return JsonResponse({"error": str(e)})
        return JsonResponse({"code": code})

    return JsonResponse({"error": "No such method"})
