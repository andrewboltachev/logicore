from ..nodes import *


def test_example_1():
    data = [
        {"a": 1},
        {"a": 2},
        {"a": 3},
        {"a": 4},
    ]
    grammar = MatchArrayFull(
        MatchObjectFull(
            {"a": MatchFunnel()}
        )
    )
    funnel = grammar.to_funnel(value=data)
    funnel_list = list(funnel)
    assert funnel_list == [1, 2, 3, 4]