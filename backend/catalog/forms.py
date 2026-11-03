from django import forms

from .models import Book


class BookForm(forms.ModelForm):
    author_name = forms.CharField(max_length=100)

    class Meta:
        model = Book
        fields = ["title", "category", "price", "available"]

    def clean_price(self):
        price = self.cleaned_data["price"]
        if price < 0:
            raise forms.ValidationError("Price cannot be negative.")
        return price
