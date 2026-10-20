"""Smoke test for the local CRM API and SQLite persistence."""

import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from server import create_server


class OpportunityApiTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db = Path(self.temp.name) / "test.sqlite3"
        self.server = create_server(port=0, db_path=self.db)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp.cleanup()

    def request(self, path, method="GET", body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = Request(self.base + path, data=data, method=method)
        if data is not None:
            req.add_header("Content-Type", "application/json")
        try:
            with urlopen(req, timeout=3) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.load(error)

    def test_crud_and_persistence(self):
        status, initial = self.request("/api/opportunities")
        self.assertEqual(status, 200)
        self.assertEqual(len(initial), 12)

        deal = {
            "title": "Studio redesign", "company": "Sample Studio", "contact": "Taylor Lane",
            "email": "taylor@example.com", "value": 18000, "stage": "lead",
            "category": "Website", "date": "2026-11-20", "notes": "Portfolio API test",
        }
        status, created = self.request("/api/opportunities", "POST", deal)
        self.assertEqual(status, 201)
        self.assertGreater(created["id"], 12)

        deal["stage"] = "proposal"
        status, updated = self.request(f"/api/opportunities/{created['id']}", "PUT", deal)
        self.assertEqual(status, 200)
        self.assertEqual(updated["stage"], "proposal")

        status, all_deals = self.request("/api/opportunities")
        self.assertEqual(status, 200)
        self.assertEqual(len(all_deals), 13)
        self.assertEqual(next(d for d in all_deals if d["id"] == created["id"])["stage"], "proposal")

        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.server = create_server(port=0, db_path=self.db)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"
        persisted = self.request("/api/opportunities")[1]
        self.assertEqual(len(persisted), 13)
        self.assertEqual(next(d for d in persisted if d["id"] == created["id"])["stage"], "proposal")

        status, deleted = self.request(f"/api/opportunities/{created['id']}", "DELETE")
        self.assertEqual((status, deleted), (200, {"deleted": True}))
        self.assertEqual(self.request(f"/api/opportunities/{created['id']}", "DELETE")[0], 404)
        self.assertEqual(len(self.request("/api/opportunities")[1]), 12)

    def test_validation_and_private_files(self):
        status, result = self.request("/api/opportunities", "POST", {"title": "Missing fields"})
        self.assertEqual(status, 400)
        self.assertIn("error", result)
        invalid = {
            "title": "Test", "company": "Studio", "contact": "Taylor Lane",
            "email": "taylor@example.com", "value": 100, "stage": [],
            "category": "Website", "date": "", "notes": "",
        }
        self.assertEqual(self.request("/api/opportunities", "POST", invalid)[0], 400)
        for path in ("/server.py", "/seed.json", "/northline.sqlite3"):
            with self.assertRaises(HTTPError) as response:
                urlopen(self.base + path, timeout=3)
            self.assertEqual(response.exception.code, 404)


if __name__ == "__main__":
    unittest.main()
