import json
import locale
import uuid
from itertools import groupby
from collections import defaultdict
from decimal import Decimal

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


class HomeApiView(MainView):
    in_menu = False
    url_path = "/"
    title = "Hello world"
    TEMPLATE = "ListView"

    def get_fields(self):
        return {
            "type": "Fields",
            "fields": [
                {"from_field": "name"},
            ],
            "layout": "ModalLayout"
        }

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {
            'items': list(
                models.Stratagem.objects.values('id', 'name', 'created_dt', 'modified_dt')
            ),
            'create_form': read_fields(self.get_fields(), models.Stratagem())
        }

    def post(self, request, *args, **kwargs):
        obj = write_fields(self.get_fields(), models.Stratagem(), json.loads(request.body)['data'])
        return JsonResponse({"redirect": f"/{obj.id}"})


class StratagemApiView(MainView):
    in_menu = False
    url_path = "/<int:id>"
    title = "Hello world"
    TEMPLATE = "GenericForm"

    def get_fields(self):
        return {
            "type": "Fields",
            "fields": [
                {"from_field": "name"},
                {"k": "data", "type": "FlowField"},
            ],
            #"layout": "ModalLayout"
        }

    def get_obj(self):
        return models.Stratagem.objects.get(pk=self.kwargs["id"])

    def get_data(self, request, *args, **kwargs):
        now_dt = now()
        now_date = now_dt.date()
        return {
            **read_fields(self.get_fields(), self.get_obj())
        }

    def post(self, request, *args, **kwargs):
        obj = write_fields(self.get_fields(), self.get_obj(), json.loads(request.body)['data'])
        return JsonResponse({"navigate": f"/{obj.id}"})
