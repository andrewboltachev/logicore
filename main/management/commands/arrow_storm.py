import json
from django.core.management.base import BaseCommand, CommandError
from main import models


def handle(e):
    if not e["sourceHandle"]:
        e["sourceHandle"] = "arrowSource"
    if not e["targetHandle"]:
        e["targetHandle"] = "arrowTarget"


class Command(BaseCommand):
    help = "Hello world"

    def handle(self, *args, **options):
        for f in models.Fiddle.objects.filter(kind="LOGICORE1"):
            if "nodes" not in f.data:
                continue
            if "edges" not in f.data:
                continue
            for e in f.data["edges"]:
                handle(e)
            f.save()
