from django.db import models


class MatcherProject(models.Model):
    name = models.CharField(max_length=300)
    order = models.PositiveIntegerField(default=0)
    is_favourite = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ("order",)


class MatcherStratagem(models.Model):
    project = models.ForeignKey(MatcherProject, on_delete=models.CASCADE)
    name = models.CharField(max_length=300)
    nodes = models.JSONField(default=dict, null=True, blank=True)
    edges = models.JSONField(default=dict, null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_favourite = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ("order",)
        # TODO: indexes on keys for nodes and edges
        # Learn: GIN index
        _sql = """
        CREATE INDEX idx_flow_data_keys_only ON my_table USING GIN (jsonb_field jsonb_path_ops);
        """


class MatcherNode(models.Model):
    id = models.UUIDField(primary_key=True)
    project = models.ForeignKey(MatcherProject, on_delete=models.CASCADE)
    what = models.CharField(max_length=300, null=True, blank=True, default=None)
    data = models.JSONField(default=None, null=True, blank=True)

    def __str__(self):
        return f"{self.what} for {self.project}"