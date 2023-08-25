import glob
import uuid
from django.db import models
from django.conf import settings
from .fiddles import FiddleType
from .framework import StatusOptions


class StratagemKind(StatusOptions):
    pass


class ClojureGraph1(StratagemKind):
    default = True
    name = "ClojureGraph1"


class PythonRefactoring1(StratagemKind):
    name = "PythonRefactoring1"


class WebDashboard1(StratagemKind):
    name = "WebDashboard1"


class ZenDocument1(StratagemKind):
    name = "ZenDocument1"


class Stratagem(models.Model):
    name = models.CharField(max_length=1024)
    kind = StratagemKind.get_field()
    data = models.JSONField(default=dict)
    created_dt = models.DateTimeField(auto_now_add=True)
    modified_dt = models.DateTimeField(auto_now=True)
    params = models.JSONField(default=dict)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-modified_dt"]


class CodeFormat(StatusOptions):
    pass


class PythonCodeFormat(CodeFormat):
    name = "Python (LibCST)"


class JSONCodeFormat(CodeFormat):
    name = "WebDashboard1"


class CodeSearch(models.Model):
    name = models.CharField(max_length=1024)
    kind = CodeFormat.get_field()
    data = models.TextField(default="", blank=True)
    grammar = models.TextField(default="", blank=True)
    created_dt = models.DateTimeField(auto_now_add=True)
    modified_dt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-modified_dt"]


class MatcherFiddle(models.Model):
    name = models.CharField(max_length=1024, blank=True, default="")
    uuid = models.UUIDField(default=uuid.uuid4)
    data = models.TextField(default="", blank=True)
    grammar = models.TextField(default="", blank=True)
    created_dt = models.DateTimeField(auto_now_add=True)
    modified_dt = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE
    )
    session_id = models.CharField(max_length=128, null=True, blank=True, default=None)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-modified_dt"]


# Fiddle


def getNone():
    return None


class Fiddle(models.Model):
    # Definition
    kind = FiddleType.as_choices()
    version = models.CharField(default="000", max_length=3)
    # Revision
    uuid = models.UUIDField(default=uuid.uuid4)
    rev = models.PositiveBigIntegerField(default=1)
    parent = models.ForeignKey("self", blank=True, null=True, on_delete=models.SET_NULL)
    # Data
    name = models.CharField(max_length=1024, blank=True, default="")
    data = models.JSONField(default=getNone, blank=True, null=True)
    # Timestamp
    created_dt = models.DateTimeField(auto_now_add=True)
    modified_dt = models.DateTimeField(auto_now=True)
    # Ownership
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-modified_dt"]


class Log(models.Model):
    created_dt = models.DateTimeField()
    data = models.JSONField(default=None, null=True, blank=True)
    data2 = models.JSONField(default=None, null=True, blank=True)


class Author(models.Model):
    first_name = models.CharField(max_length=300)
    last_name = models.CharField(max_length=300)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Book(models.Model):
    author = models.ForeignKey("Author", on_delete=models.CASCADE)
    name = models.CharField(max_length=300)

    def __str__(self):
        return f"{self.author} - {self.name}"
