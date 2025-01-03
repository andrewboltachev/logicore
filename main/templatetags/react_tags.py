import os
import re

from django import template
from django.conf import settings
from django.utils.safestring import SafeString

import requests

register = template.Library()


@register.simple_tag(takes_context=True)
def include_react_head(context):
    if not settings.FRONTEND_DEV_MODE:
        return ''
    return SafeString(" ".join(context["_REACT_SCRIPTS"].scripts[:3]))


@register.simple_tag(takes_context=True)
def include_react_body(context):
    if not settings.FRONTEND_DEV_MODE:
        return ''
    return SafeString(" ".join(context["_REACT_SCRIPTS"].scripts[3:]))
