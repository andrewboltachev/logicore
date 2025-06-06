# Generated by Django 4.1.7 on 2023-07-13 11:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0020_alter_fiddle_kind"),
    ]

    operations = [
        migrations.CreateModel(
            name="Log",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_dt", models.DateTimeField()),
                ("data", models.JSONField(blank=True, default=None, null=True)),
            ],
        ),
        migrations.AlterField(
            model_name="fiddle",
            name="kind",
            field=models.CharField(
                choices=[
                    ("JSON_MATCHER", "JSON Matcher"),
                    ("UI1", "UI1"),
                    ("PYTHON_MATCHER", "Python Matcher"),
                    ("LOGICORE1", "Logicore1"),
                ],
                default=None,
                max_length=64,
            ),
        ),
    ]
