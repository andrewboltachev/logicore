nodes_params = {
    "SimpleWhitespace": [
        "value"
    ],
    "Comment": [
        "value"
    ],
    "BaseValueToken": [
        "value"
    ],
    "Newline": [
        "value"
    ],
    "ImportStar": [],
    "BaseLeaf": [],
    "ParenthesizedWhitespace": [
        "last_line"
    ],
    "BaseParenthesizableWhitespace": [],
    "TrailingWhitespace": [
        "comment"
    ],
    "EmptyLine": [
        "comment"
    ],
    "And": [],
    "Or": [],
    "BaseBooleanOp": [],
    "Semicolon": [],
    "Colon": [],
    "Comma": [],
    "Dot": [],
    "AssignEqual": [],
    "Add": [],
    "Subtract": [],
    "Multiply": [],
    "Divide": [],
    "FloorDivide": [],
    "Modulo": [],
    "Power": [],
    "LeftShift": [],
    "RightShift": [],
    "BitOr": [],
    "BitAnd": [],
    "BitXor": [],
    "MatrixMultiply": [],
    "LessThan": [],
    "GreaterThan": [],
    "Equal": [],
    "LessThanEqual": [],
    "GreaterThanEqual": [],
    "NotEqual": [
        "value"
    ],
    "In": [],
    "Is": [],
    "AddAssign": [],
    "SubtractAssign": [],
    "MultiplyAssign": [],
    "MatrixMultiplyAssign": [],
    "DivideAssign": [],
    "ModuloAssign": [],
    "BitAndAssign": [],
    "BitOrAssign": [],
    "BitXorAssign": [],
    "LeftShiftAssign": [],
    "RightShiftAssign": [],
    "PowerAssign": [],
    "FloorDivideAssign": [],
    "_BaseOneTokenOp": [],
    "NotIn": [],
    "IsNot": [],
    "_BaseTwoTokenOp": [],
    "Plus": [],
    "Minus": [],
    "BitInvert": [],
    "Not": [],
    "BaseUnaryOp": [],
    "BaseBinaryOp": [],
    "BaseCompOp": [],
    "BaseAugOp": [],
    "LeftSquareBracket": [],
    "RightSquareBracket": [],
    "LeftCurlyBrace": [],
    "RightCurlyBrace": [],
    "LeftParen": [],
    "RightParen": [],
    "Asynchronous": [],
    "Name": [
        "value"
    ],
    "Attribute": [
        "value",
        "attr",
        "dot"
    ],
    "Subscript": [
        "value",
        "slice",
        "lbracket",
        "rbracket"
    ],
    "Tuple": [
        "elements"
    ],
    "List": [
        "elements",
        "lbracket",
        "rbracket"
    ],
    "BaseAssignTargetExpression": [],
    "BaseDelTargetExpression": [],
    "Ellipsis": [],
    "Integer": [
        "value"
    ],
    "Float": [
        "value"
    ],
    "Imaginary": [
        "value"
    ],
    "BaseNumber": [],
    "SimpleString": [
        "value"
    ],
    "FormattedString": [
        "parts",
        "start",
        "end"
    ],
    "_BasePrefixedString": [],
    "ConcatenatedString": [
        "left",
        "right"
    ],
    "BaseString": [],
    "Comparison": [
        "left",
        "comparisons"
    ],
    "UnaryOperation": [
        "operator",
        "expression"
    ],
    "BinaryOperation": [
        "left",
        "operator",
        "right"
    ],
    "BooleanOperation": [
        "left",
        "operator",
        "right"
    ],
    "Lambda": [
        "params",
        "body"
    ],
    "Call": [
        "func",
        "args"
    ],
    "_BaseExpressionWithArgs": [
        "args"
    ],
    "Await": [
        "expression"
    ],
    "IfExp": [
        "test",
        "body",
        "orelse"
    ],
    "Yield": [
        "value"
    ],
    "StarredElement": [
        "value",
        "comma"
    ],
    "ListComp": [
        "elt",
        "for_in",
        "lbracket",
        "rbracket"
    ],
    "BaseList": [
        "lbracket",
        "rbracket"
    ],
    "Set": [
        "elements",
        "lbrace",
        "rbrace"
    ],
    "SetComp": [
        "elt",
        "for_in",
        "lbrace",
        "rbrace"
    ],
    "BaseSet": [],
    "Dict": [
        "elements",
        "lbrace",
        "rbrace"
    ],
    "DictComp": [
        "key",
        "value",
        "for_in",
        "lbrace",
        "rbrace"
    ],
    "BaseDict": [],
    "_BaseSetOrDict": [
        "lbrace",
        "rbrace"
    ],
    "GeneratorExp": [
        "elt",
        "for_in"
    ],
    "BaseSimpleComp": [
        "elt",
        "for_in"
    ],
    "BaseComp": [
        "for_in"
    ],
    "NamedExpr": [
        "target",
        "value"
    ],
    "BaseExpression": [],
    "MatchValue": [
        "value"
    ],
    "MatchSingleton": [
        "value"
    ],
    "MatchList": [
        "patterns",
        "lbracket",
        "rbracket"
    ],
    "MatchTuple": [
        "patterns"
    ],
    "MatchSequence": [
        "patterns"
    ],
    "MatchMapping": [
        "elements",
        "lbrace",
        "rbrace",
        "rest",
        "trailing_comma"
    ],
    "MatchClass": [
        "cls",
        "patterns",
        "kwds"
    ],
    "MatchAs": [
        "pattern",
        "name"
    ],
    "MatchOr": [
        "patterns"
    ],
    "MatchPattern": [],
    "_BaseParenthesizedNode": [],
    "FormattedStringText": [
        "value"
    ],
    "FormattedStringExpression": [
        "expression",
        "conversion",
        "format_spec",
        "equal"
    ],
    "BaseFormattedStringContent": [],
    "ComparisonTarget": [
        "operator",
        "comparator"
    ],
    "Index": [
        "value",
        "star"
    ],
    "Slice": [
        "lower",
        "upper",
        "step",
        "first_colon",
        "second_colon"
    ],
    "BaseSlice": [],
    "SubscriptElement": [
        "slice",
        "comma"
    ],
    "Annotation": [
        "annotation"
    ],
    "ParamStar": [
        "comma"
    ],
    "ParamSlash": [
        "comma"
    ],
    "Param": [
        "name",
        "annotation",
        "equal",
        "default",
        "comma",
        "star"
    ],
    "Parameters": [
        "params",
        "star_arg",
        "kwonly_params",
        "star_kwarg",
        "posonly_params",
        "posonly_ind"
    ],
    "Arg": [
        "value",
        "keyword",
        "equal",
        "comma",
        "star"
    ],
    "From": [
        "item"
    ],
    "Element": [
        "value",
        "comma"
    ],
    "BaseElement": [],
    "DictElement": [
        "key",
        "value",
        "comma"
    ],
    "StarredDictElement": [
        "value",
        "comma"
    ],
    "BaseDictElement": [],
    "_BaseElementImpl": [
        "value",
        "comma"
    ],
    "CompFor": [
        "target",
        "iter",
        "ifs",
        "inner_for_in",
        "asynchronous"
    ],
    "CompIf": [
        "test"
    ],
    "SimpleStatementSuite": [
        "body"
    ],
    "IndentedBlock": [
        "body"
    ],
    "BaseSuite": [
        "body"
    ],
    "SimpleStatementLine": [
        "body"
    ],
    "If": [
        "test",
        "body",
        "orelse"
    ],
    "Try": [
        "body",
        "handlers",
        "orelse",
        "finalbody"
    ],
    "TryStar": [
        "body",
        "handlers",
        "orelse",
        "finalbody"
    ],
    "FunctionDef": [
        "name",
        "params",
        "body",
        "decorators",
        "returns",
        "asynchronous"
    ],
    "ClassDef": [
        "name",
        "body",
        "bases",
        "keywords",
        "decorators"
    ],
    "With": [
        "items",
        "body",
        "asynchronous"
    ],
    "For": [
        "target",
        "iter",
        "body",
        "orelse",
        "asynchronous"
    ],
    "While": [
        "test",
        "body",
        "orelse"
    ],
    "Match": [
        "subject",
        "cases"
    ],
    "BaseCompoundStatement": [
        "body"
    ],
    "BaseStatement": [],
    "Del": [
        "target",
        "semicolon"
    ],
    "Pass": [
        "semicolon"
    ],
    "Break": [
        "semicolon"
    ],
    "Continue": [
        "semicolon"
    ],
    "Return": [
        "value",
        "semicolon"
    ],
    "Expr": [
        "value",
        "semicolon"
    ],
    "Import": [
        "names",
        "semicolon"
    ],
    "ImportFrom": [
        "module",
        "names",
        "relative",
        "semicolon"
    ],
    "Assign": [
        "targets",
        "value",
        "semicolon"
    ],
    "AnnAssign": [
        "target",
        "annotation",
        "value",
        "equal",
        "semicolon"
    ],
    "AugAssign": [
        "target",
        "operator",
        "value",
        "semicolon"
    ],
    "Raise": [
        "exc",
        "cause",
        "semicolon"
    ],
    "Assert": [
        "test",
        "msg",
        "comma",
        "semicolon"
    ],
    "Global": [
        "names",
        "semicolon"
    ],
    "Nonlocal": [
        "names",
        "semicolon"
    ],
    "BaseSmallStatement": [
        "semicolon"
    ],
    "_BaseSimpleStatement": [
        "body"
    ],
    "Else": [
        "body"
    ],
    "AsName": [
        "name"
    ],
    "ExceptHandler": [
        "body",
        "type",
        "name"
    ],
    "ExceptStarHandler": [
        "body",
        "type",
        "name"
    ],
    "Finally": [
        "body"
    ],
    "ImportAlias": [
        "name",
        "asname",
        "comma"
    ],
    "AssignTarget": [
        "target"
    ],
    "Decorator": [
        "decorator"
    ],
    "WithItem": [
        "item",
        "asname",
        "comma"
    ],
    "NameItem": [
        "name",
        "comma"
    ],
    "MatchCase": [
        "pattern",
        "body",
        "guard"
    ],
    "MatchSequenceElement": [
        "value",
        "comma"
    ],
    "MatchStar": [
        "name",
        "comma"
    ],
    "MatchMappingElement": [
        "key",
        "pattern",
        "comma"
    ],
    "MatchKeywordElement": [
        "key",
        "pattern",
        "comma"
    ],
    "MatchOrElement": [
        "pattern",
        "separator"
    ],
    "Module": [
        "body",
        "encoding",
        "default_indent",
        "default_newline",
        "has_trailing_newline"
    ]
}

