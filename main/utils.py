import locale
from functools import partial


def unique(a):
    r = []
    for x in a:
        if x not in r:
            r.append(x)
    return r


def dissoc(d, *keys):
    return {k: v for k, v in d.items() if k not in keys}


def menu_view(k):
    def menu_view_decorator(cls):
        menu_views[k].append(cls)
        return cls

    return menu_view_decorator


def all_subclasses(cls):
    for c in cls.__subclasses__():
        for s in all_subclasses(c):
            yield s
        yield c


def validation_error_message(e):
    if hasattr(e, 'message'):
        if e.params:
            return e.message % e.params
        else:
            return e.message
    if hasattr(e, 'error_list'):
        return validation_error_message(e.error_list[0])
    raise NotImplemented


def identity(e):
    return e

def walk(inner, outer, coll):
    if isinstance(coll, list):
        return outer([inner(e) for e in coll])
    elif isinstance(coll, dict):
        return outer(dict([inner(e) for e in coll.items()]))
    elif isinstance(coll, tuple):
        return outer([inner(e) for e in coll])
    else:
        return outer(coll)

def prewalk(fn, coll):
    return walk(partial(prewalk, fn), identity, fn(coll))

def postwalk(fn, coll):
    return walk(partial(postwalk, fn), fn, coll)

def prewalk_demo(coll):
    def prn(e):
        #print "Walked:", e
        return e
    return prewalk(prn, coll)

def postwalk_demo(coll):
    def prn(e):
        #print "Walked:", e
        return e
    return postwalk(prn, coll)
