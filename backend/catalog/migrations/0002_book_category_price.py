from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):
    dependencies = [("catalog", "0001_initial")]
    operations = [
        migrations.AddField(
            model_name="book",
            name="category",
            field=models.CharField(default="Web Development", max_length=80),
        ),
        migrations.AddField(
            model_name="book",
            name="price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=8),
        ),
        migrations.AddConstraint(
            model_name="book",
            constraint=models.CheckConstraint(
                condition=Q(price__gte=0), name="book_price_nonnegative"
            ),
        ),
    ]
