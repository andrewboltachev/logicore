# Python Matcher Nodes
import dataclasses
from dataclasses import dataclass
from typing import Any
from unittest import case


# Types of data: Value, Grammar, Result, Payload


class MatchError(Exception):
    def __init__(self, message, klass, path, **params):
        super().__init__(message)
        self.klass = klass
        self.path = path
        self.params = params

    @property
    def message(self):
        params = "\n".join([f"{k}: {v}" for k, v in self.params.items()])
        return f"{self.message}\n{self.klass}\nPath: {self.path}\n{params}"


@dataclass
class Node:
    def is_final(self):
        """
        returns True if this node is a 'final object',
        i.e. represents a type with just one element
        """
        raise NotImplementedError()

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

    def _error(self, message, path, **params):
        return MatchError(message, self.__class__.__name__, path, **params)


@dataclass
class MatchAny(Node):
    def is_final(self):
        return False

    def forwards(self, *, value, path=None):
        return value, None

    def backwards(self, *, result, payload, path=None):
        return result

    def to_funnel(self, *, value, path=None):
        yield from []


@dataclass
class MatchNone(Node):
    def is_final(self):
        return True

    def forwards(self, *, value, path=None):
        return None, value

    def backwards(self, *, result, payload, path=None):
        return payload

    def to_funnel(self, *, value, path=None):
        yield from []


@dataclass
class MatchObjectFull(Node):
    map: dict[str, Node]

    def is_final(self):
        return all((x.is_final() for x in self.map.values()))

    def forwards(self, *, value, path=None):
        if not path:
            path = []
        self._check_type(path, value)
        keys = set(value.keys())
        result = {}
        payload = {}
        for k, g in self.map.items():
            v = self._get_key(path, value, k)
            try:
                result_item, payload_item = g.forwards(
                    value=v,
                    path=path + [k]
                )
                if result_item:
                    result[k] = result_item
                if payload_item:
                    payload[k] = payload_item
                keys.remove(k)
            except MatchError as e:
                raise self._error(
                    f"Key didn't match: {k}",
                    path,
                    key=k
                ) from e
        if keys:
            raise self._error(
                f"Extra keys found: {keys}",
                path,
                extra_keys=keys
            ) from None
        if len(result) == 1:
            result = list(result.values())[0]
        if not result:
            result = None
        return result, payload

    def backwards(self, *, result, payload, path=None):
        if not path:
            path = []
        if not payload:
            payload = {}
        # ...
        # {}
        # {f}
        # {t}
        # {f, t}
        # {f, t, t}
        regular_count = 0
        last_key = None
        for k, v in self.map.items():
            if not v.is_final():
                last_key = k
                regular_count += 1
            if regular_count >= 2:
                break
        match regular_count:
            case 0:
                result = {}
            case 1:
                result = {last_key: result}
            case _:
                pass
        value = {}
        for k, g in self.map.items():
            result_item = result.get(k, None)
            payload_item = payload.get(k, None)
            value[k] = g.backwards(result=result_item, payload=payload_item)
        return value

    def _check_type(self, path, value):
        if type(value) != dict:
            raise self._error(f"Not a dict", path, value=value) from None

    def _get_key(self, path, value, key):
        try:
            return value[key]
        except KeyError:
            raise self._error(
                f"Key missing: {key}",
                path,
                missing_key=key
            ) from None

    def to_funnel(self, *, value, path=None):
        if not path:
            path = []
        self._check_type(path, value)
        keys = set(value.keys())
        for k, g in self.map.items():
            try:
                yield from g.to_funnel(
                    value=self._get_key(path, value, k),
                    path=path + [k]
                )
            except MatchError as e:
                raise self._error(
                    f"Key didn't match: {k}",
                    path,
                    key=k
                ) from e
        if keys:
            raise self._error(
                f"Extra keys found: {','.join(keys)}",
                path,
                extra_keys=keys
            ) from None


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
    g = MatchObjectFull({"x": MatchAny(), "w": MatchNone()})
    print(to_dict(g))
    value = {"x": 1, "w": " "}
    r, p = g.forwards(value=value)
    print("r", r)
    print("p", p)
    v = g.backwards(result=r, payload=p)
    print("v", v)
    assert v == value