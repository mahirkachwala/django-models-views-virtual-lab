from django.db import transaction
from .models import Author, Book

SEED_BOOKS = [
    (1, "Django Basics", "A. Sharma", "Web Development", 500, True),
    (2, "Web Development", "R. Mehta", "Web Development", 750, False),
    (3, "Django for Beginners", "W. Smith", "Web Development", 650, True),
]


@transaction.atomic
def reset_library():
    """Reset only this educational catalogue, using stable IDs for trace examples."""
    Book.objects.all().delete()
    Author.objects.all().delete()
    for pk, title, name, category, price, available in SEED_BOOKS:
        author, _ = Author.objects.get_or_create(name=name)
        Book.objects.create(
            id=pk,
            title=title,
            author=author,
            category=category,
            price=price,
            available=available,
        )


def seed_library(reset=False):
    """Populate the isolated experiment catalogue only when it is empty."""
    if reset or not Book.objects.exists():
        reset_library()
