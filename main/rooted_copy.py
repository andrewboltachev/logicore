import libcst
import glob
import os

import copy
from dataclasses import _is_dataclass_instance, fields

dict_factory = lambda d: {
    f"{k}_param" if k == "type" else k: v for k, v in dict(d).items()
}


def serialize_dc(obj, *args):
    if _is_dataclass_instance(obj):
        result = []
        for f in fields(obj):
            value = serialize_dc(getattr(obj, f.name), dict_factory)
            result.append((f.name, value))
        return {**dict_factory(result), "type": obj.__class__.__name__}
    elif isinstance(obj, tuple) and hasattr(obj, "_fields"):
        # obj is a namedtuple.  Recurse into it, but the returned
        # object is another namedtuple of the same type.  This is
        # similar to how other list- or tuple-derived classes are
        # treated (see below), but we just need to create them
        # differently because a namedtuple's __init__ needs to be
        # called differently (see bpo-34363).

        # I'm not using namedtuple's _asdict()
        # method, because:
        # - it does not recurse in to the namedtuple fields and
        #   convert them to dicts (using dict_factory).
        # - I don't actually want to return a dict here.  The main
        #   use case here is json.dumps, and it handles converting
        #   namedtuples to lists.  Admittedly we're losing some
        #   information here when we produce a json list instead of a
        #   dict.  Note that if we returned dicts here instead of
        #   namedtuples, we could no longer call asdict() on a data
        #   structure where a namedtuple was used as a dict key.

        return type(obj)(*[serialize_dc(v, dict_factory) for v in obj])
    elif isinstance(obj, (list, tuple)):
        # Assume we can create an object of this type by passing in a
        # generator (which is not true for namedtuples, handled
        # above).
        return type(obj)(serialize_dc(v, dict_factory) for v in obj)
    elif isinstance(obj, dict):
        return type(obj)(
            (serialize_dc(k, dict_factory), serialize_dc(v, dict_factory))
            for k, v in obj.items()
        )
    else:
        return copy.deepcopy(obj)


def node_class(name):
    return getattr(__import__("libcst"), name)


def unserialize_dc(s, k=None):
    from libcst import MaybeSentinel
    # TODO: rename comment post

    if s == "MaybeSentinel.DEFAULT":
        return MaybeSentinel.DEFAULT
    if type(s) == list:
        s = [unserialize_dc(x) for x in s]
        if k in ["lpar", "rpar"]:
            s = tuple(s)
        return s
    if type(s) == tuple:
        return tuple([unserialize_dc(x) for x in list(s)])
    if type(s) != dict or not "type" in s:
        return s
    args = {
        "type" if k == "type_param" else k: unserialize_dc(v, k)
        for k, v in s.items()
        if k != "type"
    }
    try:
        klass = node_class(s["type"])
    except AttributeError as e:
        import ipdb; ipdb.set_trace() # BREAKPOINT
    try:
        return klass(**args)
    except Exception as e:
        print(klass)
        print(s)
        print(args)
        raise


def read_file(filename):
    with open(filename, "r") as f:
        return f.read()


def write_file(filename, text):
    with open(filename, "w") as f:
        return f.write(text)


def walktree(node, f, path=None):
    if path is None:
        path = []
    t = type(node)
    if t == dict:
        result = {}
        for k, v in node.items():
            result[k] = walktree(v, f, path + [(k, node.get("type"))])
        return result
    elif t in [list, tuple, set]:
        result = []
        for i, x in enumerate(node):
            result.append(walktree(x, f, path + [(i, str(t))]))
        return t(result)
    else:
        return f(node, path)


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
    print(options)
    return options


def _term_in_file(filename, spellings):
    for line in open(filename, "r").readlines():
        for spelling in spellings:
            if spelling in line:
                return True
    return False


def find_term_in_files(fs_path, term):
    """
    Finds term in all python files in fs_path
    :param fs_path:
    :return:
    """
    python_files = glob.glob(os.path.join(fs_path, '**', '*.py'), recursive=True)
    filenames = []
    for filename in python_files:
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
        print(f"Reading: {filename}")
        spellings = get_spellings(term)
        if _term_in_file(filename, spellings):
            filenames.append(filename)
    return filenames