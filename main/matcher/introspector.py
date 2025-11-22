from .nodes import *


# --- The Introspector Logic ---

def all_included_subclasses(cls):
    for c in cls.__subclasses__():
        try:
            strategy = c._type_desc_strategy
        except AttributeError:
            raise NotImplementedError("dataclass without _type_desc_strategy")
        if strategy == TypeDescStrategy.ROOT:
            raise ValueError("dataclass with ROOT strategy inside of another ROOT")
        if strategy in [TypeDescStrategy.ALL]:
            yield c
        if strategy in [TypeDescStrategy.ALL, TypeDescStrategy.TRANSPARENT]:
            yield from all_included_subclasses(c)


# Helper to resolve forward refs and get hints
def resolve_hints(cls):
    try:
        return ty.get_type_hints(cls)
    except Exception as e:
        raise ValueError(f"Type resolution failed for {cls}: {e}")

def get_class_fields_schema(cls, describe_fn) -> dict[str, Node]:
    """Helper to extract fields for MatchObjectFull."""
    if not dataclasses.is_dataclass(cls):
        raise ValueError(f"{cls} is not a dataclass")

    hints = resolve_hints(cls)
    schema = {}

    for field in dataclasses.fields(cls):
        name = field.name
        # Skip fields starting with underscore (internal flags)
        if name.startswith("_"):
            continue

        t = hints.get(name, field.type)
        schema[name] = describe_fn(t)

    return schema

def describe_type(t: Any) -> Node:
    """Recursively converts a Python Type into a Matcher Node tree."""

    # We keep track of the root context if needed, but for pure description
    # of a type tree, simple recursion is usually enough unless dealing
    # with cyclical references (which MatchRef handles in the runtime schema,
    # but here we are generating the meta-schema).
    CLASS_REGISTERY = {}

    def _describe_type(t: Any) -> Node:
        origin = ty.get_origin(t)
        args = ty.get_args(t)

        # --- 1. Handle Primitives ---
        if t is str:
            return MatchStringAny()
        if t is int or t is float:
            return MatchNumberAny()
        if t is bool:
            return MatchBoolAny()
        if t is None:
            return MatchExact(None)
        if t is Any:
            return MatchAny()

        # --- 2. Handle Generics ---
        match origin:
            # A. Lists -> MatchArrayFull
            case builtins.list:
                # args[0] is the item type
                return MatchArrayFull(item=_describe_type(args[0]))

            # B. Dicts -> MatchRecord
            case builtins.dict:
                # args[0] is key type, args[1] is value type.
                # MatchRecord usually assumes string keys.
                key_type = args[0]
                val_type = args[1]

                if key_type is not str:
                    # If you have a specific node for non-string keys, use it here.
                    # Otherwise, warn or assume string coercion.
                    pass
                return MatchRecord(item=_describe_type(val_type))

            # C. Unions -> MatchOr
            case ty.Union:
                '''
                branches = {}
                for arg in args:
                    node = _describe_type(arg)

                    # Generate a clean name for the branch
                    if arg is type(None):
                        name = "None"
                    elif hasattr(arg, "__name__"):
                        name = arg.__name__
                    elif getattr(node, "type", None): # If node has a 'type' field (from serialize)
                        name = node.type
                    else:
                        # Fallback for complex generics (e.g. "list[int]")
                        name = str(arg).replace("[", "_").replace("]", "").replace(".", "_")

                    branches[name] = node

                return MatchOr(branches=branches)
                '''
                raise NotImplementedError()

            # D. Dataclasses (The Strategy Logic)
            case _ if dataclasses.is_dataclass(t):
                if t.__name__ in CLASS_REGISTERY:
                    return MatchRef(ref_name=t.__name__)

                strategy = getattr(t, "_type_desc_strategy", None)

                # Case D.1: ROOT Strategy (Recursive Wrapper)
                if strategy == TypeDescStrategy.ROOT:
                    CLASS_REGISTERY[t.__name__] = True
                    branches = {}
                    # Note: all_included_subclasses needs to be available here
                    for cls in all_included_subclasses(Node):
                        cls_name = cls.__name__
                        # Recursive call for the specific subclass
                        branches[cls_name] = _describe_type(cls)

                    return MatchRec(
                        name=t.__name__,
                        body=MatchOr(branches=branches)
                    )

                # Case D.2: ALL Strategy (Object with Type Tag)
                elif strategy == TypeDescStrategy.ALL:
                    # Extract fields
                    fields_map = get_class_fields_schema(t, _describe_type)

                    # Inject the type discriminator
                    fields_map["type"] = MatchExact(exact_value=t.__name__)

                    return MatchObjectFull(map=fields_map)

                # Case D.3: Transparent (Just the fields, no tag) or Default
                else:
                    fields_map = get_class_fields_schema(t, _describe_type)
                    return MatchObjectFull(map=fields_map)

            case _:
                raise NotImplementedError(f"Unknown type or strategy for '{t}'")

    return _describe_type(t)

# --- Main Execution ---

def main():
    # Create a registry of schemas
    print("\n--- Final Dump ---")
    print(describe_type(Node))

if __name__ == "__main__":
    main()