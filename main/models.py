import glob
import uuid
from django.db import models
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
        ordering = ['-modified_dt']


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
        ordering = ['-modified_dt']


class MatcherFiddle(models.Model):
    name = models.CharField(max_length=1024)
    code = models.UUIDField(default)
    kind = CodeFormat.get_field()
    data = models.TextField(default="", blank=True)
    grammar = models.TextField(default="", blank=True)
    created_dt = models.DateTimeField(auto_now_add=True)
    modified_dt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


    class Meta:
        ordering = ['-modified_dt']
