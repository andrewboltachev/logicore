from ..nodes import *  # noqa


def t(grammar, value, result, payload, no_payload_value):
    result2, payload2 = grammar.forwards(value=value)
    value2 = grammar.backwards(result=result2, payload=payload2)
    assert {"result": result2} == {"result": result}, "Result matches"
    assert {"payload": payload2} == {"payload": payload}, "Payload matches"
    assert {"value": value2} == {"value": value}, "Value matches"
    value3 = grammar.backwards(result=result2, payload=None)
    assert {"no_payload_value": value3} == {"no_payload_value": no_payload_value}, "No-payload value matches"


class TestMatchObjectFull:
    def test_empty(self):
        t(
            MatchObjectFull({}),
            {},
            None,
            {},
            {}
        )

    def test_single_regular_item(self):
        t(
            MatchObjectFull({"x": MatchAny()}),
            {"x": "foo"},
            "foo",
            {},
            {"x": "foo"}
        )

    def test_single_final_item(self):
        t(
            MatchObjectFull({"w": MatchNone()}),
            {"w": " "},
            None,
            {"w": " "},
            {"w": None}
        )

    def test_two_items_final_and_regular(self):
        t(
            MatchObjectFull({"x": MatchAny(), "w": MatchNone()}),
            {"x": 1, "w": " "},
            1,
            {"w": " "},
            {"x": 1, "w": None}
        )

    def test_two_items_regular(self):
        t(
            MatchObjectFull({"x": MatchAny(), "y": MatchAny()}),
            {"x": 1, "y": "foo"},
            {"x": 1, "y": "foo"},
            {},
            {"x": 1, "y": "foo"},
        )

    def test_two_items_final(self):
        t(
            MatchObjectFull({"w1": MatchNone(), "w2": MatchNone()}),
            {"w1": " ", "w2": "  "},
            None,
            {"w1": " ", "w2": "  "},
            {"w1": None, "w2": None}
        )

    def test_nested_single_final(self):
        t(
            MatchObjectFull({"w": MatchNone(), "x": MatchObjectFull({"w": MatchNone(), "x": MatchAny()})}),
            {"w": " ", "x": {"w": "  ", "x": 2}},
            2,
            {"w": " ", "x": {"w": "  "}},
            {"w": None, "x": {"w": None, "x": 2}}
        )


class TestMatchRecord:
    def test_empty(self):
        t(
            MatchRecord(MatchAny()),
            {},
            {},
            {},
            {}
        )

    def test_single_regular_item(self):
        t(
            MatchRecord(MatchAny()),
            {"a": "foo"},
            {"a": "foo"},
            {"a": None},
            {"a": "foo"}
        )

    def test_single_final_item(self):
        t(
            MatchRecord(MatchNone()),
            {"a": "foo"},
            {"a": None},
            {"a": "foo"},
            {"a": None}
        )

    def test_mixed_with_object(self):
        t(
            MatchRecord(MatchObjectFull({"w": MatchNone()})),
            {"a": {"w": " "}, "b": {"w": "  "}},
            {"a": None, "b": None},
            {"a": {"w": " "}, "b": {"w": "  "}},
            {"a": {"w": None}, "b": {"w": None}}
        )


class TestMatchArrayFull:
    def test_empty(self):
        t(
            MatchArrayFull(MatchAny()),
            [],
            [],
            [],
            []
        )

    def test_single_regular_item(self):
        t(
            MatchArrayFull(MatchAny()),
            ["foo"],
            ["foo"],
            [None],
            ["foo"]
        )

    def test_single_final_item(self):
        t(
            MatchArrayFull(MatchNone()),
            ["foo"],
            1,
            ["foo"],
            [None]
        )

    def test_mixed_with_object(self):
        t(
            MatchArrayFull(MatchObjectFull({"w": MatchNone()})),
            [{"w": " "}, {"w": "  "}],
            2,
            [{"w": " "}, {"w": "  "}],
            [{"w": None}, {"w": None}]
        )


class TestMatchNil:
    def test_empty(self):
        t(
            MatchNil(),
            [],
            None,
            None,
            []
        )


class TestMatchCons:
    def test_single_regular_item(self):
        t(
            MatchCons(MatchAny(), MatchNil()),
            ["foo"],
            "foo",
            [None, None],
            ["foo"]
        )

    def test_array_full_tail(self):
        t(
            MatchCons(MatchAny(), MatchArrayFull(MatchNone())),
            ["foo", 1, 2, 3],
            ["foo", 3],
            [None, [1, 2, 3]],
            ["foo", None, None, None]
        )


class TestMatchIso:
    def test_single_regular_item(self):
        t(
            MatchIso(MatchAny(), int, str),
            "123",
            123,
            None,
            "123"
        )