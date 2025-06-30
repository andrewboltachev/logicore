import re
import sys
from pathlib import Path

import tqdm

from rich import print

import libcst
from django.core.management.base import BaseCommand, CommandError
from django.template import Variable

from libcst_to_react.get_me_nodes import read_file
from main.git_utils import get_git_info_subprocess
from main.models import RootedCopy
from main.parser.python import serialize_dc, unserialize_dc

import errno
import os

def mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as exc:  # Python ≥ 2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        # possibly handle other errno cases here, otherwise finally:
        else:
            raise


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


def walk3(node, handler):
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
                if added := handler(newPath, v):
                    result.append(added)
                else:
                    result.append(f(v, path=newPath))
            return result
        elif isinstance(node, tuple):
            result = []
            for i, v in enumerate(node):
                newPath = f"{path}.{i}".lstrip(".")
                if added := handler(newPath, v):
                    result.append(added)
                else:
                    result.append(f(v, path=newPath))
            return tuple(result)
        return node
    return f(node)


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
            options.append(joint.join(cased))
    return options


def make_replace_fn(regexp, terms, replace):
    replace_map = {}
    if terms and len(terms[0].split("-")) > 1:
        replace_spellings = get_spellings(replace)
        for term in terms:
            replace_map.update(
                dict(map(lambda a, b: [a, b], get_spellings(term), replace_spellings))
            )
    else:
        t = terms[0]
        r = replace.split("-")
        replace_map = {
            t.lower(): "_".join([w.lower() for w in r]),
            t.lower().capitalize(): "".join([w.lower().capitalize() for w in r]),
            t.upper(): "_".join([w.upper() for w in r]),
        }
    print("Replace map")
    print(replace_map)

    def replace_fn(value, *args, **kwargs):
        if type(value) != str:
            return value

        def repl(matchobj):
            value = matchobj.group()
            if matched := replace_map.get(value, None):
                return matched
            else:
                print(f"WARNING: no match for {value}")
                return value

        return re.sub(regexp, repl, value)

    return replace_fn


def f1(term, replacement, **kwargs):
    variants = []
    terms = [term]
    for v in terms:
        parts = [re.escape(p) for p in v.split("-")]
        variants.append(r"[ \-\_]?".join(parts))
    regexp = f"({'|'.join(variants)})"
    result_parts = [re.escape(p) for p in replacement.split("-")]
    result_regexp = r"[ \-\_]?".join(result_parts)
    regexp = re.compile(regexp, flags=re.I)
    print("The regexp", regexp)
    return make_replace_fn(regexp, terms, replacement)


def byone_replacer(name_from, name_to, **kwargs):
    context = kwargs
    def f(term, **context):
        nonlocal name_from, name_to
        # "lower"
        variant_from = name_from.lower()

        if variant_from in term:
            chunks = name_to.lower().split("-")
            if "-" in term:
                variant_to = "-".join(chunks)
            elif "_" in term:
                variant_to = "_".join(chunks)
            else:
                # FIXME why check this?
                if 'outer_node' in context and context['outer_node']['type'] == 'SimpleString':
                    print(f"WARNING: falling back to hyphen-joined for {term}")
                    variant_to = "-".join(chunks)
                else:
                    print(f"WARNING: falling back to underscore-joined for {term}")
                    variant_to = "_".join(chunks)
            return term.replace(variant_from, variant_to)

        # "upper"
        variant_from = name_from.upper()
        if variant_from in term:
            chunks = name_to.upper().split("-")
            if "-" in term:
                variant_to = "-".join(chunks)
            elif "_" in term:
                variant_to = "_".join(chunks)
            else:
                print(f"WARNING: falling back to underscore-joined for {term}")
                variant_to = "_".join(chunks)
            return term.replace(variant_from, variant_to)

        # "Capitalized"
        variant_from = name_from.lower().capitalize()
        if variant_from in term:
            chunks = [chunk.capitalize() for chunk in name_to.lower().split("-")]
            variant_to = "".join(chunks)
            return term.replace(variant_from, variant_to)

        print(f"WARNING: didn't find value in: {term}")
        return term

    return f


def rreplace(s, old, new, count):
    return (s[::-1].replace(old[::-1], new[::-1], count))[::-1]


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

        git_params = get_git_info_subprocess(rc.fs_path)
        if git_params['is_dirty']:
            sys.stderr.write(f"Git is dirty, cannot perform work")
            sys.exit(1)

        if saved_git_params := rc.git_params:
            if saved_git_params["commit_hash"] != git_params["commit_hash"]:
                sys.stderr.write(
                    f"Commit hash mismatch: Saved: {saved_git_params['commit_hash']} != Git: {git_params['commit_hash']}.\n"
                )
                sys.stderr.write(f"Saved: {rc.git_params}")
                sys.exit(1)
        else:
            sys.stderr.write(f"Warning: no git params, proceeding without check\n")

        if "-" not in rc.name_from and "-" in options["name_to"]:
            replacer = byone_replacer(rc.name_from, options['name_to'])
        else:
            replacer = f1(rc.name_from, options['name_to'])

        full_paths = rc.full_paths.split("\n")

        def included_fully(filename):
            for full_path in full_paths:
                if not full_path.endswith(".py"):
                    full_path = full_path + "/"
                if filename.startswith(full_path):
                    return True
            return False

        for python_file in tqdm.tqdm(rc.files.split("\n")):
            filename = python_file
            code = read_file(filename)
            m = libcst.parse_module(code)
            parsed = serialize_dc(m)

            if included_fully(filename.replace(rc.fs_path, "")):
                # TODO... you know it
                short_filename = filename.replace(rc.fs_path, "")
                new_filename_short = replacer(short_filename)
                new_filename = (Path(rc.fs_path) / Path(new_filename_short)).as_posix()
                print(f"Will copy {short_filename} to {new_filename_short}")

                # begin
                # current_parent_paths = rc.parent_paths.get(python_file, [])
                current_child_paths = rc.items.get(python_file, {})
                current_cancelled_child_paths = rc.cancelled_items.get(python_file, [])

                the_map = {
                    current_child_path: item
                    for current_child_path, item in current_child_paths.items()
                    if (
                        current_child_path not in current_cancelled_child_paths
                    )
                }
                original = parsed
                def handler2(node, child_path):  # с value
                    child_path_minus_value = ".".join(child_path.split(".")[:-1])  # без value
                    if v := the_map.get(child_path_minus_value):  # без value
                        outer_node = Variable(child_path_minus_value).resolve(original)
                        node = replacer(node, outer_node=outer_node, **v)
                    return node
                processed = walk2(parsed, handler2)
                # end

                result = unserialize_dc(processed).code
                mkdir_p(os.path.dirname(new_filename))
                with open(new_filename, "w") as f:
                    f.write(result)


            else:
                current_parent_paths = rc.parent_paths.get(python_file, [])
                current_child_paths = rc.items.get(python_file, {})
                current_cancelled_child_paths = rc.cancelled_items.get(python_file, [])

                def handler(parent_path, node):
                    if parent_path in current_parent_paths:
                        the_map = {
                            current_child_path.replace(f"{parent_path}.", "") + ".value": item  # TODO
                            for current_child_path, item in current_child_paths.items()
                            if (
                                current_child_path.startswith(f"{parent_path}.")
                                and current_child_path not in current_cancelled_child_paths
                            )
                        }
                        original = node
                        def handler2(node, child_path):
                            if v := the_map.get(child_path):
                                outer_node = Variable(".".join(child_path.split(".")[:-1])).resolve(original)
                                return replacer(node, outer_node=outer_node, **v)
                            return node
                        return walk2(node, handler2)
                    return None
                processed = walk(parsed, handler)

                result = unserialize_dc(processed).code
                if result != code:
                    with open(filename, "w") as f:
                        f.write(result)

        print(f"Done.")
