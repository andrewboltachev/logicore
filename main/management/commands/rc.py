import sys
import tqdm
import typing as ty
from collections import defaultdict

from networkx.algorithms.operators.product import rooted_product
from rich import print
import glob
import os

import libcst
from django.core.management.base import BaseCommand, CommandError

from libcst_to_react.get_me_nodes import read_file
from main.models import RootedCopy
from main.parser.python import serialize_dc


def visit(node, f, path=""):
    f(node, path)
    if isinstance(node, (list, tuple)):
        for i, v in enumerate(node):
            visit(v, f, path=f"{path}.{i}".lstrip("."))
    elif isinstance(node, dict):
        for k, v in node.items():
            visit(v, f, path=f"{path}.{k}".lstrip("."))


def all_python_files(fs_path):
    for filename in glob.glob(os.path.join(fs_path, '**', '*.py'), recursive=True):
        if "node_modules/" in filename:
            continue
        if "/migrations/" in filename:
            continue
        if "/venv/" in filename:
            continue
        if ".venv/" in filename:
            continue
        if filename.startswith("venv/"):
            continue
        yield filename


def get_spellings(term):
    """
    Convert term into all spellings
    :param term: term, e.g. "foo-bar"
    :return: list of spellings, e.g.:
    ['foobar',
     'foo bar',
     'foo-bar',
     'foo_bar',
     'FOOBAR',
     'FOO BAR',
    ...]
    """
    options = []
    lower = [p.lower() for p in term.replace("_", "-").split("-")]
    upper = [p.upper() for p in lower]
    capitalize = [p.capitalize() for p in lower]
    capitalize_first = [capitalize[0]] + lower[1:]
    ig = [upper[0]] + capitalize[1:]
    capitalize_rest = [lower[0]] + capitalize[1:]
    for cased in [
        lower,
        upper,
        capitalize,
        capitalize_first,
        ig,  # FIXME
        capitalize_rest,  # camelCase ?
    ]:
        for joint in ["", " ", "-", "_"]:
            opt = joint.join(cased)
            if opt not in options:
                options.append(opt)
    print(options)
    return options


class Command(BaseCommand):
    help = 'Creates a RootedCopy model instance with provided fs_path, name_from, and name_to.'

    def add_arguments(self, parser):
        parser.add_argument('fs_path', type=str,
                            help='The filesystem path for the RootedCopy instance.')
        parser.add_argument('name_from', type=str,
                            help='The "name_from" string for the RootedCopy instance.')
        # parser.add_argument('name_to', type=str,
        #                     help='The "name_to" string for the RootedCopy instance.')
        parser.add_argument('--id', type=int, nargs='?', default=None,
                            help='Optional: ID of an existing RootedCopy to update. If not provided, a new instance will be created.')

    def handle(self, *args, **options):
        fs_path = options['fs_path']
        name_from = options['name_from']
        # name_to = options['name_to']

        spellings = get_spellings(name_from)

        result = {}

        for python_file in tqdm.tqdm(list(all_python_files(fs_path))):
            code = read_file(python_file)
            m = libcst.parse_module(code)
            #positions = {}
            parsed = serialize_dc(m)
            #print(f"Reading {python_file}")
            #print("positions:", positions)

            '''
            for path, pos in positions.items():
                # Make all (line and column) 0-based
                pos["start"]["line"] -= 1
                pos["end"]["line"] -= 1

            positions_reversed = defaultdict(dict)
            positions_data = sorted(
                positions.items(),
                key=lambda x: (
                    x[1]["start"]["line"],
                    x[1]["start"]["column"],
                    x[1]["end"]["line"],
                    x[1]["end"]["column"],
                ),
            )

            def coordinate_is_inside_position(
                position: ty.Dict[str, ty.Dict[str, int]], line: int, column: int
            ):
                if line == position["start"]["line"]:
                    return column >= position["start"]["column"]
                elif line == position["end"]["line"]:
                    return column <= position["end"]["column"]
                elif position["start"]["line"] < line < position["end"]["line"]:
                    return True
                else:
                    return False

            for line, chars in enumerate(code.splitlines()):
                for column in range(len(chars) + 1):  # вместе с \n
                    for path, position in positions_data:
                        if path == "":
                            continue
                        if coordinate_is_inside_position(position, line, column):
                            positions_reversed[line][column] = path
            '''

            paths = {}

            def visitor(node, path):
                if isinstance(node, dict):
                    match node.get("type"):
                        case "Name":
                            for spelling in spellings:
                                if spelling in node["value"]:
                                    paths[path] = {"status": "pending", "spelling": spelling}
                                    break
                        case "SimpleString":
                            for spelling in spellings:
                                if spelling in node["value"]:
                                    paths[path] = {"status": "pending", "spelling": spelling}
                                    break

            visit(parsed, visitor)
            if paths:
                result[python_file] = paths

        try:
            if options["id"]:
                try:
                    rooted_copy = RootedCopy.objects.get(id=options["id"])
                except RootedCopy.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"RootedCopy with id={options['id']} does not exist."))
                    sys.exit(1)
            else:
                rooted_copy = RootedCopy.objects.create(
                    fs_path=fs_path,
                )

            rooted_copy.name_from = name_from
            rooted_copy.name_to = ""
            rooted_copy.files = "\n".join(list(result.keys()))
            rooted_copy.items = result
            rooted_copy.save()

            self.stdout.write(self.style.SUCCESS(
                f'Successfully created RootedCopy #{rooted_copy.id}: "{rooted_copy.name_from}" "'
                f'"- "{rooted_copy.name_to}" with path "{rooted_copy.fs_path}"'
            ))
        except Exception as e:
            raise CommandError(f'Error creating RootedCopy: {e}')

        num = sum([len(d) for d in result.values()])

        print(f"Found {num} occurrences in {len(result)} files.")