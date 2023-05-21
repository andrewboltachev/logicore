import requests
import json
from django.core.management.base import BaseCommand, CommandError
from main import models
from dataclasses import dataclass
from typing import Any
import glob
from libcst_to_react.get_me_nodes import read_file, write_file
from main.parser.python import serialize_dc, unserialize_dc
import libcst


class HaskellAPI:
    def __getattribute__(self, attr):
        def f(**params):
            resp = requests.post(f"http://localhost:3042/{attr}", json=params)
            if resp.status_code != 200:
                raise Exception(f"Error code {resp.status_code}")
            data = resp.json()
            error = data.get("error")
            if error:
                raise Exception(f"Error: {error}")
            return data
        return f


HASKELL = HaskellAPI()


@dataclass
class Vertex:
    pass


@dataclass
class FileSystem(Vertex):
    path: str

    def do(self):
        return glob.glob(f"{self.path}/**/*.py", recursive=True)

    def dump(self):
        for filename in self.do():
            print(filename[len(self.path) + 1 :])


@dataclass
class Arrow:
    source: Vertex
    target: Vertex


@dataclass
class Files(Arrow):
    files: [str]

    def forwards(self):
        p = self.source.path
        r = []
        for path in self.source.do():
            if path[len(p) + 1 :] not in self.files:
                continue
            print("read", path)
            module = libcst.parse_module(read_file(path))
            serialized = serialize_dc(module)
            filename = path[len(p) + 1 :]
            r.append(
                {
                    "type": "File",
                    "name": filename,
                    "value": serialized,
                }
            )
        self.target.data = r

    def backwards(self):
        p = self.source.path
        for file in self.target.data:
            path = p + "/" + file["name"]
            write_file(path, unserialize_dc(file["value"]).code)


class Data(Vertex):
    params: dict[str, Any] | None = None
    data: Any = None

    def dump(self):
        return json.dumps(self.data, indent=4)


# FileSystem "/home/andrey/Work/lc/LibCST"
# Files [1.py, 2.py, 3.py]


def l2l(lines):
    return [l for l in [l.strip() for l in lines.split("\n")] if l]


@dataclass
class Grammar(Arrow):
    grammar: Any  # aha, Any...

    def forwards(self):
        self.target.data = HASKELL.matchPatternWithFunnel(pattern=self.grammar, value=self.source.data)

    def backwards(self):
        pass

G1 = {
    "tag": "MatchFunnel",
}


@dataclass
class Selector(Arrow):
    key: Any

    def forwards(self):
        self.target.data = self.source.data[key]

    def backwards(self):
        self.source.data[key] = self.target.data


class Command(BaseCommand):
    help = "Hello world"

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        fs = FileSystem(path="/home/andrey/Work/lc/LibCST")
        d1 = Data()
        files = Files(
            source=fs,
            target=d1,
            files=l2l(
                """
libcst/_nodes/deep_equals.py
libcst/_nodes/base.py
libcst/_nodes/__init__.py
libcst/_nodes/module.py
libcst/_nodes/statement.py
libcst/_nodes/whitespace.py
libcst/_nodes/expression.py
libcst/_nodes/op.py
libcst/_nodes/internal.py"""
            ),
        )
        files.forwards()
        r1 = Data()
        g1 = Grammar(source=d1, target=r1, grammar=G1)
        g1.forwards()
        f1 = Data()
        funnel_selector1 = Selector(source=r1, target=f1, key="funnel")
        #files.backwards()
        print(f1.dump())
        self.stdout.write(self.style.SUCCESS("Hello world"))
