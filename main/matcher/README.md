# Matcher: Bidirectional Schema Engine

🇺🇸 English
[🇷🇺 Русский](README.ru.md)

**Matcher** is a declarative engine for (JSON-like) data transformation, based on certain principles of **type theory** and **category theory**.

Unlike classic validators (Pydantic, JSON Schema), Matcher does not simply check data, but establishes an **isomorphism** between "dirty" input data (JSON, AST, configuration files) and "clean" internal structures, guaranteeing the ability to restore source data byte-for-byte.

### 🔑 Key Features

*   **Bidirectionality (Lenses):** Every schema node works in both directions.
    *   `forwards`: Decomposition of data into *Value (Thin Value)* and *Context (Payload)*.
    *   `backwards`: Recomposition of the original structure without loss.
*   **Entropy Preservation (Payload):** During parsing, all "extra" information (code comments, key order, unknown fields) is not discarded but stored in the Payload. This allows using Matcher for **automated refactoring** and **autofixing linters**.
*   **Interactive Type Inference (Hole-Driven Development):** Support for "holes" (`fff` / `MatchFunnel`) in the schema. The engine can pause execution, ask the user to clarify the data type via UI/console, and continue working ("Hot-swapping" the schema on the fly).
*   **Meta-circularity:** The system is [homoiconic](https://en.wikipedia.org/wiki/Homoiconicity). There exists a `MetaSchema`, described in Matcher itself, which can validate and serialize any Matcher schema. See [self-test](https://github.com/andrewboltachev/logicore/blob/master/main/matcher/tests/roundtrip.py#L369).
*   **Server-Driven UI:** Schemas are automatically translated into JSON descriptions for UI generation (e.g., editing forms in React).

---

### 📐 Theoretical Basis

The system implements the concept of isomorphism: $S ≅ A × C$

Where:
*   **$S$ (Source):** Source data (e.g., a `serializers.py` file or complex JSON).
*   **$A$ (Thin Value):** Semantically important structure (e.g., a list of classes and their fields).
*   **$C$ (Payload):** Residual entropy (imports, indentation, comments, whitespace, line breaks, unstructured data).

This allows building **editable views** for complex legacy systems, where we modify $A$, and the system automatically updates $S$ using the saved $C$.

---

### 🛠 Usage Examples

#### 1. Schema Definition and Round-Trip

```python
from matcher.nodes import MatchObjectFull, MatchStringAny, MatchNumberAny

# Define schema
schema = MatchObjectFull({
    "id": MatchNumberAny(),
    "username": MatchStringAny(),
    # Fields not described here won't disappear but go into Payload (if configured)
    # or raise an error (if strict mode)
})

data = {"id": 1, "username": "admin", "timestamp": 1234567890}

# 1. Forwards (Parsing)
# result: {"id": 1, "username": "admin"}
# payload: {"timestamp": 1234567890} (context preservation)
result, payload = schema.forwards(value=data)

# ... here we can modify result ...
result["username"] = "superadmin"

# 2. Backwards (Restoration)
# restored: {"id": 1, "username": "superadmin", "timestamp": 1234567890}
restored = schema.backwards(result=result, payload=payload)
```

#### 2. Recursive Structures (Inductive Types)

Matcher supports recursion of any depth via the `MatchRec` / `MatchRef` mechanism, which allows describing file trees, ASTs, or nested configurations.

```python
from matcher.nodes import MatchRec, MatchRef, MatchArrayFull, MatchOr

file_system = MatchRec("FileSystem", MatchObjectFull({
    "name": MatchStringAny(),
    "type": MatchStringAny(), # "file" or "dir"
    "children": MatchArrayFull(MatchRef("FileSystem")) # Reference to itself
}))
```

#### 3. Isomorphisms and Validation

Use `MatchIso` for data transformation (e.g., `snake_case` <-> `CamelCase`) and `MatchValidate` for Refinement Types.

```python
# Converts string "80/tcp" to int 80 and back
port_schema = MatchIso(
    inner=MatchStringAny(),
    decoder=lambda x: int(x.split('/')[0]),
    encoder=lambda x: f"{x}/tcp"
)
```

---

### 🔮 Interactive Development (JIT Schema)

Matcher supports a "development via holes" mode. Instead of manually writing huge schemas, you indicate the place where the schema is unknown (`fff`), and run the search.

```python
from matcher.nodes import *

# We don't know the structure inside "config"
schema = MatchObjectFull({
    "version": MatchNumberAny(),
    "config": MatchFunnel  # "funnel" / "hole"
})

# Start in interactive mode:
# 1. System reaches 'config'.
# 2. Pauses execution.
# 3. Sends data sample to UI/Console.
# 4. [in development] Suggests options (MatchObject, MatchArray, etc.).
# 5. After user selection updates schema and continues execution.
```

### 📦 Node Architecture

*   **Structure:** `MatchObjectFull`, `MatchArrayFull`, `MatchRecord`, `MatchCons`.
*   **Logic:** `MatchOr` (Sum Types), `MatchIfThen` (Dependent Pairs).
*   **Primitives:** `MatchStringAny`, `MatchNumberAny`, `MatchBoolAny`, `MatchNone`.
*   **Special:**
    *   `MatchIso`: Bidirectional adapters.
    *   `MatchLet` / `MatchVar`: Dependent types and context binding (NbE).
    *   `MatchRec`: Recursion.

### 🎯 Usage Scenarios

1.  **Legacy Refactoring:** Parsing existing Python code (via LibCST), modifying structure (via Thin Value), and saving it back with preserved formatting.
2.  **Data Normalization:** Unifying heterogeneous API responses (or security tool outputs) into a single typed format.
3.  **Low-Code/No-Code Editors:** Automatic generation of React forms based on backend Python schemas.
