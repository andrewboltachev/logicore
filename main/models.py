from django.db import models
from .framework import StatusOptions


class StratagemKind(StatusOptions):
    pass


class ClojureGraph1(StratagemKind):
    default = True
    name = "ClojureGraph1"


class PythonRefactoring1(StratagemKind):
    name = "PythonRefactoring1"


class Stratagem(models.Model):
    name = models.CharField(max_length=1024)
    kind = StratagemKind.get_field()
    data = models.JSONField(default=dict)
    created_dt = models.DateTimeField(auto_now_add=True)
    modified_dt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


    class Meta:
        ordering = ['-modified_dt']
