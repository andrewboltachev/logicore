import json
import dataclasses
from typing import Any

from .nodes import *  # Assuming your nodes are here

def serialize_schema(obj: Any) -> Any:
    """
    Recursively converts Matcher Nodes into a JSON-serializable dict.
    """
    # 1. Handle Matcher Nodes (The most important part)
    if dataclasses.is_dataclass(obj):
        # Start with the fields
        result = {
            f.name: serialize_schema(getattr(obj, f.name))
            for f in dataclasses.fields(obj)
        }
        # Inject the Type Discriminator (Crucial for Frontend)
        result["type"] = type(obj).__name__
        return result

    # 2. Handle Collections
    if isinstance(obj, dict):
        return {k: serialize_schema(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [serialize_schema(v) for v in obj]

    # 3. Handle Functions (for MatchIso)
    if callable(obj):
        # We return the function name.
        # In a real system, you might return a registry key string.
        return f"<function {obj.__name__}>"

    # 4. Handle Primitives (str, int, bool, None)
    return obj

def main():
    # --- 1. Define a Complex Schema ---
    # A Recursive FileSystem: Folders contain Files or Folders

    # Helper functions for MatchIso (to test callable serialization)
    def to_upper(x): return x.upper()
    def to_lower(x): return x.lower()

    schema = MatchRec(
        name="FileSystem",
        body=MatchObjectFull({
            "name": MatchIso(
                inner=MatchStringAny(),
                iso_name="std.str_int"
            ),
            "type": MatchOr({
                "file": MatchExact("file"),
                "dir": MatchExact("dir")
            }),
            "children": MatchArrayFull(
                MatchRef("FileSystem") # The Recursive Reference
            )
        })
    )

    # --- 2. Serialize ---
    json_output = serialize_schema(schema)

    # --- 3. Print ---
    print(json.dumps(json_output, indent=2))

if __name__ == "__main__":
    main()