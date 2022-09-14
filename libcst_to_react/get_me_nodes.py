import libcst
from libcst._nodes.internal import CodegenState
from collections.abc import Iterable
from functools import reduce
from ..main.parser.python import serialize_dc


def all_subclasses(cls):
    for c in cls.__subclasses__():
        for s in all_subclasses(c):
            yield s
        yield c

def read_file(filename):
    with open(filename, 'r') as f:
        return f.read()


def write_file(filename, text):
    with open(filename, 'w') as f:
        return f.write(text)


all_cst_nodes = list(all_subclasses(libcst.CSTNode))

leaf_cst_nodes = [x for x in all_cst_nodes if not x.__subclasses__()]

module_cache = {}

def rsetattr(obj, attr, val):
    pre, _, post = attr.rpartition('.')
    return setattr(rgetattr(obj, pre) if pre else obj, post, val)

def rgetattr(obj, attr, *args):
    def _getattr(obj_, attr_):
        return getattr(obj_, attr_, *args)
    return reduce(_getattr, [obj] + attr.split('.'))

def load_module(module_name):
    found = module_cache.get(module_name, None)
    module_name, tail = module_name.split(".", 1)
    if found:
        return found
    module = __import__(module_name)
    if tail:
        module = rgetattr(module, tail)
    file = module.__file__
    added = libcst.parse_module(read_file(file))
    module_cache[module_name] = added
    return added

def locate_class(class_name):
    found = None
    for x in leaf_cst_nodes:
        if x.__name__ == class_name:
            found = x
            break
    else:
        raise Exception(f"{class_name} not found as CST node")
    return found

def code_for_node(node):
    """
    Should work for simple nodes?
    """
    s = CodegenState(default_indent='    ', default_newline='\n')
    r1 =  node._codegen(s)
    r2 = ''.join(s.tokens)
    return r2


#def is_ImportFrom_for_name(node, name):
#    if type(node) == libcst.ImportFrom and name in [code_for_node(x.name) for x in node.names]:
#        return code_for_node(node.module)

def is_a_class_of_name(node, name):
    if type(node) == libcst.ClassDef and code_for_node(node.name) == name:
        return node

def find_node(tree, pred):
    r = pred(tree)
    if r:
        return r
    if hasattr(tree, "body"):
        b = tree.body
        if not isinstance(b, Iterable):
            b = b.body
        for x in b:
            r = find_node(x, pred)
            if r:
                return r

def load_codegen_impl(klass):
    if type(klass) == str:
        klass = locate_class(klass)
    module = load_module(klass.__module__)
    cdef = find_node(module, lambda x: is_a_class_of_name(x, klass.__name__))
    r = find_node(cdef, lambda x: x if type(x) == libcst.FunctionDef and code_for_node(x.name) == "_codegen_impl" else None)
    #assert r, "Not found for " + klass.__name__
    return r

#print(load_codegen_impl('Del'))
for x in leaf_cst_nodes:
    impl = load_codegen_impl(x)
    if impl:
        print('# ' + x.__name__)
        print(code_for_node(impl))
