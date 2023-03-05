export default [{
    "contents": [{
        "contents": [{
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "MatchPattern"
                },
                "target": {
                    "type": "VarT",
                    "value": "ObjectKeyMatch"
                },
                "type": "ConT"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }],
        "tag": "MatchObjectFull"
    }, {
        "contents": [{
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "MatchPattern"
                },
                "target": {
                    "type": "VarT",
                    "value": "ObjectKeyMatch"
                },
                "type": "ConT"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }],
        "tag": "MatchObjectPartial"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "MatchPattern"
            },
            "target": {
                "type": "VarT",
                "value": "ContextFreeGrammar"
            },
            "type": "ConT"
        }],
        "tag": "MatchArrayContextFree"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Text"
        }],
        "tag": "MatchStringExact"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Scientific"
        }],
        "tag": "MatchNumberExact"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Bool"
        }],
        "tag": "MatchBoolExact"
    }, {
        "contents": [],
        "tag": "MatchStringAny"
    }, {
        "contents": [],
        "tag": "MatchNumberAny"
    }, {
        "contents": [],
        "tag": "MatchBoolAny"
    }, {
        "contents": [],
        "tag": "MatchNull"
    }, {
        "contents": [],
        "tag": "MatchAny"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "MatchPattern"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }],
        "tag": "MatchOr"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "MatchPattern"
        }, {
            "type": "VarT",
            "value": "String"
        }, {
            "type": "VarT",
            "value": "MatchPattern"
        }],
        "tag": "MatchIfThen"
    }, {
        "contents": [],
        "tag": "MatchFunnel"
    }, {
        "contents": [],
        "tag": "MatchFunnelKeys"
    }, {
        "contents": [],
        "tag": "MatchFunnelKeysU"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "String"
        }],
        "tag": "MatchRef"
    }],
    "value": "MatchPattern",
    "vars": []
}, {
    "contents": [{
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "MatchPattern"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }, {
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "MatchResult"
                },
                "target": {
                    "type": "VarT",
                    "value": "ObjectKeyMatch"
                },
                "type": "ConT"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }],
        "tag": "MatchObjectFullResult"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "MatchPattern"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }, {
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "MatchResult"
                },
                "target": {
                    "type": "VarT",
                    "value": "ObjectKeyMatch"
                },
                "type": "ConT"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }],
        "tag": "MatchObjectPartialResult"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "MatchResult"
            },
            "target": {
                "args": {
                    "type": "VarT",
                    "value": "MatchPattern"
                },
                "target": {
                    "type": "VarT",
                    "value": "ContextFreeGrammarResult"
                },
                "type": "ConT"
            },
            "type": "ConT"
        }],
        "tag": "MatchArrayContextFreeResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Text"
        }],
        "tag": "MatchStringExactResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Scientific"
        }],
        "tag": "MatchNumberExactResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Bool"
        }],
        "tag": "MatchBoolExactResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Text"
        }],
        "tag": "MatchStringAnyResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Scientific"
        }],
        "tag": "MatchNumberAnyResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Bool"
        }],
        "tag": "MatchBoolAnyResult"
    }, {
        "contents": [],
        "tag": "MatchNullResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Value"
        }],
        "tag": "MatchAnyResult"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "MatchPattern"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }, {
            "type": "VarT",
            "value": "Key"
        }, {
            "type": "VarT",
            "value": "MatchResult"
        }],
        "tag": "MatchOrResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "MatchPattern"
        }, {
            "type": "VarT",
            "value": "String"
        }, {
            "type": "VarT",
            "value": "MatchResult"
        }],
        "tag": "MatchIfThenResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Value"
        }],
        "tag": "MatchFunnelResult"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "Value"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }],
        "tag": "MatchFunnelKeysResult"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "Value"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }],
        "tag": "MatchFunnelKeysUResult"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "String"
        }, {
            "type": "VarT",
            "value": "MatchResult"
        }],
        "tag": "MatchRefResult"
    }],
    "value": "MatchResult",
    "vars": []
}, {
    "contents": [{
        "contents": [{
            "type": "VarT",
            "value": "a_6989586621682258879"
        }],
        "tag": "Char"
    }, {
        "contents": [{
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "a_6989586621682258879"
                },
                "target": {
                    "type": "VarT",
                    "value": "ContextFreeGrammar"
                },
                "type": "ConT"
            },
            "target": {
                "type": "ListT"
            },
            "type": "ConT"
        }],
        "tag": "Seq"
    }, {
        "contents": [{
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "a_6989586621682258879"
                },
                "target": {
                    "type": "VarT",
                    "value": "ContextFreeGrammar"
                },
                "type": "ConT"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }],
        "tag": "Or"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "a_6989586621682258879"
            },
            "target": {
                "type": "VarT",
                "value": "ContextFreeGrammar"
            },
            "type": "ConT"
        }],
        "tag": "Star"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "a_6989586621682258879"
            },
            "target": {
                "type": "VarT",
                "value": "ContextFreeGrammar"
            },
            "type": "ConT"
        }],
        "tag": "Plus"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "a_6989586621682258879"
            },
            "target": {
                "type": "VarT",
                "value": "ContextFreeGrammar"
            },
            "type": "ConT"
        }],
        "tag": "Optional"
    }],
    "value": "ContextFreeGrammar",
    "vars": ["a_6989586621682258879"]
}, {
    "contents": [{
        "contents": [{
            "type": "VarT",
            "value": "r_6989586621682260855"
        }],
        "tag": "CharNode"
    }, {
        "contents": [{
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "r_6989586621682260855"
                },
                "target": {
                    "args": {
                        "type": "VarT",
                        "value": "g_6989586621682260854"
                    },
                    "target": {
                        "type": "VarT",
                        "value": "ContextFreeGrammarResult"
                    },
                    "type": "ConT"
                },
                "type": "ConT"
            },
            "target": {
                "type": "ListT"
            },
            "type": "ConT"
        }],
        "tag": "SeqNode"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "g_6989586621682260854"
            },
            "target": {
                "type": "VarT",
                "value": "ContextFreeGrammar"
            },
            "type": "ConT"
        }],
        "tag": "StarNodeEmpty"
    }, {
        "contents": [{
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "r_6989586621682260855"
                },
                "target": {
                    "args": {
                        "type": "VarT",
                        "value": "g_6989586621682260854"
                    },
                    "target": {
                        "type": "VarT",
                        "value": "ContextFreeGrammarResult"
                    },
                    "type": "ConT"
                },
                "type": "ConT"
            },
            "target": {
                "type": "ListT"
            },
            "type": "ConT"
        }],
        "tag": "StarNodeValue"
    }, {
        "contents": [{
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "r_6989586621682260855"
                },
                "target": {
                    "args": {
                        "type": "VarT",
                        "value": "g_6989586621682260854"
                    },
                    "target": {
                        "type": "VarT",
                        "value": "ContextFreeGrammarResult"
                    },
                    "type": "ConT"
                },
                "type": "ConT"
            },
            "target": {
                "type": "ListT"
            },
            "type": "ConT"
        }],
        "tag": "PlusNode"
    }, {
        "contents": [{
            "args": {
                "args": {
                    "type": "VarT",
                    "value": "g_6989586621682260854"
                },
                "target": {
                    "type": "VarT",
                    "value": "ContextFreeGrammar"
                },
                "type": "ConT"
            },
            "target": {
                "type": "VarT",
                "value": "KeyMap"
            },
            "type": "ConT"
        }, {
            "type": "VarT",
            "value": "Key"
        }, {
            "args": {
                "type": "VarT",
                "value": "r_6989586621682260855"
            },
            "target": {
                "args": {
                    "type": "VarT",
                    "value": "g_6989586621682260854"
                },
                "target": {
                    "type": "VarT",
                    "value": "ContextFreeGrammarResult"
                },
                "type": "ConT"
            },
            "type": "ConT"
        }],
        "tag": "OrNode"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "r_6989586621682260855"
            },
            "target": {
                "args": {
                    "type": "VarT",
                    "value": "g_6989586621682260854"
                },
                "target": {
                    "type": "VarT",
                    "value": "ContextFreeGrammarResult"
                },
                "type": "ConT"
            },
            "type": "ConT"
        }],
        "tag": "OptionalNodeValue"
    }, {
        "contents": [{
            "args": {
                "type": "VarT",
                "value": "g_6989586621682260854"
            },
            "target": {
                "type": "VarT",
                "value": "ContextFreeGrammar"
            },
            "type": "ConT"
        }],
        "tag": "OptionalNodeEmpty"
    }],
    "value": "ContextFreeGrammarResult",
    "vars": ["g_6989586621682260854", "r_6989586621682260855"]
}, {
    "contents": [{
        "contents": [{
            "type": "VarT",
            "value": "a_6989586621682264111"
        }],
        "tag": "KeyReq"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "a_6989586621682264111"
        }],
        "tag": "KeyOpt"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Value"
        }],
        "tag": "KeyExt"
    }],
    "value": "ObjectKeyMatch",
    "vars": ["a_6989586621682264111"]
}, {
    "contents": [{
        "contents": [{
            "type": "VarT",
            "value": "a_6989586621682264110"
        }],
        "tag": "MatchedVal"
    }, {
        "contents": [{
            "type": "VarT",
            "value": "Value"
        }],
        "tag": "ExtraVal"
    }],
    "value": "ArrayValMatch",
    "vars": ["a_6989586621682264110"]
}];
