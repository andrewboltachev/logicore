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


def test_recursive_filesystem():
    # 1. Define the Schema
    # A Folder contains Files OR other Folders.

    # We define the recursive structure for a "Node" in a tree
    schema = MatchRec("FileSystemNode", MatchObjectFull({
        "name": MatchStringAny(),
        "type": MatchStringAny(), # "file" or "dir"
        # Here is the recursion: A 'children' list containing 'FileSystemNode's
        # We use MatchOr to handle Leaf (File) vs Node (Dir) logic if we wanted,
        # but here we just allow a list of refs.
        "children": MatchArrayFull(MatchRef("FileSystemNode"))
    }))

    # 2. The Data (Nested JSON)
    data = {
        "name": "root",
        "type": "dir",
        "children": [
            {
                "name": "etc",
                "type": "dir",
                "children": [
                    {"name": "passwd", "type": "file", "children": []}
                ]
            },
            {
                "name": "var",
                "type": "dir",
                "children": []
            }
        ]
    }

    # 3. Execute
    # Thin Value: We keep everything structural.
    # In a real app, we might use MatchIso to convert "type": "dir" to an Enum.
    result, payload = schema.forwards(value=data)

    # 4. Verify Round Trip
    restored = schema.backwards(result=result, payload=payload)
    assert restored == data
    print("Recursion Works!")


class TestMatchRec:
    def setup_method(self):
        # CRITICAL: Clear registry before every test to avoid pollution
        SCHEMA_REGISTRY.clear()

    def test_simple_recursive_folder(self):
        # Schema: A folder has a name and a list of children (which are also folders)
        schema = MatchRec("Folder", MatchObjectFull({
            "name": MatchStringAny(),
            "children": MatchArrayFull(MatchRef("Folder"))
        }))

        # Case 1: Leaf Node (No children)
        # Input
        val_leaf = {"name": "leaf", "children": []}

        # Expected Payload logic:
        # MatchStringAny returns None payload -> excluded from Object payload
        # MatchArrayFull returns [] payload
        t(
            schema,
            val_leaf,
            val_leaf,           # Result (structure preserved)
            {"children": []},   # Payload
            val_leaf            # Reconstructed without payload
        )

    def test_nested_recursion(self):
        schema = MatchRec("Folder", MatchObjectFull({
            "name": MatchStringAny(),
            "children": MatchArrayFull(MatchRef("Folder"))
        }))

        # Case 2: Depth 2
        val_tree = {
            "name": "root",
            "children": [
                {"name": "sub1", "children": []},
                {"name": "sub2", "children": []}
            ]
        }

        # Payload analysis:
        # Root payload has 'children' which is a list of payloads.
        # Each child payload has 'children': []
        expected_payload = {
            "children": [
                {"children": []},
                {"children": []}
            ]
        }

        t(
            schema,
            val_tree,
            val_tree,           # Result
            expected_payload,   # Payload
            val_tree            # No Payload Value
        )

    def test_mixed_recursion_with_payload_erasure(self):
        # Schema: Recursion where we actually ERASE data in the "Thin Value"
        # Let's say we want to erase the "name" from the result (MatchNone),
        # but keep the structure.

        schema = MatchRec("GhostFolder", MatchObjectFull({
            "name": MatchNone(), # This goes into Payload ONLY
            "children": MatchArrayFull(MatchRef("GhostFolder"))
        }))

        val_input = {
            "name": "root",
            "children": [
                {"name": "hidden", "children": []}
            ]
        }

        # Result analysis:
        # "name" is MatchNone -> returns None in result, "root" in payload
        # If MatchObjectFull sees None result for "name", it keeps it (based on your impl logic)
        # or collapses it.
        # Based on your MatchObjectFull:
        # if len(result) == 1 -> unwrap.
        # Here we have "name": None, "children": [List].
        # "children" is regular. "name" is final.

        # Let's trace strictly:
        # MatchArrayFull("children") -> returns list of children results.
        # Child Result: {"children": []} (name is None) -> unwrapped?
        # Let's assume strict dict output for clarity of the test:

        expected_result = [[]]

        expected_payload = {
            "name": "root",
            "children": [
                {"name": "hidden", "children": []}
            ]
        }

        # When reconstructing WITHOUT payload:
        # MatchNone backwards without payload returns None.
        # So we get the structure back, but names are None.
        expected_no_payload_value = {
            "name": None,
            "children": [
                {"name": None, "children": []}
            ]
        }

        t(
            schema,
            val_input,
            expected_result,
            expected_payload,
            expected_no_payload_value
        )