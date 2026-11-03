from django.core.management.base import BaseCommand
from catalog.models import Book
from catalog.seed import reset_library


class Command(BaseCommand):
    help = "Seed the educational catalogue. --reset explicitly replaces existing books."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true")

    def handle(self, *args, **options):
        if Book.objects.exists() and not options["reset"]:
            self.stdout.write("Existing catalogue kept. Use --reset to restore the example records.")
            return
        reset_library()
        self.stdout.write(self.style.SUCCESS("Seeded 3 library books."))
