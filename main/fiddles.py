from .utils import ClassHierarchy


class FiddleType(ClassHierarchy):
    @classmethod
    def get_data(cls, self): # self is a View here. Named for convenience
        return {}

    @classmethod
    def post(cls, self): # self is a View here. Named for convenience
        return ({}, 200)


class JSONMatcherFiddleType(FiddleType):
    pass


class UI1FiddleType(FiddleType):
    pass


class PythonMatcherFiddleType(FiddleType):
    pass


class Logicore1FiddleType(FiddleType):
    pass
