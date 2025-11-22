# iso_registry.py
from typing import Callable, Tuple, Dict, Any

# Type alias for the pair of functions
IsoFunctions = Tuple[Callable[[Any], Any], Callable[[Any], Any]]

class IsoRegistry:
    _registry: Dict[str, IsoFunctions] = {}

    @classmethod
    def register(cls, name: str, decoder: Callable, encoder: Callable):
        """Registers a new Isomorphism."""
        if name in cls._registry:
            raise ValueError(f"ISO '{name}' already registered.")
        cls._registry[name] = (decoder, encoder)

    @classmethod
    def get(cls, name: str) -> IsoFunctions:
        """Retrieves (decoder, encoder) by name."""
        if name not in cls._registry:
            raise KeyError(f"ISO '{name}' not found. Available: {list(cls._registry.keys())}")
        return cls._registry[name]

    @classmethod
    def list_available(cls):
        """Returns list of available ISO names for UI."""
        return list(cls._registry.keys())

# --- Built-in ISO definitions ---

def _str_to_int(x): return int(x)
def _int_to_str(x): return str(x)

IsoRegistry.register("std.str_int", _str_to_int, _int_to_str)

def _snake_to_camel(s: str) -> str:
    # simple implementation
    components = s.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])

def _camel_to_snake(s: str) -> str:
    import re
    return re.sub(r'(?<!^)(?=[A-Z])', '_', s).lower()

IsoRegistry.register("fmt.snake_camel", _snake_to_camel, _camel_to_snake)