from django.urls import path
from . import api, views

app_name = "catalog"
urlpatterns = [
    path("api/state/", api.state, name="state"),
    path("api/books/", api.books_collection, name="books-collection"),
    path("api/books/<int:pk>/", api.book_item, name="book-item"),
    path("api/reset/", api.reset_data, name="reset-data"),
    path("api/request/", api.execute_request, name="execute-request"),
    path("api/trace/", api.trace, name="trace"),
    path("api/migrations/", api.migrations, name="migrations"),
    path("books/", views.book_list, name="book-list"),
    path("books/class-based/", views.BookListView.as_view(), name="book-list-cbv"),
    path("books/<int:pk>/", views.book_detail, name="book-detail"),
]
