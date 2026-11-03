# Django experiment service

This optional Django 5.2 reference project demonstrates real SQLite operations. The current visual Models & Views Virtual Lab runs entirely in the browser and does not call this service. Learners do not need Python or this service to use the seven visual activities. The retained API client can support future integration; see the root `HANDOFF.md` before changing that architecture.

For a maintainer starting the project on a new machine:

1. Create a Python virtual environment and install `requirements.txt`.
2. From this folder, run `python manage.py migrate` and `python manage.py seed_library`. Use `--reset` only when you intend to replace the demonstration catalogue.
3. Start Django on `127.0.0.1:8010`.
4. Start the frontend from the project root on `127.0.0.1:3000`.

The service uses a deterministic three-book seed. The migration activity creates its scratch project under the operating system's temporary directory, separate from the catalogue database.

From this folder, run `python manage.py test catalog` to verify CSRF protection, validation, CRUD, request handling, 404 behavior, and migration introspection. Settings and the development secret key are for localhost only, not public deployment.
