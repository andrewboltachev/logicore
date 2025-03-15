from libcst.metadata import PositionProvider
from rich import print
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


class Command(BaseCommand):
    help = "Hello world"

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        code = """\
def hello():
    print("Hello world")"""
        module = libcst.parse_module(code)
        positions = {}
        serialized = serialize_dc(module, positions=positions)
        # print(serialized)
        print(positions)
        import ipdb

        ipdb.set_trace()  # BREAKPOINT
        self.stdout.write(self.style.SUCCESS("Hello world"))
