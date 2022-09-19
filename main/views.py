import os
import glob
import json
import locale
import uuid
from itertools import groupby
from collections import defaultdict
from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
import networkx as nx

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
from django.http import JsonResponse as JsonResponseOriginal

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
                    "text": "You\'re already logged in",
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
        "context": {
        },
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
        return {
        }


class HomeApiView(MainView):
    in_menu = False
    url_path = "/"
    title = "andrewboltachev.club"
    TEMPLATE = "HomeView"

    def get_fields(self):
        return {}

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {
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
                                #{"from_field": "directory"},
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
                            "fields": [
                            ],
                        },
                    },
                },
            ],
            "layout": "ModalLayout"
        }

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {
            'items': list(
                models.Stratagem.objects.values('id', 'name', 'kind', 'created_dt', 'modified_dt')
            ),
            'create_form': read_fields(self.get_fields(), models.Stratagem())
        }

    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)['data']
        if data.get('action') == 'delete':
            models.Stratagem.objects.filter(id=data['id']).delete()
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
            'CLOJUREGRAPH1': [
                {"k": "data", "type": "ClojureGraph1Field"},
            ],
            'PYTHONREFACTORING1': [
                {"k": "data", "type": "PythonRefactoring1Field"},
            ],
            'WEBDASHBOARD1': [
                {"k": "data", "type": "WebDashboard1Field"},
            ],
            'ZENDOCUMENT1': [
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
            #"layout": "ModalLayout"
        }

    def get_obj(self):
        return models.Stratagem.objects.get(pk=self.kwargs["id"])

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        obj = self.get_obj()
        return {
            **read_fields(self.get_fields(obj.kind), obj)
        }

    def post(self, request, *args, **kwargs):
        obj = self.get_obj()
        data = json.loads(request.body)['data']
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
        #pos = nx.spectral_layout(g, scale=200)
        return Response({
            'nodes': [{
                **node,
                "position": {
                    'x': pos[node["id"]][0],
                    'y': pos[node["id"]][1],
                },
                #'width': 230, 'height': '50'
                } for node in data["nodes"]],
            'edges': data['edges']
        })


class GetFileView(APIView):
    def get(self, request, *args, **kwargs):
        path = request.GET.get('path')
        basePath = request.GET.get('basePath')
        if not basePath:
            basePath = ''
        else:
            basePath = basePath.rstrip('/')
        if basePath and path:
            basePath += '/'
        fullPath = os.path.abspath(basePath + path) + '/'
        print('fullPath', fullPath)
        files = [{
            'filename': filename.replace(fullPath, ''),
            'dir': os.path.isdir(filename),
        } for filename in glob.glob(f'{fullPath}**')]
        if path:
            files.insert(0, {'filename': '..', 'dir': True})
        return Response({
            'path': fullPath.replace(basePath, ''),
            'files': files,
            'selected': files[0]['filename'],
        })


def read_file(filename):
    with open(filename, 'r') as f:
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
        filePath = request.GET.get('path')
        basePath = request.GET.get('basePath')
        if not basePath:
            basePath = ''
        else:
            basePath = basePath.rstrip('/')
        if basePath and filePath:
            basePath += '/'
        path = f'{basePath}{filePath}'
        import libcst
        from main.parser.python import serialize_dc
        module = libcst.parse_module(read_file(path))
        serialized = serialize_dc(module)
        return JsonResponse({
            'code': serialized
        })


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
        data = json.loads(request.body)['data']
        try:
            result = serialize_dc(libcst.parse_module(data['value']))
        except Exception as e:
            result = str(e)
        else:
            try:
                result = result['body'][0] if len(result['body']) == 1 else result['body']
            except Exception as e:
                result = str(e)
        return JsonResponse({
            #"navigate": f"/python"
            "result": result,
        })
