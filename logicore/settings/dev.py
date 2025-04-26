import os
from .base import *


# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "logicore",
        "USER": "logicore",
        "PASSWORD": "logicore",
        "HOST": "127.0.0.1",
        "PORT": "5438",
    }
}

INSTALLED_APPS += ["django_extensions"]

MAIL_DEBUG = True
FRONTEND_DEV_MODE = True
DEBUG= True
