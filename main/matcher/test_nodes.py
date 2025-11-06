from .nodes import *  # noqa


def t(grammar, value, result, payload):
    result2, payload2 = grammar.forwards(value=value)
    value2 = grammar.backwards(result=result2, payload=payload2)
    assert {"result": result2} == {"result": result}, "Result matches"
    assert {"payload": payload2} == {"payload": payload}, "Payload matches"
    assert {"value": value2} == {"value": value}, "Value matches"
    # res = lambda result, payload, value: {"result": result, "payload": payload, "value": value}
    # assert res(result2, payload2, value2) == res(result, payload, value)



class TestMatchObjectFull:
    def test_empty(self):
        t(
            MatchObjectFull({}),
            {},
            None,
            {}
        )

    def test_single_regular_item(self):
        t(
            MatchObjectFull({"x": MatchAny()}),
            {"x": "foo"},
            "foo",
            {}
        )

    def test_single_final_item(self):
        t(
            MatchObjectFull({"w": MatchNone()}),
            {"w": " "},
            None,
            {"w": " "}
        )

    def test_two_items_final_and_regular(self):
        t(
            MatchObjectFull({"x": MatchAny(), "w": MatchNone()}),
            {"x": 1, "w": " "},
            1,
            {"w": " "}
        )

    def test_two_items_regular(self):
        t(
            MatchObjectFull({"x": MatchAny(), "y": MatchAny()}),
            {"x": 1, "y": "foo"},
            {"x": 1, "y": "foo"},
            {}
        )

    def test_two_items_final(self):
        t(
            MatchObjectFull({"w1": MatchNone(), "w2": MatchNone()}),
            {"w1": " ", "w2": "  "},
            None,
            {"w1": " ", "w2": "  "}
        )

    def test_nested_single_final(self):
        t(
            MatchObjectFull({"w": MatchNone(), "x": MatchObjectFull({"w": MatchNone(), "x": MatchAny()})}),
            {"w": " ", "x": {"w": "  ", "x": 2}},
            2,
            {"w": " ", "x": {"w": "  "}}
        )