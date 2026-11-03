import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import uuid
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import connection
from django.db.models import Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.test import Client
from django.test.utils import CaptureQueriesContext
from django.urls import Resolver404, resolve
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .models import Author, Book
from .seed import seed_library

BACKEND = Path(settings.BASE_DIR)
SCRATCH = None


def serialize(book):
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author.name,
        "category": book.category,
        "price": float(book.price),
        "available": book.available,
    }


def rows(queryset=None):
    queryset = queryset if queryset is not None else Book.objects.select_related("author").order_by("id")
    return [serialize(book) for book in queryset]


def captured_sql(context):
    return [entry["sql"] for entry in context.captured_queries]


def body(request):
    try:
        value = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ValueError("Send a valid JSON request body.")
    if not isinstance(value, dict):
        raise ValueError("The JSON body must be an object.")
    return value


def error(message, status=400, code="invalid_request", details=None):
    payload = {"error": message, "code": code}
    if details:
        payload["details"] = details
    return JsonResponse(payload, status=status)


def clean_text(value, name, limit):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{name} is required.")
    value = value.strip()
    if len(value) > limit:
        raise ValueError(f"{name} may contain at most {limit} characters.")
    return value


def clean_price(value):
    try:
        value = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Price must be a valid number.")
    if value < 0:
        raise ValueError("Price cannot be negative.")
    if value > Decimal("999999.99"):
        raise ValueError("Price is outside the supported experiment range.")
    return value.quantize(Decimal("0.01"))


def clean_available(value):
    if not isinstance(value, bool):
        raise ValueError("Availability must be true or false.")
    return value


def clean_id(value):
    if isinstance(value, bool):
        raise ValueError("Book ID must be a positive integer.")
    try:
        value = int(value)
    except (TypeError, ValueError):
        raise ValueError("Book ID must be a positive integer.")
    if value < 1:
        raise ValueError("Book ID must be a positive integer.")
    return value


def validation_error(exc):
    details = exc.message_dict if hasattr(exc, "message_dict") else {"record": exc.messages}
    return error("The record did not pass model validation.", 400, "validation_error", details)


def response_payload(result, message, context, operation):
    return {
        "books": rows(),
        "result": result,
        "message": message,
        "operation": operation,
        "sqlCount": len(context.captured_queries),
    }


@ensure_csrf_cookie
@require_GET
def state(request):
    seed_library()
    return JsonResponse({"books": rows(), "csrfToken": get_token(request)})


@ensure_csrf_cookie
@require_http_methods(["GET", "POST"])
def books_collection(request):
    seed_library()
    if request.method == "GET":
        queryset = Book.objects.select_related("author").order_by("id")
        field = request.GET.get("field", "all")
        operator = request.GET.get("operator", "all")
        value = request.GET.get("value", "").strip()
        search = request.GET.get("search", "").strip()
        with CaptureQueriesContext(connection) as context:
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search)
                    | Q(author__name__icontains=search)
                    | Q(category__icontains=search)
                )
            if field != "all":
                if field not in {"title", "author", "category", "price", "available"}:
                    return error("Choose a supported filter field.")
                if field in {"title", "author", "category"}:
                    if operator not in {"contains", "equals"}:
                        return error("Text fields support Contains or Equals.")
                    try:
                        cleaned_value = clean_text(value, "Filter value", 150)
                    except ValueError as exc:
                        return error(str(exc))
                    lookup_field = "author__name" if field == "author" else field
                    lookup = f"{lookup_field}__icontains" if operator == "contains" else f"{lookup_field}__iexact"
                    queryset = queryset.filter(**{lookup: cleaned_value})
                elif field == "price":
                    if operator not in {"lt", "lte", "equals", "gte", "gt"}:
                        return error("Price supports <, ≤, =, ≥, or >.")
                    try:
                        cleaned_price = clean_price(value)
                    except ValueError as exc:
                        return error(str(exc))
                    lookup = "price" if operator == "equals" else f"price__{operator}"
                    queryset = queryset.filter(**{lookup: cleaned_price})
                else:
                    if operator != "equals" or value.lower() not in {"true", "false"}:
                        return error("Availability requires Equals and Yes or No.")
                    queryset = queryset.filter(available=value.lower() == "true")
            result = rows(queryset)
        return JsonResponse(response_payload(result, f"Query returned {len(result)} matching record(s).", context, "filter"))

    try:
        data = body(request)
        title = clean_text(data.get("title"), "Title", 150)
        author_name = clean_text(data.get("author"), "Author", 100)
        category = clean_text(data.get("category"), "Category", 80)
        price = clean_price(data.get("price"))
        available = clean_available(data.get("available"))
        with CaptureQueriesContext(connection) as context:
            author, _ = Author.objects.get_or_create(name=author_name)
            book = Book(title=title, author=author, category=category, price=price, available=available)
            book.full_clean()
            book.save()
            result = [serialize(Book.objects.select_related("author").get(pk=book.pk))]
        return JsonResponse(response_payload(result, f"Created Book #{book.pk}.", context, "create"), status=201)
    except ValueError as exc:
        return error(str(exc))
    except ValidationError as exc:
        return validation_error(exc)


@require_http_methods(["GET", "PATCH", "DELETE"])
def book_item(request, pk):
    seed_library()
    try:
        with CaptureQueriesContext(connection) as context:
            try:
                book = Book.objects.select_related("author").get(pk=pk)
            except Book.DoesNotExist:
                return error("No book exists with that ID.", 404, "book_not_found")
            if request.method == "GET":
                return JsonResponse(response_payload([serialize(book)], f"Retrieved Book #{pk}.", context, "read"))
            if request.method == "DELETE":
                title = book.title
                book.delete()
                return JsonResponse(response_payload([], f"Deleted {title}.", context, "delete"))
            data = body(request)
            if not any(key in data for key in {"title", "author", "category", "price", "available"}):
                return error("Provide at least one field to update.")
            if "title" in data:
                book.title = clean_text(data["title"], "Title", 150)
            if "author" in data:
                name = clean_text(data["author"], "Author", 100)
                book.author, _ = Author.objects.get_or_create(name=name)
            if "category" in data:
                book.category = clean_text(data["category"], "Category", 80)
            if "price" in data:
                book.price = clean_price(data["price"])
            if "available" in data:
                book.available = clean_available(data["available"])
            book.full_clean()
            book.save()
            book = Book.objects.select_related("author").get(pk=pk)
            return JsonResponse(response_payload([serialize(book)], f"Updated Book #{pk}.", context, "update"))
    except ValueError as exc:
        return error(str(exc))
    except ValidationError as exc:
        return validation_error(exc)


@require_POST
def reset_data(request):
    seed_library(reset=True)
    return JsonResponse({"books": rows(), "result": rows(), "message": "The experiment database was restored to its three seeded records.", "operation": "reset", "sqlCount": 0})


@require_POST
def execute_request(request):
    try:
        data = body(request)
        method = str(data.get("method", "GET")).upper()
        path = data.get("path")
        permitted_paths = {"/books/", "/books/1/", "/books/999/", "/unknown/", "/books/class-based/"}
        if method not in {"GET", "POST"}:
            return error("Choose GET or POST.")
        if path not in permitted_paths:
            return error("Choose one of the laboratory endpoints.")
        if method == "POST" and path not in {"/books/", "/books/class-based/"}:
            return error("POST is available only for the list endpoints.")
        request_data = {}
        if method == "POST":
            request_data = {
                "title": data.get("title", ""),
                "author_name": data.get("author", ""),
                "category": data.get("category", ""),
                "price": data.get("price", ""),
                "available": "on" if data.get("available") else "",
            }
        try:
            match = resolve(path)
            view_name = match.view_name or getattr(match.func, "__name__", "view")
            route_matched = True
        except Resolver404:
            view_name = "No matching route"
            route_matched = False
        client = Client()
        with CaptureQueriesContext(connection) as context:
            response = client.get(path) if method == "GET" else client.post(path, data=request_data)
        html = response.content.decode(response.charset or "utf-8", errors="replace")
        count = Book.objects.count()
        stages = [
            {"name": "Browser", "detail": f"Created {method} request for {path}"},
            {"name": "URL", "detail": f"{'Matched ' + view_name if route_matched else 'No route matched'}"},
        ]
        if route_matched:
            stages.extend([
                {"name": "View", "detail": "Received the request and selected its method handler"},
                {"name": "Model", "detail": "Represented library data as Book objects"},
                {"name": "Database", "detail": f"Executed {len(context.captured_queries)} SQL operation(s)"},
                {"name": "View result", "detail": f"Prepared data; database currently has {count} book(s)"},
                {"name": "Template", "detail": "Rendered the catalogue response" if response.status_code != 405 else "Skipped because the method was rejected"},
            ])
        stages.append({"name": "Response", "detail": f"Returned HTTP {response.status_code}"})
        return JsonResponse({
            "method": method,
            "path": path,
            "status": response.status_code,
            "statusText": response.reason_phrase,
            "html": html,
            "view": view_name,
            "records": count,
            "sqlCount": len(context.captured_queries),
            "stages": stages,
        })
    except ValueError as exc:
        return error(str(exc))


@require_GET
def trace(request):
    path = request.GET.get("path", "")
    if path not in {"/books/", "/books/1/", "/books/999/", "/unknown/", "/books/class-based/"}:
        return error("Choose one of the experiment URLs.")
    client = Client()
    try:
        match = resolve(path)
        view_name = match.view_name or "view"
    except Resolver404:
        view_name = "No matching route"
    with CaptureQueriesContext(connection) as context:
        response = client.get(path)
    return JsonResponse({
        "path": path,
        "status": response.status_code,
        "html": response.content.decode(response.charset or "utf-8", errors="replace"),
        "sql": captured_sql(context),
        "view": view_name,
        "error": "" if response.status_code < 400 else "The request produced an error response.",
    })


def sandbox_files(changed=False):
    app = SCRATCH / "scratchapp"
    (app / "migrations").mkdir(parents=True, exist_ok=True)
    (SCRATCH / "scratchconfig").mkdir(parents=True, exist_ok=True)
    files = {
        "manage.py": "import os,sys\nos.environ.setdefault('DJANGO_SETTINGS_MODULE','scratchconfig.settings')\nfrom django.core.management import execute_from_command_line\nif __name__=='__main__': execute_from_command_line(sys.argv)\n",
        "scratchconfig/__init__.py": "",
        "scratchconfig/settings.py": "from pathlib import Path\nBASE_DIR=Path(__file__).resolve().parent.parent\nSECRET_KEY='sandbox'\nINSTALLED_APPS=['django.contrib.contenttypes','scratchapp']\nDATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':BASE_DIR/'sandbox.sqlite3'}}\nDEFAULT_AUTO_FIELD='django.db.models.BigAutoField'\n",
        "scratchconfig/urls.py": "urlpatterns=[]\n",
        "scratchapp/__init__.py": "",
        "scratchapp/apps.py": "from django.apps import AppConfig\nclass ScratchappConfig(AppConfig):\n name='scratchapp'\n",
        "scratchapp/migrations/__init__.py": "",
        "scratchapp/models.py": "from django.db import models\nclass Author(models.Model):\n name=models.CharField(max_length=100)\nclass Book(models.Model):\n title=models.CharField(max_length=150)\n author=models.ForeignKey(Author,on_delete=models.PROTECT)\n" + (" price=models.DecimalField(max_digits=8,decimal_places=2,default=0)\n" if changed else ""),
    }
    for relative, text in files.items():
        path = SCRATCH / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")


def sandbox_command(*args):
    environment = os.environ.copy()
    environment["DJANGO_SETTINGS_MODULE"] = "scratchconfig.settings"
    process = subprocess.run([sys.executable, "manage.py", *args], cwd=SCRATCH, env=environment, text=True, capture_output=True, timeout=20)
    output = ((process.stdout or "") + (process.stderr or "")).strip()
    if process.returncode:
        raise RuntimeError(output or "The Django operation failed.")
    return output or "Operation completed."


def sandbox_state(output="The isolated schema starts with title and author fields."):
    if SCRATCH is None:
        return {"changed": False, "generated": False, "applied": False, "columns": ["(no table yet)"], "output": output}
    model = SCRATCH / "scratchapp" / "models.py"
    changed = model.exists() and "price=models.DecimalField" in model.read_text(encoding="utf-8")
    migration = SCRATCH / "scratchapp" / "migrations" / "0001_initial.py"
    database = SCRATCH / "sandbox.sqlite3"
    columns = []
    if database.exists():
        with sqlite3.connect(database) as conn:
            columns = [column[1] for column in conn.execute("PRAGMA table_info(scratchapp_book)")]
    return {"changed": changed, "generated": migration.exists(), "applied": "price" in columns, "columns": columns or ["(no table yet)"], "output": output}


def reset_sandbox():
    global SCRATCH
    SCRATCH = Path(tempfile.gettempdir()) / "django-models-views-migrations" / uuid.uuid4().hex
    sandbox_files(False)
    return sandbox_state("Migration experiment reset. The live table has not been created.")


@ensure_csrf_cookie
@require_http_methods(["GET", "POST"])
def migrations(request):
    try:
        if request.method == "GET":
            if SCRATCH is None:
                reset_sandbox()
            return JsonResponse(sandbox_state())
        data = body(request)
        action = data.get("action")
        if action == "reset":
            return JsonResponse(reset_sandbox())
        if SCRATCH is None:
            reset_sandbox()
        state = sandbox_state()
        if action == "change":
            if not state["changed"]:
                sandbox_files(True)
            return JsonResponse(sandbox_state("Added the Price field to Model v2. The database schema is still unchanged."))
        if action == "generate":
            if not state["changed"]:
                return error("Add the Price field before creating a migration.")
            return JsonResponse(sandbox_state(sandbox_command("makemigrations", "scratchapp")))
        if action == "apply":
            if not state["generated"]:
                return error("Create the migration before updating the schema.")
            return JsonResponse(sandbox_state(sandbox_command("migrate")))
        return error("Choose Add field, Create migration, Update schema, or Reset.")
    except (ValueError, RuntimeError, subprocess.TimeoutExpired) as exc:
        return error(str(exc))


def csrf_failure(request, reason=""):
    return error("CSRF verification failed. Refresh the experiment and retry.", 403, "csrf_failed")
