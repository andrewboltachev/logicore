import sys
import re
import libcst
import json
from libcst._nodes.internal import CodegenState
from collections.abc import Iterable
from functools import reduce
from collections import defaultdict
from main.parser.python import serialize_dc, unserialize_dc
from libcst_to_react.nodes_params import nodes_params


def clean_split(lines):
    return [x for x in [x.strip() for x in lines.split("\n")] if x]


def all_subclasses(cls):
    for c in cls.__subclasses__():
        for s in all_subclasses(c):
            yield s
        yield c


def read_file(filename):
    with open(filename, "r") as f:
        return f.read()


def write_file(filename, text):
    with open(filename, "w") as f:
        return f.write(text)


all_cst_nodes = list(all_subclasses(libcst.CSTNode))

leaf_cst_nodes = []

for x in all_cst_nodes:
    if not x.__subclasses__():
        if x not in leaf_cst_nodes:
            leaf_cst_nodes.append(x)

module_cache = {}


def rsetattr(obj, attr, val):
    pre, _, post = attr.rpartition(".")
    return setattr(rgetattr(obj, pre) if pre else obj, post, val)


def rgetattr(obj, attr, *args):
    def _getattr(obj_, attr_):
        return getattr(obj_, attr_, *args)

    return reduce(_getattr, [obj] + attr.split("."))


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
    s = CodegenState(default_indent="    ", default_newline="\n")
    r1 = node._codegen(s)
    r2 = "".join(s.tokens)
    return r2


# def is_ImportFrom_for_name(node, name):
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
    r = find_node(
        cdef,
        lambda x: (
            x
            if type(x) == libcst.FunctionDef
            and code_for_node(x.name) == "_codegen_impl"
            else None
        ),
    )
    # assert r, "Not found for " + klass.__name__
    return r


def load_statements(klass):
    if type(klass) == str:
        klass = locate_class(klass)
    module = load_module(klass.__module__)
    cdef = find_node(module, lambda x: is_a_class_of_name(x, klass.__name__))
    r = []
    for n in cdef.body.body:
        if (
            type(n) == libcst.SimpleStatementLine
            and len(n.body) == 1
            and type(n.body[0]) == libcst.AnnAssign
        ):
            r.append(n.body[0])
    return r


def load_whole_class(klass):
    if type(klass) == str:
        klass = locate_class(klass)
    module = load_module(klass.__module__)
    cdef = find_node(module, lambda x: is_a_class_of_name(x, klass.__name__))
    return cdef


MATCH_PATTERN = r"^__[\d]+$"


def node_by_name(pattern, name):
    for node in all_subclasses(pattern.mro()[-2]):  # TODO
        if node.__name__ == name:
            return node


class SelfRef:
    pattern = """__1(__2)"""


def match_code(code, pattern):
    """
    If code matches pattern,
    returns map of substitutions, e.g. {"___1": "value"},
    else, if not substitutions found - True,
    otherwise None
    """
    acc = {}
    orig_pattern = pattern

    def walk(code, pattern):
        if type(pattern) == dict:
            # 1. Name pattern case
            if (
                pattern.get("type") == "Expr"
                and pattern["value"]["type"] == "Call"
                and pattern["value"]["func"]["type"] == "Name"
                and "name" in pattern["value"]["func"]
                and re.match(MATCH_PATTERN, pattern["value"]["func"]["name"])
            ):
                acc_param = pattern["value"]["func"]["name"]
                reference = pattern["value"]["args"][0]["value"]["value"]
                ref_node = node_by_name(orig_pattern, reference)
                r = match_code(code, ref_node)
                if r:
                    if acc_param in acc:
                        if (
                            acc[acc_param] != r
                        ):  # TODO: just False, i.e. aviod usage twice?
                            return False
                    else:
                        acc[acc_param] = r
                    return True
                else:
                    return False
            elif pattern.get("type") == "Name" and re.match(
                MATCH_PATTERN, pattern.get("value")
            ):
                if (
                    "value" not in code
                ):  # XXX "matchable" node must have different criteria
                    # TODO: check what nodes have "value"
                    return False
                if pattern["value"] not in acc:
                    acc[pattern["value"]] = code["value"]
                    return True
                elif acc[pattern["value"]] == code["value"]:
                    return True
                else:
                    # print(f"type mismatch. expected: {pattern.get('type')}, found: {code.get('type')}")
                    return False
            # XXX
            if code == libcst.MaybeSentinel.DEFAULT:  # TODO
                return True
            if code.get("type") != pattern.get("type"):
                return False
            # 2. Individual nodes
            node_params = nodes_params[pattern["type"]]
            for k in node_params:
                if k not in ["body"]:
                    if not walk(
                        code[k], pattern[k]
                    ):  # TODO compare nodes vs. values - derive from types?
                        # print(f"param mismatch: {k} expected to be {pattern[k]}, got {code[k]}")
                        return False
            # 3. body (dict/list)
            if "body" in pattern:
                if type(pattern["body"]) != type(code.get("body")):
                    return False
                if type(pattern["body"]) == dict:
                    if "body" in pattern["body"] and len(pattern["body"]["body"]) > 0:
                        m = match_code(pattern["body"]["body"][0], SelfRef)
                        if m and m[1]["__1"] == "__0":
                            reference = m[1]["__2"]
                            ref_node = node_by_name(orig_pattern, reference)
                            if ref_node.__dict__.get("kind") != "PlusOr":
                                raise Exception(f"Not a PlusOr node: {ref_node}")
                            body_match = match_code(
                                code["body"], ref_node
                            )  # code is IntendedBlock
                            if body_match:
                                acc["__body"] = body_match
                                return True
                            else:
                                return False

                    return walk(code["body"], pattern["body"])
                else:  # must be list
                    if len(pattern["body"]) != len(code["body"]):
                        # print(f"list length mismatch. expected: {len(pattern['body'])}, found: {len(code['body'])}")
                        return False
                    for c, p in zip(code["body"], pattern["body"]):
                        if not walk(c, p):
                            return False
                    return True
            # for case 2, after body also checked
            return True
        elif isinstance(pattern, Iterable) and type(pattern) != str:
            for c, p in zip(list(code), list(pattern)):
                if not walk(c, p):
                    return False
            return True
        else:
            return pattern == code

    kind = pattern.__dict__.get("kind", None)
    if not kind:
        if hasattr(pattern, "pattern"):
            kind = "Pattern"
        elif len(pattern.mro()) == 2:  # TODO
            kind = "Top"
        else:
            kind = "Or"

    if kind == "Or":
        for s in pattern.__subclasses__():
            r = match_code(code, s)
            if r:
                return (pattern, r)
        return False
    elif kind == "PlusOr":  # code is IntendedBlock...
        result = []
        for code1 in code["body"]:
            for s in pattern.__subclasses__():
                r = match_code(code1, s)
                if r:
                    result.append(r)
                    break
            else:
                return False
        return (pattern, result)
    elif kind == "Pattern":
        if hasattr(orig_pattern, "_serialized"):
            pattern = orig_pattern._serialized
        else:
            pattern = serialize_dc(libcst.parse_module(pattern.pattern))["body"][0]
            orig_pattern._serialized = pattern
        if not walk(code, pattern):
            return False
        else:
            return (orig_pattern, acc)
    else:
        raise Exception(f"Unknown node kind: {kind}")


"""
Pattern
    Root[]
        Main
        With1(MainL)
        With2(MainL)
    Expr
    ...
    MainL[]
        Main
            VarSelfAssign
            AddToken
"""


class Pattern:
    pass


class Root(Pattern):
    kind = "PlusOr"


class MainL(Pattern):
    kind = "PlusOr"


class Main(Root, MainL):
    pass


class VarSelfAssign(Main):
    pattern = """__1 = self.__1"""


# class VarAssign(Main):
#    pattern = """__1 = __0(Expr)"""


class AddNewLine(Main):
    pattern = """state.add_token(state.default_newline if value is None else value)"""


class AddToken(Main):
    pattern = """state.add_token(__1)"""


class ChildElement(Main):
    pattern = """self.__1._codegen(state)"""


class MultipleChildElements(Main):
    pattern = """\
for __2 in self.__1:
    __2._codegen(state)
    """


class MultipleVarChildElements(Main):
    pattern = """\
for __2 in __1:
    __2._codegen(state)
    """


class Indent(Main):
    pattern = """\
if self.indent:
    state.add_indent_tokens()
    """


class VarUse(Main):
    pattern = """\
if __1 is not None:
    __1._codegen(state)
"""


class Node01(Main):
    pattern = """\
lastslice = len(self.slice) - 1
"""


class Node02(Main):
    pattern = """\
for i, slice in enumerate(self.slice):
    slice._codegen(state, default_comma=(i != lastslice))
"""


class Node03(Main):
    pattern = """\
if len(elements) == 1:
    elements[0]._codegen(
        state, default_comma=True, default_comma_whitespace=False
    )
else:
    for idx, el in enumerate(elements):
        el._codegen(
            state,
            default_comma=(idx < len(elements) - 1),
            default_comma_whitespace=True,
        )
"""


class Node04(Main):
    pattern = """\
for idx, el in enumerate(elements):
    el._codegen(
        state,
        default_comma=(idx < len(elements) - 1),
        default_comma_whitespace=True,
    )
"""


class Node05(Main):
    pattern = """\
for __2 in self.__1:
    __2._codegen(state)
"""


class Node06(Main):
    pattern = """\
if isinstance(whitespace_after_lambda, MaybeSentinel):
    if not (
        len(self.params.posonly_params) == 0
        and len(self.params.params) == 0
        and not isinstance(self.params.star_arg, Param)
        and len(self.params.kwonly_params) == 0
        and self.params.star_kwarg is None
    ):
        # We have one or more params, provide a space
        state.add_token(" ")
elif isinstance(whitespace_after_lambda, BaseParenthesizableWhitespace):
    whitespace_after_lambda._codegen(state)
"""


class Node07(Main):
    pattern = """\
lastarg = len(self.args) - 1
"""


class Node08(Main):
    pattern = """\
for i, arg in enumerate(self.args):
    arg._codegen(state, default_comma=(i != lastarg))
"""


class Node09(Main):
    pattern = """\
if isinstance(whitespace_after_yield, BaseParenthesizableWhitespace):
    whitespace_after_yield._codegen(state)
else:
    # Only need a space after yield if there is a value to yield.
    if self.value is not None:
        state.add_token(" ")
"""


class Node10(Main):
    pattern = """\
if isinstance(value, From):
    value._codegen(state, default_space="")
elif value is not None:
    value._codegen(state)
"""


class Node12(Main):
    pattern = """\
self._codegen_comma(state, default_comma, default_comma_whitespace)
"""


class NotNoneCodegen(Main):
    pattern = """\
if __1 is not None:
    __1._codegen(state)
"""


class Node13(Main):
    pattern = """\
for idx, __2 in enumerate(__1):
    __2._codegen(state, default_comma=(idx < len(__1) - 1))
"""


class Node14(Main):
    pattern = """\
__2 = self.__1
"""


class Node15(Main):
    pattern = """\
patlen = len(pats)
"""


class Node16(Main):
    pattern = """\
for idx, pat in enumerate(pats):
    pat._codegen(
        state,
        default_comma=patlen == 1 or (idx < patlen - 1),
        default_comma_whitespace=patlen != 1,
    )
"""


class Node17(Main):
    pattern = """\
for idx, el in enumerate(elems):
    el._codegen(
        state, default_comma=rest is not None or idx < len(elems) - 1
    )
"""


class VarCodegen(Main):
    pattern = """\
__1._codegen(state)
"""


class Node18(Main):
    pattern = """\
for idx, pat in enumerate(pats):
    pat._codegen(state, default_comma=idx + 1 < len(pats) + len(kwds))
"""


class Node19(Main):
    pattern = """\
for idx, kwd in enumerate(kwds):
    kwd._codegen(state, default_comma=idx + 1 < len(kwds))
"""


class Node20(Main):
    pattern = """\
for idx, pat in enumerate(pats):
    pat._codegen(state, default_separator=idx + 1 < len(pats))
"""


class Node21(Main):
    pattern = """\
for spec in format_spec:
    spec._codegen(state)
"""


class Node22(Main):
    pattern = """\
if second_colon is MaybeSentinel.DEFAULT and self.step is not None:
    state.add_token(":")
elif isinstance(second_colon, Colon):
    second_colon._codegen(state)
"""


class Node23(Main):
    pattern = """\
if comma is MaybeSentinel.DEFAULT and default_comma:
    state.add_token(", ")
elif isinstance(comma, Comma):
    comma._codegen(state)
"""


class InstanceCheck(Main):
    pattern = """\
if isinstance(__1, __2):
    __0(MainL)
"""


class VarToVarAssign(Main):
    pattern = """\
__2 = __1
"""


class VarToVarAssign(Main):
    pattern = """\
__2 = __1
"""


class CodegenErrorIfNone(Main):
    pattern = """\
if __1 is None:
    raise CSTCodegenError(
        __2
    )
"""


class Node25(Main):
    pattern = """\
if isinstance(whitespace_before_indicator, BaseParenthesizableWhitespace):
    whitespace_before_indicator._codegen(state)
elif isinstance(whitespace_before_indicator, MaybeSentinel):
    if default_indicator == "->":
        state.add_token(" ")
else:
    raise Exception("Logic error!")
"""


class Node26(Main):
    pattern = """\
if annotation is not None:
    annotation._codegen(state, default_indicator=":")
"""


class Node27(Main):
    pattern = """\
if equal is MaybeSentinel.DEFAULT and self.default is not None:
    state.add_token(" = ")
elif isinstance(equal, AssignEqual):
    equal._codegen(state)
"""


class Node28(Main):
    pattern = """\
if isinstance(star_arg, MaybeSentinel):
    starincluded = len(self.kwonly_params) > 0
elif isinstance(star_arg, (Param, ParamStar)):
    starincluded = True
else:
    starincluded = False
"""


class Node29(Main):
    pattern = """\
for i, param in enumerate(self.posonly_params):
    param._codegen(state, default_star="", default_comma=True)
"""


class Node30(Main):
    pattern = """\
more_values = (
    starincluded
    or len(self.params) > 0
    or len(self.kwonly_params) > 0
    or self.star_kwarg is not None
)
"""


class Node31(Main):
    pattern = """\
if isinstance(posonly_ind, ParamSlash):
    # Its explicitly included, so render the version we have here which
    # might have spacing applied to its comma.
    posonly_ind._codegen(state, default_comma=more_values)
elif len(self.posonly_params) > 0:
    if more_values:
        state.add_token("/, ")
    else:
        state.add_token("/")
"""


class Node32(Main):
    pattern = """\
more_values = (
    starincluded or len(self.kwonly_params) > 0 or self.star_kwarg is not None
)
"""


class Node33(Main):
    pattern = """\
for i, param in enumerate(self.params):
    param._codegen(
        state, default_star="", default_comma=(i < lastparam or more_values)
    )
"""


class Node34(Main):
    pattern = """\
if isinstance(star_arg, MaybeSentinel):
    if starincluded:
        state.add_token("*, ")
elif isinstance(star_arg, Param):
    more_values = len(self.kwonly_params) > 0 or self.star_kwarg is not None
    star_arg._codegen(state, default_star="*", default_comma=more_values)
elif isinstance(star_arg, ParamStar):
    star_arg._codegen(state)
"""


class Node35(Main):
    pattern = """\
more_values = self.star_kwarg is not None
"""


class Node36(Main):
    pattern = """\
for i, param in enumerate(self.kwonly_params):
    param._codegen(
        state, default_star="", default_comma=(i < lastparam or more_values)
    )
"""


class Node37(Main):
    pattern = """\
if star_kwarg is not None:
    star_kwarg._codegen(state, default_star="**", default_comma=False)
"""


class Node38(Main):
    pattern = """\
if equal is MaybeSentinel.DEFAULT and self.keyword is not None:
    state.add_token(" = ")
elif isinstance(equal, AssignEqual):
    equal._codegen(state)
"""


class Node39(Main):
    pattern = """\
if isinstance(whitespace_before_from, BaseParenthesizableWhitespace):
    whitespace_before_from._codegen(state)
else:
    state.add_token(default_space)
"""


class Node40(Main):
    pattern = """\
_BaseSimpleStatement._codegen_impl(self, state)
"""


class Node41(Main):
    pattern = """\
state.increase_indent(state.default_indent if indent is None else indent)
"""


class LenMinusOne(Main):
    pattern = """\
__2 = len(self.__1) - 1
"""


class RecordSyntacticPosition(Root):
    pattern = """\
with state.record_syntactic_position(self):
    __0(MainL)
"""


class Parenthesize(Root):
    pattern = """\
with self._parenthesize(state):
    __0(MainL)
"""


class ParenthesizeBracketize(Root):
    pattern = """\
with self._parenthesize(state), self._bracketize(state):
    __0(MainL)
"""


class ParenthesizeBraceize(Root):
    pattern = """\
with self._parenthesize(state), self._braceize(state):
    __0(MainL)
"""


class IfNotNone(Main):
    pattern = """\
if __1 is not None:
    __0(MainL)
"""


class WsIfDefault(Main):
    pattern = """\
if __1 is MaybeSentinel.DEFAULT:
    state.add_token(" ")
elif isinstance(__1, BaseParenthesizableWhitespace):
    __1._codegen(state)
"""


class DefaultName(Main):
    pattern = """\
if name is None:
    state.add_token("_")
else:
    name._codegen(state)
"""


# ...


class Expr(Pattern):
    pattern = """__1"""  # TODO


cmd = None
try:
    cmd = sys.argv[1]
except IndexError:
    pass


if cmd == "1":
    seen = set([])
    for x in leaf_cst_nodes:
        if x.__name__ in seen:
            continue
        seen.add(x.__name__)  # FIXME what's that?
        impl = load_codegen_impl(x)
        if impl:
            print("# " + x.__name__)
            print("->")
            for line in impl.body.body:
                # "normal" case
                line_s = serialize_dc(line)
                r = match_code({"body": [line_s]}, Root)  # emulate IntendedBlock
                if r:
                    print(r)
                else:
                    print("cannot match:\n\n" + code_for_node(line))
                    sys.exit(1)
            print("<-")
elif cmd == "2":
    result = defaultdict(list)
    seen = set([])
    for x in all_cst_nodes:
        if x.__name__ in seen:
            continue
        # print('# ' + x.__name__)
        seen.add(x.__name__)  # FIXME what's that?
        for r in load_statements(x):
            # print('# ' + x.__name__)
            # print(code_for_node(r.target))
            result[r.target.value].append(x.__name__)
    # print('-*- ' * 20)
    for k, v in result.items():
        print(k)
        for z in v:
            print(f"\t{z}")
elif cmd == "3":
    result = defaultdict(list)
    seen = set([])
    for x in all_cst_nodes:
        if x.__name__ in seen:
            continue
        # print('# ' + x.__name__)
        seen.add(x.__name__)  # FIXME what's that?
        for r in load_statements(x):
            # print('# ' + x.__name__)
            # print(code_for_node(r.target))
            x = code_for_node(r)
            if x not in result[r.target.value]:
                result[r.target.value].append(x)
    # print('-*- ' * 20)
    for k, v in result.items():
        print(k)
        for z in v:
            print(f"\t{z}")
elif cmd == "4":
    ignore_params = clean_split(
        """\
    first_line
    empty_lines
    indent
    newline
    lpar
    rpar
    colon
    header
    footer
    leading_lines
    lines_after_decorators
    """
    )
    result = {}
    seen = set([])
    for x in all_cst_nodes:
        if x.__name__ in seen:
            continue
        # print('# ' + x.__name__)
        seen.add(x.__name__)  # FIXME what's that?
        result[x.__name__] = []
        for r in load_statements(x):
            if (r.target.value not in ignore_params) and not re.match(
                r".*white.*", r.target.value
            ):
                result[x.__name__].append(r.target.value)
    print(json.dumps(result, indent=4))
    # nodes params that ain't meaningful
elif cmd == "5":
    ignore_params = clean_split(
        """\
    first_line
    empty_lines
    indent
    newline
    lpar
    rpar
    colon
    header
    footer
    leading_lines
    lines_after_decorators
    """
    )
    result = {}
    seen = set([])
    for x in all_cst_nodes:
        if x.__name__ in seen:
            continue
        print(x.__name__, file=sys.stderr)
        # print('# ' + x.__name__)
        seen.add(x.__name__)  # FIXME what's that?
        result[x.__name__] = serialize_dc(load_whole_class(x))
    print(json.dumps(result, indent=4, default=str))
    # nodes params that ain't meaningful

else:
    print("No command specified")
