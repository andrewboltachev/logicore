import re

import requests
from django.conf import settings


class ReactScripts:
    _scripts = None

    @property
    def scripts(self):
        if not self._scripts:
            html_text = requests.get("http://localhost:5173/").text
            self._scripts = list(re.findall(
                r"<script [^>]+>.*</script>",
                html_text.replace("/static/", "/react-static/"),
                re.DOTALL
            ))
        return self._scripts


def react(request):
    if settings.FRONTEND_DEV_MODE:
        return {
            'FRONTEND_DEV_MODE': True,
            '_REACT_SCRIPTS': ReactScripts(),
        }
