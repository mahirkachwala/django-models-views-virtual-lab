from django.db import models
from django.db.models import Q


class Author(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Book(models.Model):
    title = models.CharField(max_length=150)
    author = models.ForeignKey(Author, on_delete=models.PROTECT, related_name="books")
    category = models.CharField(max_length=80, default="Web Development")
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    available = models.BooleanField(default=True)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(condition=Q(price__gte=0), name="book_price_nonnegative"),
        ]

    def __str__(self):
        return self.title
