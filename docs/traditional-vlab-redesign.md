# Traditional Virtual Labs simulation redesign

## Scope

Only the Simulation interior was restructured. The Virtual Labs logo, header, orange divider, breadcrumbs, academic sidebar, footer, quizzes and reference pages remain. Procedure text was corrected to match the new controls.

## Removed and replaced

Removed the vertical journey rail, progress percentage/counter/bar, step badges, persistent inspector panels, full architecture graph, process strips beneath CRUD and queries, palette cards, miniature dashboard chrome and completion dashboard. The old `DjangoFlowDiagram`, `ProcessStrip`, `Playback`, `Inspector`, `MiniBrowser`, `ModelCard` and `DatabaseView` components were replaced within their existing files. No hidden dashboard is rendered beneath the new interface.

## New exercise structure

Every exercise uses an exercise dropdown with Submit, a rectangular Problem/Learning Objectives section, a green-bordered interaction area, a blue-bordered output, and Previous/Next navigation. The seven exercises can be selected freely. The final page is a plain observation summary, not a score or progress report. It says End of Experiment because navigation alone does not prove that every task has been performed.

1. **Request and Response:** a three-box Browser → Django → Books Page diagram. Playback highlights the active area and moves the arrows. Send Request, Pause and Continue are available. The returned books render below. View Django Steps expands the internal stages only on request.
2. **Creating a Django Model:** Add Field and Current Book Model tables, name/type validation, optional-field removal, Generate Model and a large Book class diagram with readable field descriptions. Model edits remain separate from the database.
3. **Database Migration:** a vertical Model Change → Create Migration → Migration → Apply Migration → Database construction, followed by before/current tables. Added and removed fields are recorded; schema and rows change only on application. New columns receive defaults; removing a column discards its values.
4. **Querying Records:** field/condition/value inputs, Find Books, highlighted database rows and a simple matching-books list. Loading example prices is a separate explicit action. ORM and conceptual SQL are optional disclosures.
5. **CRUD Operations:** one Book Records table, Add Book form, View/Edit/Delete actions and deletion confirmation. Changes complete on the shared state before the new table is displayed; changed rows highlight. Internal request processing is no longer animated under every action.
6. **Model Relationships:** fixed entities, relationship builder with From/Relationship/To/Label, editable relationship list and Draw Diagram. The large vertical diagram uses multiplicities and labels. Author selection and category checkboxes work on the same books. Removing the category relation clears its exercise links without deleting books.
7. **Error Handling:** Select Error, Load Problem, expected/current names, correction input and Fix. The Before path stops at the failing component. The After path reaches Books Page only when a re-evaluated request succeeds. Both incorrect and correct attempts are supported.

The restrained blue, cyan and green borders, plain tables, square buttons, simple arrows and inherited academic scale replace the earlier dashboard palette, metadata and nested cards. Advanced terminology and code are kept inside disclosures. The always-visible runtime disclaimer is removed; execution limitations are documented here and in Procedure.

## State and implementation

The existing pure reducer and versioned localStorage are reused, preserving compatible saved work. New actions support optional-field removal, relationship removal/labels and immediate validated operations for simple controls. Request/migration animation still uses the same stage execution. Old progress evidence remains internal for backward compatibility and regression coverage; it is not shown as learner gamification. No backend or external account is modified.

## Files

Modified: `components/visual-lab/simulation.tsx`, `request.tsx`, `flow.tsx`, `schema.tsx`, `orm.tsx`, `library.tsx`, `relationships.tsx`, `primitives.tsx`; `app/visual-lab.css`; `lib/visual-lab.ts`; `components/lab-lessons.tsx`; `tests/visual-lab.test.mjs`; `README.md`.

Created: this report (`docs/traditional-vlab-redesign.md`). Existing component files were rewritten in place rather than introducing a parallel UI.

## Run

From the repository root:

```powershell
npm run dev
```

Open http://127.0.0.1:3000/#simulation. The visual exercises require no backend process. Use Node 24 for the test suite.

## Limitations

This is a deterministic educational model, not execution of learner Python or SQL. The separate Django backend remains unchanged. Fields are limited to the Book exercise (title, author, price, available, published); title/author are required. Relationships are limited to Author–Book and Book–Category. Category setup abstracts the migration. SQL and request details are conceptual. Reset clears exercise data but keeps quiz answers. Local storage is browser-specific, not a user account or cloud database.

## Verification

Verified on 19 September 2026:

- `npm test`: all 16 reducer/state tests passed, including three new tests for immediate controls, migrated field removal and relationship removal/persistence.
- Retained Django integration suite: all 7 tests passed; Django system checks found no issues.
- `npm run lint` and `npx tsc --noEmit`: passed.
- `npm run build`: all five Vinext stages passed. Existing non-fatal plugin timing and route classification notices remain.
- All seven exercises were visually inspected at 1366 × 1000. The review included request playback/pause/continue, field add/remove/type validation/generation, migration creation/application, example-price loading/query matching, create/read/edit/cancel/delete, relationship add/draw/remove/re-add/tagging, and incorrect/correct repairs for both error problems.
- Exercise selector/Submit, Previous/Next/Finish, summary, reset/cancel and optional details were exercised. Reload preserved the shared schema and prices.
- All seven exercises were checked at 390 × 844 for horizontal page overflow. A long template-name comparison initially overflowed; wrapping was corrected and rechecked. Wide data tables remain scrollable within their containers.

The browser is left on the Request and Response exercise with a fresh set of exercise data. These checks cover the implemented teaching scenarios, not arbitrary Django programs or every browser/input combination.
