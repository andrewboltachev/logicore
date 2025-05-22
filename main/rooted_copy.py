import glob
import os


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