export const basicModels = `from django.db import models

class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
`;
export const fullModels = basicModels + `    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    available = models.BooleanField(default=True)
`;
export const listView = `from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .models import Book, Author
from .forms import BookForm

def home(request):
    return HttpResponse("Welcome to the library")

def book_list(request):
    books = Book.objects.all()
    return render(request, "catalog/book_list.html", {"books": books})

def book_detail(request, pk):
    book = get_object_or_404(Book, pk=pk)
    return render(request, "catalog/book_detail.html", {"book": book})

def dashboard(request):
    return HttpResponse("Library staff dashboard")
`;
export const formView = `
def book_create(request):
    if request.method == "POST":
        form = BookForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("book_list")
    else:
        form = BookForm()
    return render(request, "catalog/book_form.html", {"form": form})

def book_update(request, pk):
    book = get_object_or_404(Book, pk=pk)
    if request.method == "POST":
        form = BookForm(request.POST, instance=book)
        if form.is_valid():
            form.save()
            return redirect("book_list")
    else:
        form = BookForm(instance=book)
    return render(request, "catalog/book_form.html", {"form": form})

def book_delete(request, pk):
    book = get_object_or_404(Book, pk=pk)
    if request.method == "POST":
        book.delete()
        return redirect("book_list")
    return render(request, "catalog/book_confirm_delete.html", {"book": book})
`;
export const forms = `from django import forms
from .models import Book

class BookForm(forms.ModelForm):
    class Meta:
        model = Book
        fields = ["title", "author", "price", "available"]
`;
export const starterFiles: Record<string, string> = {
  'manage.py': `# Entry point for Django management commands.\nimport os\nimport sys\nfrom django.core.management import execute_from_command_line\nos.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")\nexecute_from_command_line(sys.argv)\n`,
  'project/settings.py': `SECRET_KEY = "education-only-not-a-production-key"\nDEBUG = True\nINSTALLED_APPS = ["django.contrib.auth", "django.contrib.contenttypes", "django.contrib.sessions", "django.contrib.staticfiles", "catalog"]\nMIDDLEWARE = ["django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware"]\nROOT_URLCONF = "project.urls"\nSTATIC_URL = "/static/"\nLOGIN_URL = "/accounts/login/"\n`,
  'project/urls.py': `from django.urls import path, include\nurlpatterns = [path("", include("catalog.urls"))]\n`,
  'catalog/urls.py': `from django.urls import path\nfrom . import views\nurlpatterns = [\n    path("", views.home, name="home"),\n    path("books/", views.book_list, name="book_list"),\n    path("books/<int:pk>/", views.book_detail, name="book_detail"),\n    path("books/create/", views.book_create, name="book_create"),\n    path("books/<int:pk>/edit/", views.book_update, name="book_update"),\n    path("books/<int:pk>/delete/", views.book_delete, name="book_delete"),\n    path("dashboard/", views.dashboard, name="dashboard"),\n]\n`,
  'catalog/models.py': fullModels,
  'catalog/views.py': listView + formView,
  'catalog/forms.py': forms,
  'templates/base.html': `{% load static %}\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>Campus library</title>\n    <link rel="stylesheet" href="{% static 'catalog/style.css' %}">\n</head>\n<body>\n    <header><h1>Campus library</h1></header>\n    <main>{% block content %}{% endblock %}</main>\n</body>\n</html>`,
  'templates/catalog/book_list.html': `{% extends "base.html" %}\n{% block content %}\n<h2>Books</h2>\n<ul>\n{% for book in books %}\n    <li>{{ book.title }} — {{ book.author.name }} — ₹{{ book.price }}</li>\n{% empty %}\n    <li>No books available.</li>\n{% endfor %}\n</ul>\n{% endblock %}`,
  'templates/catalog/book_detail.html': `{% extends "base.html" %}\n{% block content %}\n<h2>{{ book.title }}</h2>\n<p>Author: {{ book.author.name }}</p>\n<p>Price: ₹{{ book.price }}</p>\n{% endblock %}`,
  'templates/catalog/book_form.html': `{% extends "base.html" %}\n{% block content %}\n<h2>Add or edit a book</h2>\n<form method="post">\n    {% csrf_token %}\n    {{ form.as_p }}\n    <button type="submit">Save book</button>\n</form>\n{% endblock %}`,
  'templates/catalog/book_confirm_delete.html': `{% extends "base.html" %}\n{% block content %}\n<p>Delete {{ book.title }}?</p>\n<form method="post">{% csrf_token %}<button>Confirm deletion</button></form>\n{% endblock %}`,
  'static/catalog/style.css': `body { font-family: Arial, sans-serif; padding: 24px; color: #17354a; }\nheader { border-bottom: 3px solid #288fc9; }\nli { padding: 8px; }\nbutton { background: #288fc9; color: white; padding: 10px; }`,
};
