# Generated by Django 4.1.7 on 2023-04-30 15:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0019_alter_fiddle_data"),
    ]

    operations = [
        migrations.AlterField(
            model_name="fiddle",
            name="kind",
            field=models.CharField(
                choices=[
                    ("JSON_MATCHER", "JSON Matcher"),
                    ("UI1", "UI1"),
                    ("PYTHON_MATCHER", "Python Matcher"),
                ],
                default=None,
                max_length=64,
            ),
        ),
    ]
