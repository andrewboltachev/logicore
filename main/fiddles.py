from .utils import ClassHierarchy


class FiddleType(ClassHierarchy):
    @classmethod
    def get_template(cls):
        return getattr(cls, "TEMPLATE", cls.as_choice_key() + "Fiddle")

    @classmethod
    def get_data(cls, self): # self is a View here. Named for convenience
        return {}

    @classmethod
    def post(cls, self): # self is a View here. Named for convenience
        return ({}, 200)


class JSONMatcherFiddleType(FiddleType):
    TEMPLATE = "JSONMatcherFiddle"
