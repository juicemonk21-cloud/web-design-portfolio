# Northline — client workspace

**Portfolio concept · CRM interface · Frontend and backend demo**

Northline is a concept client relationship workspace for a small creative studio. The demo uses fictional companies and sample project values to show how a tailored CRM can make an agency pipeline easier to read and manage.

## What works

- Overview with project and revenue summaries
- Pipeline with draggable deal cards and editable detail panels
- Search and service filtering
- Contact directory and activity timeline
- Add, edit, and delete opportunities
- CSV export
- SQLite persistence when run through the included Python server
- Local browser storage when opened as a standalone static page
- Responsive layout, keyboard focus, and reduced-motion support

## Run locally

Run `python server.py` from this folder and open `http://127.0.0.1:8080`. The standard-library server creates `northline.sqlite3` and seeds it with fictional sample opportunities on first launch. Add, edit, move, and delete actions use the HTTP API and persist across reloads.

In this Codex workspace, if `python` points to the Windows Store stub, run `& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" server.py` in PowerShell.

To view the static version, open `index.html` directly in a browser. It keeps the same interface and saves changes in local browser storage. No package installation or build step is needed.

Run the API smoke test with `python -m unittest test_api.py`.

The API exposes `GET /api/opportunities`, `POST /api/opportunities`, `PUT /api/opportunities/{id}`, and `DELETE /api/opportunities/{id}`. The server binds to localhost by default and has no authentication, so it is intended for local demonstration.

Preview images are in `screenshots/overview.png` and `screenshots/pipeline.png`.

## Portfolio description

**Northline — a bespoke CRM concept for creative studios**

Designed and built an interactive client workspace that puts opportunities, contacts, and activity in one clear view. The responsive interface includes a drag-and-drop pipeline, editable project records, filtering, and CSV export. A Python HTTP API and SQLite database persist opportunity changes in the local demo; a standalone version works with browser storage. The visual system pairs precise typography with quiet color and purposeful motion so the tool feels fast and approachable in daily use.

This is an independent concept project with fictional sample data, created to demonstrate product design and frontend development.
