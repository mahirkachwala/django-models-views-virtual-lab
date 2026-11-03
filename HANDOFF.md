> **Current UI update — 3 November 2026:** The default Simulation uses the shared academic shell and seven beginner lessons, now arranged as Input → Execution → Result panels. Relationships use an interactive E-R diagram. Code/history expand on demand and the existing page theme is preserved. Start with `docs/guided-simulation.md` and `docs/simulation-teacher-guide.md`. `components/lab-experiment.tsx` opens `components/visual-lab/guided-simulation.tsx`. The multi-mode standalone UI described below is historical. The existing reducer, browser storage key and optional backend separation are retained.

# Django Models & Views Virtual Lab — handoff

The experimental reference preview was reverted on 3 November 2026. The coral/gray three-panel design is the only current view, with no preview selector. The verified pre-preview snapshot remains at `backups/simulation-before-reference-preview-2026-11-03.zip`.

Prepared 16 October 2026 for continuing this project in another Codex workspace.

## Start here

1. Extract the ZIP into a normal writable folder, not inside the ZIP viewer.
2. Open that extracted project folder in Codex.
3. Install Node.js 24 LTS, including npm. The package declares Node >=22.13, but Node 24 is recommended for the native TypeScript test runner and tooling used here.
4. Open a terminal at the project root and run:

```powershell
npm ci
npm run dev
```

5. Open <http://127.0.0.1:3000/#simulation>.

The development server deliberately listens only on `127.0.0.1`, uses port `3000`, and will not silently choose a different port. If that port is occupied, identify the existing server before stopping anything. Stop this server with Ctrl+C in its terminal. Python, a database server, cloud credentials and a deployment account are not needed for the visual simulation.

Use npm and `package-lock.json` for this handoff. A historical pnpm lock/config is also retained as source material; do not alternate package managers while establishing the baseline. Dependencies and virtual environments must be recreated on the recipient's computer.

## What the user asked for

The project is an academic experiment about **Models and Views in Django**. The original request was to reproduce the conventional Virtual Labs experiment layout, with functional Aim, Theory, Pretest, Procedure, Simulation, Posttest, References, Contributors and Feedback pages. Repeated refinements requested meaningful learner input and corrective feedback rather than decorative animation or a static mockup.

The latest design reference is the [IIIT Hyderabad Data Structures Virtual Lab](https://ds1-iiith.vlabs.ac.in/List%20of%20experiments.html), especially the demonstration/practice/exercise approach and deliberate stepwise interactions. The current simulation UI was then changed to resemble its standalone experiment presentation. The earlier TCP screenshots supplied the academic page shell, not Django teaching content.

The latest user request is to transfer all source code and enough context for a friend to continue in Codex. This archive is a source handoff; it does not publish the experiment to Virtual Labs, IEEE, or any other public website.

## Current design to continue from

- **Simulation:** compact centered header; hamburger navigation; collapsible Instructions bar; a white workspace; blue controls and diagram tiles; rounded controls; an Observations area; and a speed slider for animated activities.
- **Academic pages:** the traditional Virtual Labs sidebar, breadcrumbs and footer remain.
- **Responsive behavior:** controls wrap; wide record tables and diagrams scroll within their own panels.
- **Learning model:** one shared college Library, with Demo, Practice and Exercise modes. Each activity asks the learner to inspect, predict or decide, act, and explain evidence.

Preserve this reference-inspired visual direction and the functional teaching flows when continuing, unless the owner asks for a change. Do not replace it with a generic dashboard simply because a different component library is available. The current visual baseline is `docs/screenshots/reference-ui-clone.jpg`; `interactive-relationships.jpg` is an earlier interaction snapshot.

## The seven activities

| Activity | Inputs and meaningful behavior |
|---|---|
| Request and Response | URL input and presets; stepwise component trace; next-component decisions in Exercise; response/status and visible evidence. |
| Creating a Django Model | A requirement, field and Django type; rejection of incorrect types; comparison of changed model and unchanged database. |
| Database Migration | A prediction, Create Migration and Apply Migration; recorded model snapshots, prerequisite feedback, schema differences and row defaults. |
| Querying Records | Field, operator and value; predicted book IDs or empty set; row-by-row predicate evaluation and missed/extra-row feedback. |
| CRUD Operations | Library forms and GET/POST choice; validation and deletion confirmation; a database observer that changes at commit before the browser receives the final response. |
| Model Relationships | Model endpoints and cardinality; clickable record links; author/book predictions; category memberships and their intermediate table. |
| Error Handling | A failed route/template case; component diagnosis; repair input; verification by rerunning the simulated request. |

The initial books are Django Basics (A. Sharma), Web Development (R. Mehta), and Django Models (A. Sharma). The initial model/schema has title and author; price and availability are added through the model and migration activities. The explicit **Load example prices** action sets original books 1–3 to 500, 750 and 650. Price less than 700 then selects IDs 1 and 3 on fresh data.

The observation notebook contains performed operations, current fields and record count, plus reflection prompts. **Reset Experiment** requires confirmation and resets laboratory state while preserving quiz answers. Switching activity or mode preserves shared laboratory data and pauses playback; temporary drafts and prediction attempts may restart.

## Architecture and file map

This is a Vinext/Vite application with React 19 and TypeScript, using Next-compatible app conventions. Use the existing package scripts, not `next dev`.

| Path | Responsibility |
|---|---|
| `app/page.tsx` | Academic page shell, hash navigation and simulation presentation. |
| `app/globals.css` | General page and academic shell styling. |
| `app/visual-lab.css` | Simulation styling, responsive layout and reference UI overrides. |
| `components/lab-lessons.tsx`, `lib/lesson-data.ts` | Academic explanations, procedure and supporting lesson content. |
| `components/lab-quiz.tsx`, `lib/lab-progress.ts` | Assessments and saved learning progress. |
| `components/lab-experiment.tsx` | Entry point for the current visual simulation. |
| `components/visual-lab/simulation.tsx` | Activity/mode selection, playback, persistence, reset, notebook and Finish view. |
| `components/visual-lab/flow.tsx`, `request.tsx` | Request trace, component decisions, error diagnosis and repair. |
| `components/visual-lab/schema.tsx` | Model requirements and migration snapshots/playback. |
| `components/visual-lab/orm.tsx` | Query inputs, prediction and row evaluation. |
| `components/visual-lab/library.tsx` | Library CRUD UI, request stages and database observer. |
| `components/visual-lab/relationships.tsx` | Record graph, cardinality and join-table construction. |
| `components/visual-lab/primitives.tsx` | Shared typed props and visual components. |
| `lib/visual-lab.ts` | Deterministic reducer, queries, records, schema, operation planning, snapshots and persistence helpers. |
| `tests/visual-lab.test.mjs` | State-machine regression tests. |
| `backend/` | Optional separate Django 5.2/SQLite reference implementation. |
| `lib/django-client.ts`, `lib/virtual-lab/` | Retained earlier client/experiment support; follow actual imports before assuming these drive current scenes. |
| `public/` | Local logo, fonts, favicon and social preview assets. |
| `vite.config.ts`, `.openai/hosting.json` | Development configuration. The hidden hosting file is imported by Vite and must remain present; both bindings are currently null. |

Read `docs/simulation-teacher-guide.md` for teaching examples and `docs/visual-simulation-report.md` for state semantics and acceptance scenarios. Some descriptive control labels in those earlier documents predate the final UI styling pass: the current code uses a speed slider, for example. `docs/traditional-vlab-redesign.md` is explicitly historical.

## What is real, and what is modeled

The visible simulation is a deterministic **browser teaching model**. It does not execute arbitrary learner Python, SQL or terminal commands. It does not call the optional Django service. Generated Python/ORM/SQL, HTTP statuses, redirects and CSRF acceptance explain the modeled sequence; they are not evidence of a real network request or live middleware check.

SQL is conceptual; the animation evaluates predicates row by row for teaching rather than reproducing an optimizer's query plan. JavaScript number handling is not Python Decimal arithmetic. Fields, routes and operators are deliberately constrained. Category relationship creation abstracts its migration; schema migration is taught separately. There is no classroom account system, multiuser synchronization or server-side grading.

Shared visual state is stored under `django-visual-journey-v3` in browser localStorage. Quiz progress is separate. These browser records, scores, drafts and cookies are **not inside the source ZIP** and will not appear on a friend's machine. A paused journey is restored paused. The optional SQLite database is separate again; initialize and seed it rather than relying on a local runtime database.

Known export caveat: observation text is generated, and a visible copyable fallback exists. A completed download event could not be verified in the embedded browser during the previous checks. A recipient should test saving in their browser and can use the fallback if needed.

The included backend uses local educational settings, not a production deployment configuration. Its source is retained as a runnable reference; the current visual scenes do not use its SQLite operations.

## Optional Django reference backend

Python 3.11 or newer is recommended. From the root on Windows:

```powershell
py -3.11 -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
backend/.venv/Scripts/python.exe backend/manage.py migrate
backend/.venv/Scripts/python.exe backend/manage.py seed_library --reset
backend/.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8010
```

If a different compatible Python version is installed, use its launcher instead of `py -3.11`. On macOS/Linux use `python3` to create the environment and `backend/.venv/bin/python` for subsequent commands. `seed_library --reset` replaces the reference catalogue with sample data; use it for a fresh setup, not an existing catalogue you intend to preserve.

The Vite configuration proxies `/api` to `127.0.0.1:8010` for retained reference endpoints. Running this service does not automatically connect it to the current simulation UI. Integrating actual backend execution would be additional work requiring an explicit design decision.

## Validation and recorded status

After installing dependencies, start the app or run a build to let the framework generate its types, then run:

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Optional backend tests:

```powershell
backend/.venv/Scripts/python.exe backend/manage.py test catalog
```

Handoff checks on **16 October 2026**, using Node 24.21.0 and npm 11.19.0: the npm v3 lockfile's root versions matched `package.json`; all 20 simulation tests and 7 Django tests passed; TypeScript checking, lint and the production build passed. Vinext printed its route-classification warning (`? Unknown`) but completed successfully. A fresh installation on another computer has not been tested.

The implementation report also records the following **previous verification on 2 October 2026**; this is not a claim that every browser scenario was rerun when the handoff was prepared:

- 20 simulation tests, TypeScript, lint and production build passed.
- 7 catalog/backend tests passed.
- Browser testing covered all seven activities, wrong and correct decisions, migration snapshots, query prediction, CRUD including cancellation, relationships and both repair cases.
- A CRUD database commit showed four records while the browser still showed three; the browser changed after the final response.
- The seven activities had no page-level horizontal overflow at 390px; wide diagrams/tables scrolled internally.
- Notebook content and copy fallback were checked; the embedded-browser download caveat remains as described above.

Before claiming new work is complete, rerun the relevant checks and inspect the actual desktop/mobile UI. Useful regression cases include a model edit after generation but before applying its snapshot; drop then re-add a field through ordered migrations; literal wildcard query text; an empty QuerySet; repeated advancement after a write; and restoring a paused operation without committing twice.

## Archive contents and exclusions

The handoff contains project source, assets, dependency manifests/locks, configuration, Django source/migrations, regression tests, screenshots and documentation. It intentionally excludes installed `node_modules`, Python virtual environments, build output, tool caches, temporary logs, local database/runtime files and secret environment files. These exclusions keep it portable and avoid transferring machine-specific state. Install dependencies rather than copying another computer's runtime folders.

There was no Git repository/history in the working folder at handoff. The friend can initialize Git after extracting and verifying the baseline. An archive transfers files, not the original Codex conversation, browser session, background server processes or accounts; this document preserves the essential continuation context.

## Ready-to-paste Codex continuation prompt

```text
You are continuing this existing Django Models & Views Virtual Lab project.
Read HANDOFF.md, README.md and the current implementation before changing code.
Set up dependencies using the included npm lockfile and start the lab locally
at http://127.0.0.1:3000/#simulation. Establish what currently works first.

The owner's reference is the IIIT-H Virtual Labs Data Structures experiments:
https://ds1-iiith.vlabs.ac.in/List%20of%20experiments.html
Preserve the present reference-inspired simulation UI and the traditional
academic page shell while implementing my next requested changes. The seven
activities, Demo/Practice/Exercise modes, shared library state, predictions,
corrective feedback, migration snapshots, CRUD commit/response separation,
relationship graph, error repairs and observation notebook must remain usable.

The current visual scenes are a browser teaching model, not actual arbitrary
Python/SQL execution. The optional Django backend is separate. Do not claim
that modeled events execute real backend code. Inspect imports and state flow
before modifying older retained components. Use the source and current UI as
the authority when historical documentation uses outdated control labels.

Check affected scenarios in the browser, run the meaningful tests/typecheck/
lint/build, and report exactly what changed and any remaining limitations.
My next requested change is: [describe it here].
```
