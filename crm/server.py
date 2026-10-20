"""Local Northline demo server: static files and a small SQLite opportunity API."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
from contextlib import contextmanager
from datetime import date
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
FIELDS = ("title", "company", "contact", "email", "value", "stage", "category", "date", "notes")
STAGES = {"lead", "qualified", "proposal", "won"}
CATEGORIES = {"Website", "Platform", "E-commerce", "CRM"}
ITEM_ROUTE = re.compile(r"^/api/opportunities/(\d+)$")
PUBLIC_FILES = {"/", "/index.html", "/app.js", "/styles.css"}


@contextmanager
def connect(db_path: Path):
    connection = sqlite3.connect(db_path, timeout=10)
    connection.row_factory = sqlite3.Row
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def initialize(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with connect(db_path) as db:
        db.execute("""CREATE TABLE IF NOT EXISTS opportunities (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            contact TEXT NOT NULL,
            email TEXT NOT NULL,
            value INTEGER NOT NULL,
            stage TEXT NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT ''
        )""")
        db.execute("CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        seeded = db.execute("SELECT 1 FROM metadata WHERE key = 'seeded'").fetchone()
        if not seeded:
            samples = json.loads((ROOT / "seed.json").read_text(encoding="utf-8"))
            db.executemany(
                "INSERT INTO opportunities (id, title, company, contact, email, value, stage, category, date, notes) "
                "VALUES (:id, :title, :company, :contact, :email, :value, :stage, :category, :date, :notes)",
                samples,
            )
            db.execute("INSERT INTO metadata (key, value) VALUES ('seeded', '1')")


def validate(payload: object) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("Expected an opportunity object")
    result = {}
    for field in ("title", "company", "contact", "email"):
        value = payload.get(field)
        if not isinstance(value, str) or not value.strip() or len(value) > 120:
            raise ValueError(f"{field} must contain 1–120 characters")
        result[field] = value.strip()
    if "@" not in result["email"] or "." not in result["email"].split("@")[-1]:
        raise ValueError("email must be valid")
    value = payload.get("value")
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 10_000_000:
        raise ValueError("value must be a whole amount from 0 to 10,000,000")
    result["value"] = value
    if not isinstance(payload.get("stage"), str) or payload["stage"] not in STAGES:
        raise ValueError("stage is not recognized")
    if not isinstance(payload.get("category"), str) or payload["category"] not in CATEGORIES:
        raise ValueError("category is not recognized")
    result["stage"] = payload["stage"]
    result["category"] = payload["category"]
    for field, limit in (("date", 10), ("notes", 2000)):
        value = payload.get(field, "")
        if not isinstance(value, str) or len(value) > limit:
            raise ValueError(f"{field} is too long")
        result[field] = value.strip()
    if result["date"]:
        try:
            date.fromisoformat(result["date"])
        except ValueError as exc:
            raise ValueError("date must use YYYY-MM-DD") from exc
    return result


def make_handler(db_path: Path):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def send_json(self, status: HTTPStatus, body: object) -> None:
            encoded = json.dumps(body, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(encoded)

        def read_json(self) -> object:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 65536:
                raise ValueError("Request body must be between 1 byte and 64 KB")
            raw = self.rfile.read(length)
            try:
                return json.loads(raw, parse_constant=lambda _x: (_ for _ in ()).throw(ValueError("Invalid number")))
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                raise ValueError("Invalid JSON body") from exc

        def do_GET(self) -> None:
            path = urlsplit(self.path).path
            if path == "/api/health":
                self.send_json(HTTPStatus.OK, {"ok": True})
                return
            if path == "/api/opportunities":
                with connect(db_path) as db:
                    rows = db.execute("SELECT * FROM opportunities ORDER BY id").fetchall()
                self.send_json(HTTPStatus.OK, [dict(row) for row in rows])
                return
            if path.startswith("/api/"):
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint not found"})
                return
            if path in PUBLIC_FILES:
                super().do_GET()
            else:
                self.send_error(HTTPStatus.NOT_FOUND, "File not found")

        def do_HEAD(self) -> None:
            if urlsplit(self.path).path in PUBLIC_FILES:
                super().do_HEAD()
            else:
                self.send_error(HTTPStatus.NOT_FOUND, "File not found")

        def do_POST(self) -> None:
            if urlsplit(self.path).path != "/api/opportunities":
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint not found"})
                return
            try:
                data = validate(self.read_json())
            except ValueError as exc:
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
                return
            with connect(db_path) as db:
                cursor = db.execute(
                    "INSERT INTO opportunities (title, company, contact, email, value, stage, category, date, notes) "
                    "VALUES (:title, :company, :contact, :email, :value, :stage, :category, :date, :notes)",
                    data,
                )
                row = db.execute("SELECT * FROM opportunities WHERE id = ?", (cursor.lastrowid,)).fetchone()
            self.send_json(HTTPStatus.CREATED, dict(row))

        def do_PUT(self) -> None:
            match = ITEM_ROUTE.fullmatch(urlsplit(self.path).path)
            if not match:
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint not found"})
                return
            try:
                data = validate(self.read_json())
            except ValueError as exc:
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
                return
            item_id = int(match.group(1))
            with connect(db_path) as db:
                cursor = db.execute(
                    "UPDATE opportunities SET title=:title, company=:company, contact=:contact, email=:email, "
                    "value=:value, stage=:stage, category=:category, date=:date, notes=:notes WHERE id=:id",
                    {**data, "id": item_id},
                )
                row = db.execute("SELECT * FROM opportunities WHERE id = ?", (item_id,)).fetchone()
            self.send_json(HTTPStatus.OK, dict(row)) if cursor.rowcount else self.send_json(
                HTTPStatus.NOT_FOUND, {"error": "Opportunity not found"}
            )

        def do_DELETE(self) -> None:
            match = ITEM_ROUTE.fullmatch(urlsplit(self.path).path)
            if not match:
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint not found"})
                return
            with connect(db_path) as db:
                cursor = db.execute("DELETE FROM opportunities WHERE id = ?", (int(match.group(1)),))
            if cursor.rowcount:
                self.send_json(HTTPStatus.OK, {"deleted": True})
            else:
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "Opportunity not found"})

    return Handler


def create_server(host: str = "127.0.0.1", port: int = 8080, db_path: Path | None = None) -> ThreadingHTTPServer:
    database = Path(db_path or ROOT / "northline.sqlite3").resolve()
    initialize(database)
    return ThreadingHTTPServer((host, port), make_handler(database))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--db", type=Path, default=ROOT / "northline.sqlite3")
    args = parser.parse_args()
    server = create_server(args.host, args.port, args.db)
    print(f"Northline running at http://{args.host}:{server.server_port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
