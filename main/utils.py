import locale


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
