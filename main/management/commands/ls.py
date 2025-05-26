import re
import sys

import tqdm

from rich import print

import libcst
from django.core.management.base import BaseCommand, CommandError
from django.template import Variable

from libcst_to_react.get_me_nodes import read_file
from main.models import RootedCopy
from main.parser.python import serialize_dc, unserialize_dc


class Command(BaseCommand):
    help = 'Creates a RootedCopy model instance with provided fs_path, name_from, and name_to.'

    def add_arguments(self, parser):
        parser.add_argument('id', type=str,
                            help='RootedCopy ID.')

    def handle(self, *args, **options):
        try:
            rc = RootedCopy.objects.get(pk=options["id"])
        except RootedCopy.DoesNotExist:
            sys.stderr.write(f'RootedCopy {options["id"]} does not exist.\n')
            sys.exit(1)
        for i, file in enumerate(rc.files.split("\n"), 1):
            print(f'[{i}] {file.replace(rc.fs_path, "")}')