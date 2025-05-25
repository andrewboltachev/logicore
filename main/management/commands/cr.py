import copy
import sys
from pathlib import Path

import tqdm

from rich import print

import libcst
from django.core.management.base import BaseCommand, CommandError

from libcst_to_react.get_me_nodes import read_file
from main.models import RootedCopy
from main.parser.python import serialize_dc, unserialize_dc


def walk(node, handler):
    def f(node, path=""):
        if isinstance(node, dict):
            result = {}
            for k, v in node.items():
                result[k] = f(v, path=f"{path}.{k}".lstrip("."))
            return result
        elif isinstance(node, list):
            result = []
            for i, v in enumerate(node):
                newPath = f"{path}.{i}".lstrip(".")
                result.append(f(v, path=newPath))
                if added := handler(newPath, v):
                    result.append(added)
            return result
        elif isinstance(node, tuple):
            result = []
            for i, v in enumerate(node):
                newPath = f"{path}.{i}".lstrip(".")
                result.append(f(v, path=newPath))
                if added := handler(newPath, v):
                    result.append(added)
            return tuple(result)
        return node
    return f(node)


def walk2(node, handler):
    def f(node, path=""):
        if isinstance(node, dict):
            result = {}
            for k, v in node.items():
                result[k] = f(v, path=f"{path}.{k}".lstrip("."))
            return result
        elif isinstance(node, list):
            result = []
            for i, v in enumerate(node):
                result.append(f(v, path=f"{path}.{i}".lstrip(".")))
            return result
        elif isinstance(node, tuple):
            result = []
            for i, v in enumerate(node):
                result.append(f(v, path=f"{path}.{i}".lstrip(".")))
            return tuple(result)
        return handler(node, path)
    return f(node)


class Command(BaseCommand):
    help = 'Creates a RootedCopy model instance with provided fs_path, name_from, and name_to.'

    def add_arguments(self, parser):
        parser.add_argument('id', type=str,
                            help='RootedCopy ID.')
        parser.add_argument('name_to', type=str,
                            help='The "name_to" string for the RootedCopy instance.')

    def handle(self, *args, **options):
        try:
            rc = RootedCopy.objects.get(pk=options["id"])
        except RootedCopy.DoesNotExist:
            sys.stderr.write(f'RootedCopy {options["id"]} does not exist.\n')
            sys.exit(1)

        for python_file in tqdm.tqdm(rc.files.split("\n")):
            filename = python_file
            code = read_file(filename)
            m = libcst.parse_module(code)
            parsed = serialize_dc(m)
            current_parent_paths = rc.parent_paths.get(python_file, [])
            current_child_paths = rc.items.get(python_file, {})
            current_cancelled_child_paths = rc.cancelled_items.get(python_file, [])

            def handler(parent_path, node):
                print(parent_path)
                print(current_parent_paths)
                print()
                if parent_path in current_parent_paths:
                    the_map = {
                        parent_path.replace(f"{parent_path}.", ""): item
                        for current_child_path, item in current_child_paths.items()
                        if (
                            current_child_path.startswith(f"{parent_path}.")
                            and current_child_path not in current_cancelled_child_paths
                        )
                    }
                    def handler2(node, child_path):
                        if v := the_map.get(child_path):
                            return node.replace(v['spelling'], options['name_to'])
                        return node
                    return walk2(node, handler2)
                return None

            processed = walk(parsed, handler)
            result = unserialize_dc(processed).code
            if result != code:
                with open(filename, "w") as f:
                    f.write(result)

        print(f"Done.")
