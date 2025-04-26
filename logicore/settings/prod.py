import os
from .base import *


# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "logicore",
        "USER": "logicore",
        "PASSWORD": os.environ["LOGICORE_DJANGO_DATABASE_PASSWORD"],
        "HOST": "127.0.0.1",
        "PORT": "5432",
    }
}
