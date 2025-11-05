# Python Matcher Nodes
import dataclasses
from dataclasses import dataclass
from typing import Any


# Types of data: Value, Grammar, Result, Payload


class MatchError(Exception):
    pass


@dataclass
class Node:
    def forwards(self, *, value, path=None):
        """returns result, payload"""
        raise NotImplementedError()

    def backwards(self, *, result, payload, path=None):
        """returns value"""
        raise NotImplementedError()

    def to_funnel(self, *, value, path=None):
        if True:  # I'd like to lint it, lint it...
            raise NotImplementedError()
        yield


@dataclass
class MatchAny(Node):
    def forwards(self, *, value, path=None):
        return value, None

    def backwards(self, *, result, payload, path=None):
        return result

    def to_funnel(self, *, value, path=None):
        yield from []


@dataclass
class MatchNone(Node):
    def forwards(self, *, value, path=None):
        return None, value

    def backwards(self, *, result, payload, path=None):
        return payload


@dataclass
class MatchObjectFull(Node):
    map: dict[str, Node]

    def forwards(self, *, value, path=None):
        return None, value

    def backwards(self, *, result, payload, path=None):
        return payload


def to_dict(dcls: Any) -> Any:
    if dataclasses.is_dataclass(dcls.__class__):
        r = {k: to_dict(v) for k, v in dcls.__dict__.items()}
        r["type"] = dcls.__class__.__name__
        return r
    elif isinstance(dcls, list):
        return [to_dict(x) for x in dcls]
    elif isinstance(dcls, dict):
        return {k: to_dict(v) for k, v in dcls.items()}
    else:
        return dcls


if __name__ == '__main__':
    print(
        to_dict(
            MatchObjectFull({"x": MatchAny(), "w": MatchNone()})
        )
    )