from django.contrib import admin
from . import models


admin.site.register(models.CodeSearch)


class LogAdmin(admin.ModelAdmin):
    list_display = ["pk", "created_dt"]


admin.site.register(models.Log, LogAdmin)
