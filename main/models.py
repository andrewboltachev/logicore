from django.db import models


class Stratagem(models.Model):
    name = models.CharField(max_length=1024)
    data = models.JSONField(default=dict)
    created_dt = models.DateTimeField(auto_now_add=True)
    modified_dt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


    class Meta:
        ordering = ['-modified_dt']
