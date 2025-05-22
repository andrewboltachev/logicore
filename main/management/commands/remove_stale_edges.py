import json
from django.core.management.base import BaseCommand, CommandError
from main import models


class Command(BaseCommand):
    help = "Hello world"

    def handle(self, *args, **options):
        for f in models.Fiddle.objects.filter(kind="LOGICORE1"):
            if "nodes" not in f.data:
                continue
            if "edges" not in f.data:
                continue
            ids = [n["id"] for n in f.data["nodes"]]
            edges_before = len(f.data["edges"])
            f.data["edges"] = [
                e
                for e in f.data["edges"]
                if (e["source"] in ids) and (e["target"] in ids)
            ]
            edges_after = len(f.data["edges"])
            if edges_before != edges_after:
                print(f.uuid, edges_before, edges_after)
                f.save()