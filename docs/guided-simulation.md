# Guided Simulation redesign

Updated 3 November 2026.

## User request and outcome

The user asked for the Simulation to match the other academic pages and be easy for first-time learners and a teacher demonstration. The default entry now opens `components/visual-lab/guided-simulation.tsx` inside the same header, sidebar, breadcrumbs, title and footer as Aim/Theory/Procedure. The former standalone layout and learning-mode/activity-submit controls are no longer used by the default flow.

Seven lesson tabs use concrete actions: Open a page, Add a field, Update the database, Find books, Manage books, Connect records, and Fix a problem. Each includes a short Try it instruction, visible evidence, a What you learned takeaway, and a named Next button. Prerequisites link back to the required lesson. The Procedure page and teacher guide use the exact labels.

The November 3 revision puts Input, Execution and Result side by side. It follows the panel layout of [IIT Kanpur's Python Loops experiment](https://python-iitk.vlabs.ac.in/exp/loops/simulation.html), and adapts entity rectangles, relationship diamonds and cardinalities from [IIT Kharagpur's E-R Modeling experiment](https://se-iitkgp.vlabs.ac.in/exp/e-r-modeling/er-diagram.html). Components and Django content are written for this lab, retaining its existing academic palette: white, blue, orange, neutral borders and semantic success/error colours. Code/history are expandable; compact headers, book cards and a horizontally scrollable phone lesson strip reduce page length. Result panels always remain present, including before execution.

## Implementation

### Preview reverted

The experimental reference preview was reverted on 3 November 2026 at the user's request. The coral/gray three-panel design is the only current view; its preview selector, alternate stylesheet and theme-switching test are no longer active. Learner records and the `django-visual-journey-v3` storage key remain unchanged. The verified snapshot `backups/simulation-before-reference-preview-2026-11-03.zip` retains 12 original UI/core/test files and a SHA-256 manifest.

The final navigation uses plain text tabs with an orange underline. Decorative completion ticks, numbered badges and progress bars are removed. Completion evidence remains in the state machine and the final experiment record, so prerequisites and Next still work without visual progress clutter.

The follow-up theme revision brings the workbench itself closer to the two references: a coral lesson heading, centered gray panel headers with thin outlines, compact classic blue controls, dark body text and plain instructions. The E-R drawing area uses a pale cyan heading/canvas and outlined entities/diamonds, with blue/cyan highlights for enabled relationships. The outer academic header, sidebar and footer keep their established style. No operation/state logic changes in this theme revision.

- `components/visual-lab/guided-simulation.tsx`: seven lessons, shared reducer, automatic/paused playback, completion, persistence, notes export, reset confirmation.
- `components/visual-lab/guided-workbench.tsx` and `app/guided-workbench.css`: shared three-panel layout, responsive stacking and compact presentation.
- `components/visual-lab/guided-relationships.tsx` and `app/guided-relationships.css`: E-R diagram, validated cardinality, author matches and actual join rows. Blue/cyan highlights indicate the relationships explored/enabled by the learner.
- `app/guided-lab.css`: shared academic typography/colours, forms, comparisons, phone record cards and responsive layouts.
- `app/page.tsx`: uses the shared academic page shell for Simulation as well as other sections.
- `components/visual-lab/primitives.tsx`: reusable table cells carry data-label attributes so phone cards identify their values.
- `lib/visual-lab.ts`: validated state machine with corrected Django request explanations. Model edits, captured migration snapshots, filtering, stage-dependent commits and relationship pairs retain their existing semantics.
- `tests/guided-simulation.browser.mjs`: optional real-browser acceptance check. It needs Playwright and installed Chrome. Use `PLAYWRIGHT_MODULE` to supply an existing Playwright module file URL, or install Playwright in your test environment so the bare import resolves. Set `VLAB_URL` to override localhost.

The older `components/visual-lab/simulation.tsx` and activity components remain in source as the previous interface. They are not mounted by the default entry. The archived report and earlier handoff are labelled historical. `PACKAGE-MANIFEST.json` belongs to the original source archive and does not hash subsequent development changes.

## Learning and state semantics

Navigation alone earns no completion. A successful list request must reach its final browser stage. The model task needs price; migration completion requires applied snapshots matching the current model. Queries must be evaluated, and all four CRUD operations must be observed. The guided relationship task additionally needs at least one book linked to two categories. Both error scenarios require a failed request followed by a successful repair/retest.

Animations start automatically at 650ms per stage. Pause animation and Next step allow inspection; navigation is disabled during unfinished operations. A restored operation is paused and exposes continuation controls. Database writes still happen at their Database stage exactly once, and the library display waits for the completed response.

The existing `django-visual-journey-v3` browser state is retained. Starting over requires confirmation, resets local form drafts and keeps quiz scores. Observation download also exposes copyable text. The visual lessons remain a browser teaching model, independent of the optional real Django/SQLite reference backend. No arbitrary Python/SQL is executed; relationship setup abstracts its migration.

### Django accuracy corrections

The request descriptions and displayed snippets now distinguish a lazy list QuerySet from an immediate single-object lookup. In the list example, `Book.objects.all()` constructs the QuerySet; the view passes it in the context; the template's loop evaluates it and reads the database. A missing list template fails before that book query runs. Detail views accept the URL's `pk` parameter and `get_object_or_404()` performs the lookup before rendering the detail template.

For POST operations, CSRF protection is represented as middleware before the view. The view binds and validates the form. `form.save(commit=False)` returns a model instance without saving it; `book.save()` writes it once at the Database stage. This illustrated form excludes categories, which are linked separately in the relationship activity. A successful write redirects to a fresh GET. The simulated GET of the empty form omits database-backed author-choice loading; it makes no Book query. These corrections change teaching text, code snippets and trace ordering, without changing the controls, layout or seven activities.

Primary references: [Django 5.2 QuerySet laziness](https://docs.djangoproject.com/en/5.2/topics/db/queries/#querysets-are-lazy), [URL dispatcher](https://docs.djangoproject.com/en/5.2/topics/http/urls/), [CSRF protection](https://docs.djangoproject.com/en/5.2/ref/csrf/), and [ModelForm save method](https://docs.djangoproject.com/en/5.2/topics/forms/modelforms/#the-save-method).

## Acceptance coverage

After the Django accuracy corrections, all 24 state tests (including four semantic regressions), all seven browser workflows, lint, TypeScript, the local production build, and the Vercel static build passed. The optional Django service also passed its seven tests. The four academic/simulation stylesheets retain their original SHA-256 hashes. Developer and faculty contact details were supplied by the project owner.

The browser check covers: shared shell; direct-jump prerequisites; successful/404 request paths; pause/step; wrong field type; separate migration generation/application; default prices and sample-price import; price filter, optional predictions and empty QuerySet; GET rejection; create/read/update/delete and delete cancellation; commit before browser response; wrong relationship cardinality; shared category pairs and two-category completion; wrong diagnosis/repair; verified route/template fixes; seven-lesson completion; actual observation download; saved state, paused restoration and reset; shared navigation; 390px layouts and phone record actions.

Desktop and phone screenshots are in `docs/screenshots/guided-*.png`. Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` for the normal project checks. The framework may still print its existing route-classification warning while building successfully.

Validation on 3 November 2026: all seven activities passed the browser regression, including desktop panel alignment, phone stacking, no horizontal overflow, E-R cardinality/link/unlink behavior, CRUD commit timing, validation, reset, paused restore and downloads. Assertions confirm no progress bars or lesson-tab badges. All 20 state tests, lint, TypeScript and production build passed. At 1440px width the full initial page measured 1345px high and the completed relationship page 1593px, including the shared header and footer. Phone panels stack and require more scrolling. Code and history remain expandable. Saved learner data is preserved; tests used isolated browser contexts.

Validation on 1 November 2026: all seven guided browser workflows passed, including the phone Read/Add interaction, 390px layout checks, notes download, paused restoration and confirmed reset. All 20 existing state tests, lint, TypeScript and production build passed. The frontend, Django reference backend and frontend API proxy returned HTTP 200 after restart.
