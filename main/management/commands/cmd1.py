from django.core.management.base import BaseCommand, CommandError
from main import models
from dataclasses import dataclass


@dataclass
class FileSystem:
    path: str

    @classmethod
    def do(cls, params):
        return {"files": glob.glob(f"{params['path']}/**/*.py", recursive=True)}


@dataclass
class Files:
    files: [str]

    @classmethod
    def forwards(cls, params):
        import libcst
        from main.parser.python import serialize_dc

        p = params["source"]["path"]
        r = []
        for path in params["value"]:
            module = libcst.parse_module(read_file(path))
            serialized = serialize_dc(module)
            filename = path[len(p) + 1:]
            r.append({
                "type": "File",
                "name": filename,
                "value": serialized,
            })
        return {"data": r}


    @classmethod
    def backwards(cls, params):
        from main.parser.python import unserialize_dc

        p = params["source"]["path"]
        for file in params["target"]["data"]:
            path = p + "/" + file["name"]
            write_file(path, unserialize_dc(file["value"]).code)
        return {}

# FileSystem "/home/andrey/Work/lc/LibCST"
# Files [1.py, 2.py, 3.py]

class Command(BaseCommand):
    help = 'Hello world'

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Hello world'))
