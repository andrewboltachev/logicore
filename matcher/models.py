from django.db import models


class MatcherProject(models.Model):
    name = models.CharField(max_length=300)

    def __str__(self):
        return self.name


class MatcherStratagem(models.Model):
    project = models.ForeignKey(MatcherProject, on_delete=models.CASCADE)
    name = models.CharField(max_length=300)
    graph = models.JSONField(default=None, null=True, blank=True)

    def __str__(self):
        return self.name


class MatcherNode(models.Model):
    id = models.UUIDField(primary_key=True)
    project = models.ForeignKey(MatcherProject, on_delete=models.CASCADE)
    what = models.CharField(max_length=300, null=True, blank=True, default=None)
    data = models.JSONField(default=None, null=True, blank=True)

    def __str__(self):
        return f"{self.what} for {self.project}"