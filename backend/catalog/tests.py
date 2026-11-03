import json

from django.test import Client, TestCase
from django.urls import reverse

from .models import Book
from .seed import reset_library


class LabApiTests(TestCase):
    def setUp(self):
        reset_library()
        self.client = Client(enforce_csrf_checks=True)
        state = self.client.get(reverse("catalog:state"))
        self.token = state.json()["csrfToken"]
        self.headers = {"HTTP_X_CSRFTOKEN": self.token}

    def json(self, method, url, payload=None):
        return getattr(self.client, method)(
            url,
            data=json.dumps(payload or {}),
            content_type="application/json",
            **self.headers,
        )

    def test_seeded_state_has_academic_fields(self):
        data = self.client.get(reverse("catalog:state")).json()
        self.assertEqual(len(data["books"]), 3)
        self.assertEqual(data["books"][2]["title"], "Django for Beginners")
        self.assertEqual(data["books"][2]["price"], 650.0)

    def test_filter_by_price_and_empty_result(self):
        url = reverse("catalog:books-collection")
        response = self.client.get(url, {"field": "price", "operator": "lt", "value": "700"})
        self.assertEqual([row["id"] for row in response.json()["result"]], [1, 3])
        empty = self.client.get(url, {"field": "price", "operator": "lt", "value": "1"})
        self.assertEqual(empty.json()["result"], [])
        invalid = self.client.get(url, {"field": "price", "operator": "lt", "value": "not-a-number"})
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(invalid.json()["error"], "Price must be a valid number.")

    def test_create_read_patch_delete_and_reset(self):
        collection = reverse("catalog:books-collection")
        created = self.json("post", collection, {
            "title": "Interactive Django", "author": "Lab Author",
            "category": "Web Development", "price": 625, "available": True,
        })
        self.assertEqual(created.status_code, 201)
        pk = created.json()["result"][0]["id"]
        item = reverse("catalog:book-item", args=[pk])
        self.assertEqual(self.client.get(item).status_code, 200)
        updated = self.json("patch", item, {"price": 700, "available": False})
        self.assertEqual(updated.json()["result"][0]["price"], 700.0)
        self.assertFalse(updated.json()["result"][0]["available"])
        deleted = self.client.delete(item, **self.headers)
        self.assertEqual(deleted.status_code, 200)
        self.assertFalse(Book.objects.filter(pk=pk).exists())
        reset = self.json("post", reverse("catalog:reset-data"))
        self.assertEqual(len(reset.json()["books"]), 3)

    def test_validation_and_missing_record_statuses(self):
        bad = self.json("post", reverse("catalog:books-collection"), {
            "title": "", "author": "", "category": "", "price": -1, "available": True,
        })
        self.assertEqual(bad.status_code, 400)
        missing = self.client.get(reverse("catalog:book-item", args=[999]))
        self.assertEqual(missing.status_code, 404)

    def test_csrf_rejects_write_without_token(self):
        response = self.client.post(
            reverse("catalog:books-collection"),
            data=json.dumps({"title": "Blocked"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_request_pipeline_get_post_404_and_invalid_route(self):
        endpoint = reverse("catalog:execute-request")
        ok = self.json("post", endpoint, {"method": "GET", "path": "/books/"})
        self.assertEqual(ok.json()["status"], 200)
        self.assertIn("A. Sharma", ok.json()["html"])
        self.assertNotIn("{{ book.author", ok.json()["html"])
        created = self.json("post", endpoint, {
            "method": "POST", "path": "/books/class-based/",
            "title": "Created Through View", "author": "CBV Author",
            "category": "Web Development", "price": 555, "available": True,
        })
        self.assertEqual(created.json()["status"], 201)
        missing = self.json("post", endpoint, {"method": "GET", "path": "/books/999/"})
        self.assertEqual(missing.json()["status"], 404)
        route = self.json("post", endpoint, {"method": "GET", "path": "/unknown/"})
        self.assertEqual(route.json()["status"], 404)

    def test_migration_visualization_uses_real_schema(self):
        url = reverse("catalog:migrations")
        self.json("post", url, {"action": "reset"})
        changed = self.json("post", url, {"action": "change"}).json()
        self.assertTrue(changed["changed"])
        generated = self.json("post", url, {"action": "generate"}).json()
        self.assertTrue(generated["generated"])
        applied = self.json("post", url, {"action": "apply"}).json()
        self.assertTrue(applied["applied"])
        self.assertIn("price", applied["columns"])
