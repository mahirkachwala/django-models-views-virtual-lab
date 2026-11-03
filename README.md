# Django Models & Views Virtual Lab

A Virtual Labs-style experiment for learning Django models, migrations, ORM queries, relationships, CRUD and request–response behavior through one college Library.

**Live lab:** [django-models-views-virtual-lab.vercel.app](https://django-models-views-virtual-lab.vercel.app/#simulation)

Project owner: [Mahir Kachwala](https://github.com/mahirkachwala) (mahirahmed.k@somaiya.edu). Contributor: [Arnav Kadhe](https://github.com/arnavkadhe) (arnav.kadhe@somaiya.edu). Institution: Somaiya Vidyavihar University.

Faculty Coordinator: Abhijeet Pasi (abhijeet.p@somaiya.edu), Somaiya Vidyavihar University.

Source repository: [mahirkachwala/django-models-views-virtual-lab](https://github.com/mahirkachwala/django-models-views-virtual-lab).

For Vercel, use the isolated static build described in [the deployment guide](docs/vercel-deployment.md). It imports the same pages, simulation components and styles as the local app. The optional Django reference service remains a separate localhost project.

## Learner experience

The restored coral/gray three-panel design is the only current Simulation view. There is no design selector; the original site header, sidebar, breadcrumbs, footer and academic pages remain intact.

Open [Simulation](http://127.0.0.1:3000/#simulation) and follow the seven lesson tabs. Simulation uses the same header, sidebar, breadcrumbs, title and footer as the academic pages.

| Lesson | Learner action |
|---|---|
| Open a page | Choose a friendly page preset and click Open page; inspect the returned result. |
| Add a field | Add Price with DecimalField; compare the model with the unchanged database. |
| Update the database | Create migration file, then Update database; watch the columns change. |
| Find books | Load example prices, enter a budget, optionally predict matches, and click Find books. |
| Manage books | Add, read, edit and confirm deletion using compact book cards. |
| Connect records | Trace Author–Book and Book–Category on an E-R diagram; inspect actual stored pairs. |
| Fix a problem | Read a clue, choose the faulty component, enter a repair and test both 404/500 cases. |

Each lesson uses **Input → Execution → Result** panels, a short **Try it** instruction and a **What you learned** takeaway. The layout follows the Python Loops Virtual Lab, with an E-R diagram for relationships. The shared academic shell is retained; the experiment uses the reference-style coral title strip, gray panel headers, compact blue buttons and a cyan E-R drawing area. Panels sit side by side on desktop and stack on phones; code, full traces and database comparisons expand only when needed. Animations run automatically; **Pause animation**, **Continue animation** and **Next step** allow inspection. There is no learning-mode selector or activity Submit step in the beginner interface.

Shared records and completion evidence are retained in browser localStorage. **Next** unlocks after the task is performed; lesson tabs allow revisiting topics. A prerequisite link directs learners to the model or migration lesson if the price column is missing. **Start over** requires confirmation and preserves quiz answers. **My observations** and **Save my observations** provide the experiment record and a copyable export fallback.

See [the short teacher guide](docs/simulation-teacher-guide.md) for a straightforward classroom demonstration. The previous multi-mode UI is retained in source at `components/visual-lab/simulation.tsx` for reference; `components/lab-experiment.tsx` now opens `guided-simulation.tsx`.

## Architecture and scope

- `app`, `components`, and `lib`: Vinext/React learning interface.
- `lib/visual-lab.ts`: deterministic teaching state machine, validation, migration snapshots, records and operation evidence.
- `components/visual-lab`: request graph, model/schema comparison, row evaluation, miniature library and relationship graph.
- `backend`: retained Django 5.2 + SQLite reference service. It can be run separately; the visual simulation does not call it.
- `public`: local interface assets.

This is a browser simulation. It does not execute learner Python, SQL or operating-system commands. Generated Django snippets and SQL illustrate the modeled behavior. SQL is conceptual; the row-by-row query animation is an explanation of predicates, not a database query plan. JavaScript number handling is not a replacement for Python decimal arithmetic. Category relationship setup abstracts its migration, and the shown CSRF acceptance is explanatory rather than a live security check.

Shared state uses `django-visual-journey-v3` in localStorage, independently of quiz scores and the optional backend database. It is local to the browser, not a multiuser service or a graded assessment platform.

See [the guided redesign report](docs/guided-simulation.md) for current UI and validation details. The older visual-simulation and traditional-layout reports are historical; their mode selectors and control labels no longer describe the default UI.

## Local startup

From the repository root (Node.js 24 recommended):

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:3000/#simulation`. The visual simulation does not need the backend.

Optional real Django reference service, in another terminal:

```powershell
py -3.11 -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
backend/.venv/Scripts/python.exe backend/manage.py migrate
backend/.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8010
```

## Validation commands

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
backend/.venv/Scripts/python.exe backend/manage.py test catalog
```

The final command requires the optional backend environment. The formatter excludes Django templates so HTML formatting cannot split Django template tags.
