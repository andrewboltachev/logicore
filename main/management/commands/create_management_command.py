from django.core.management.base import BaseCommand, CommandError
from main.models import RootedCopy


class Command(BaseCommand):
    help = "Creates a RootedCopy model instance with provided fs_path, name_from, and name_to."

    def add_arguments(self, parser):
        parser.add_argument(
            "fs_path", type=str, help="The filesystem path for the RootedCopy instance."
        )
        parser.add_argument(
            "name_from",
            type=str,
            help='The "name_from" string for the RootedCopy instance.',
        )
        parser.add_argument(
            "name_to",
            type=str,
            help='The "name_to" string for the RootedCopy instance.',
        )

    def handle(self, *args, **options):
        fs_path = options["fs_path"]
        name_from = options["name_from"]
        name_to = options["name_to"]

        try:
            rooted_copy = RootedCopy.objects.create(
                fs_path=fs_path, name_from=name_from, name_to=name_to
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created RootedCopy: "{rooted_copy.name_from}" - "{rooted_copy.name_to}" with path "{rooted_copy.fs_path}"'
                )
            )
        except Exception as e:
            raise CommandError(f"Error creating RootedCopy: {e}")
