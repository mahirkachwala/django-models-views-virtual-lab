from django.http import HttpResponseNotAllowed
from django.shortcuts import get_object_or_404, render
from django.views.generic import ListView

from .forms import BookForm
from .models import Author, Book


def visible_books(request):
    books = Book.objects.select_related("author")
    if request.GET.get("all") != "1":
        books = books.filter(available=True)
    return books


def create_book_from_request(request):
    form = BookForm(request.POST)
    if not form.is_valid():
        return None, form
    author, _ = Author.objects.get_or_create(name=form.cleaned_data["author_name"])
    book = form.save(commit=False)
    book.author = author
    book.full_clean()
    book.save()
    return book, form


def book_list(request):
    if request.method == "POST":
        book, form = create_book_from_request(request)
        if book is None:
            return render(
                request,
                "catalog/book_list.html",
                {"books": visible_books(request), "implementation": "Function-based view", "form_errors": form.errors},
                status=400,
            )
        return render(
            request,
            "catalog/book_list.html",
            {"books": visible_books(request), "implementation": "Function-based view", "created": book},
            status=201,
        )
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET", "POST"])
    return render(request, "catalog/book_list.html", {
        "books": visible_books(request), "implementation": "Function-based view",
    })


def book_detail(request, pk):
    book = get_object_or_404(Book.objects.select_related("author"), pk=pk)
    return render(request, "catalog/book_detail.html", {"book": book})


class BookListView(ListView):
    template_name = "catalog/book_list.html"
    context_object_name = "books"
    extra_context = {"implementation": "Class-based view (ListView)"}

    def get_queryset(self):
        return visible_books(self.request)

    def post(self, request, *args, **kwargs):
        book, form = create_book_from_request(request)
        self.object_list = self.get_queryset()
        context = self.get_context_data(
            created=book,
            form_errors=None if book else form.errors,
        )
        return self.render_to_response(context, status=201 if book else 400)
