from .utils import ClassHierarchy


class FiddleType(ClassHierarchy):
    @classmethod
    def get_template(cls):
        return getattr(cls, "TEMPLATE", cls.as_choice_key())


class JSONMatcherFiddleType(FiddleType):
    TEMPLATE = "JSONMatcherFiddle"
