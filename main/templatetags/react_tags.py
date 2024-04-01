from django import template
from django.utils.safestring import SafeString
import requests, os, re
from django.conf import settings


register = template.Library()


@register.simple_tag(takes_context=True)
def include_react(context):
    if not settings.FRONTEND_DEV_MODE:
        return ''
    return SafeString(
        ' '.join(re.findall(r'<script [^>]+></script>', requests.get('http://localhost:3008/').text.replace('/static/', '/react-static/')))
    )

