> Historical report: the default interface was replaced on 1 November 2026 by the guided lessons described in [guided-simulation.md](guided-simulation.md). Its reducer/state semantics remain relevant; mode selectors and UI instructions below are historical.

# Django visual simulation — current implementation report

Documentation updated: 2 October 2026.

This report describes the current seven-activity interface. Earlier descriptions of a dashboard, compact journey rail, Generate Model/Draw Diagram buttons, or preset-only ORM questions are historical. Current demonstration instructions and exact inputs are in [the teacher guide](simulation-teacher-guide.md).

## Scope and learning design

The simulation retains the Virtual Labs experiment shell and uses the [IIIT Hyderabad Data Structures lab supplied as a design reference](https://ds1-iiith.vlabs.ac.in/List%20of%20experiments.html) as a model for deliberate interaction: inspect a state, predict a consequence, perform a controlled operation, and use the resulting evidence.

The seven activities share a college Library: Request and Response, Creating a Django Model, Database Migration, Querying Records, CRUD Operations, Model Relationships, and Error Handling. Students select an activity and press **Submit**, or navigate with **Previous**, **Next**, and **Finish**.

Each activity has three modes:

- **Demo:** worked guidance and automatic playback for request, migration and CRUD stages.
- **Practice:** student-controlled stages, inputs and supported predictions.
- **Exercise:** additional decisions such as next-component prediction, required migration/query reasoning, form HTTP method selection, relationship construction, and diagnosis before repair.

The modes do not create separate datasets. Switching modes pauses playback and preserves records, fields, migrations and links. Local input drafts, predictions and attempt counters can restart when an activity remounts.

## Architecture and state

`lib/visual-lab.ts` owns the model definition, migrated schema, ordered migration snapshots, shared Book records, category pairs, query results, request state and operation evidence. Components dispatch constrained actions into the reducer.

A request is represented by a finite sequence of stages. The reducer advances the stage and commits a write once at the first appropriate Database stage; migration-file creation commits at the Migration stage. Generation captures a model snapshot, and operation evidence retains prior records and schema for comparison. Model edits made after a migration was generated therefore do not silently change what that migration applies.

Shared state is saved using `django-visual-journey-v3` in browser localStorage. An active journey is serialized paused. Returning to a paused operation allows it to finish without repeating an already-committed write. A reset is explicit and confirmed, and preserves quiz answers.

The simulation is a deterministic TypeScript teaching model. It is not a Python interpreter, SQL engine, or live HTTP connection to the optional Django backend.

## Activity behavior and evidence

| Activity | Meaningful interaction | Observable result |
|---|---|---|
| Request | Send list, detail, form, missing-object or unknown-route URLs; inspect stages; predict the next component. | Clickable stage sequence, current responsibility/code, final page/status, and reached execution trace. A wrong Exercise choice does not advance the request. |
| Model | Choose a library requirement and field type; deliberately test an incorrect type; add/remove a supported field. | Live side-by-side Python model and database diagrams. Corrective type feedback leaves state unchanged. Model edits do not mutate stored schema. |
| Migration | Predict the effect of generation; decide whether to create or apply; advance each stage. | Pending/applied snapshot and history, schema differences, and before/current records. Wrong command order receives specific feedback. |
| ORM | Construct a predicate; predict matching rows or an empty result; evaluate one row at a time. | ORM expression, conceptual SQL, Keep/Skip explanations, missed/extra-row feedback and a QuerySet result. Source records are unchanged. |
| CRUD | Operate a miniature library; submit forms with GET/POST; confirm deletion; step through the request. | A database observer changes at commit while the browser waits for the response. Successful writes show POST → 302 → GET → 200. |
| Relationships | Choose endpoints/cardinality; select individual records; predict foreign-key matches; create category pairs. | Live record graph, highlighted connections and an intermediate table. Incorrect cardinalities do not add a relationship. |
| Error handling | Load a 404/500 case, read execution evidence, diagnose its component, repair and test. | Before/after trace, progressive hints, attempt feedback and a successful page only when the repaired request succeeds. |

### Shared-data examples

The initial model has title and author. Adding price/DecimalField and available/BooleanField changes the model diagram only. Applying their migration gives existing books price 0 and availability True.

**Load example prices** then assigns ₹500, ₹750 and ₹650 to existing original books 1–3. Price less than 700 selects books 1 and 3 without changing any row. Custom books remain present and participate according to their own values.

CRUD creates and edits the same records queried by the ORM and displayed in the relationship graph. Deleting a book removes its category pairs. Removing a category membership removes only its pair, not the Book or Category.

Author → Book is one-to-many, represented by the required Book.author_id. Book ↔ Category uses intermediate pairs. The activity's author connector illustrates a relation already present in the model; removing that connector does not drop author_id.

### Controlled observations and feedback

- Request Exercise hides future stage names and advances only after a correct component choice.
- Model type mismatches explain the data representation instead of changing the definition.
- Migration Exercise requires a prediction; either prediction can be tested against the unchanged database after generation.
- ORM Practice/Exercise compares predicted IDs against actual current records. Exercise also checks whether unmatched rows remain in the source table. Results are invalidated when relevant query/data inputs change.
- CRUD Exercise requires an explicit form method. GET receives corrective feedback for a write form; no row changes.
- Relationship Exercise checks foreign-key cardinality and matching book IDs, then supports a concrete many-to-many construction.
- Error Exercise requires a correct diagnosis before exposing the configuration editor. A repair is verified by rerunning the simulated request.

These local checks are learning feedback, not a comprehensive grading system. CRUD observation markers show that operations occurred; they do not prove the learner used the same book for every action.

## Notebook and reflection

Each activity offers **Discuss your observation**. The expandable **Observation notebook** lists operations recorded by the state machine rather than awarding completion for opening a page.

**Download observations** produces `django-lab-observations.txt` containing recorded observations, current model/database fields, record count, and reflection questions. The Finish view presents the same evidence, **Repeat Experiment**, and **Go to Posttest**. Learner-written reflections are discussed externally; the notebook does not currently provide a free-text reflection editor.

## Source map

| File | Responsibility |
|---|---|
| `components/lab-experiment.tsx` | Simulator entry point. |
| `components/visual-lab/simulation.tsx` | Exercise selection, mode controls, playback scheduling, persistence, paused-operation routing, notebook, reset and finish. |
| `components/visual-lab/primitives.tsx` | Shared typed props, work/output areas, record tables, diagrams and optional code. |
| `components/visual-lab/flow.tsx` | Inspectable request stages and reached execution trace. |
| `components/visual-lab/request.tsx` | Request prediction and error diagnosis/repair activities. |
| `components/visual-lab/schema.tsx` | Requirement-based model design and migration comparison/playback. |
| `components/visual-lab/orm.tsx` | Query construction, prediction and explained row evaluation. |
| `components/visual-lab/library.tsx` | Miniature library, form validation, CRUD stages and before/after observer. |
| `components/visual-lab/relationships.tsx` | Record graph, cardinality feedback, predictions and category-pair construction. |
| `lib/visual-lab.ts` | Reducer, operation planning, query evaluation, snapshots, records and persistence helpers. |
| `app/visual-lab.css` | Scoped simulation layout, responsive tables/graphs and visual states. |
| `tests/visual-lab.test.mjs` | Simulator state-machine regression tests. |
| `backend` | Separate retained Django/SQLite reference implementation and integration tests. |

The visual interface uses existing hash routes. Aim, Theory, assessments, References and the surrounding Virtual Labs shell remain available.

## Actual limits

- Learner Python, SQL and shell commands are never executed by the visual activities.
- The displayed HTTP statuses, CSRF acceptance, form handling and redirects are modeled events. They do not test actual browser/server middleware.
- Supported model fields, routes, query operators and relationship types are intentionally constrained to the library experiment.
- Conceptual SQL does not reproduce a particular database backend's generated SQL or query plan. The animated row evaluation teaches predicates; real database optimizers may use other access paths.
- The simulator uses JavaScript numbers with teaching validation and rounding. It is not an arbitrary-precision implementation of Python's Decimal.
- Adding the category relationship abstracts its migration. Migration behavior is taught separately in the schema activity.
- Data remains in localStorage for one browser. There is no classroom account, shared database, multiuser concurrency, or automatic submission to a teacher.
- Switching modes preserves shared laboratory state but can clear temporary predictions and form drafts. Reloading pauses a journey.
- Resetting starts a new laboratory run after confirmation. Observation downloads are snapshots, not externally submitted reports.
- The optional Django backend is unchanged by this interaction redesign and is not called by these scenes.

## Run and validate

Use Node.js 24 for the development tools and native TypeScript test execution:

```powershell
npm run dev
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Open `http://127.0.0.1:3000/#simulation`. The optional backend tests require its environment:

```powershell
backend/.venv/Scripts/python.exe backend/manage.py test catalog
```

The current redesign should be checked with these acceptance scenarios:

1. Compare list/form/unknown-route/missing-object requests, including a wrong next-component prediction.
2. Reject an incorrect model type, add price and availability, and verify that the database is still unchanged.
3. Reject Apply before a pending migration exists, generate and apply it, and verify defaults. Test a further model edit after generation.
4. Load sample prices; predict and evaluate Price < 700; then test a boundary and an empty QuerySet.
5. Create, read, update and delete a book; stop after the database commit to confirm that the browser waits for the response.
6. Compare GET/POST feedback, invalid inputs, deletion cancellation and confirmed deletion.
7. Connect both relationship types, check author-linked IDs, and create/remove the three demonstration category pairs.
8. Diagnose and repair both error cases, including an incorrect diagnosis/repair.
9. Switch modes during a paused operation, reload, resume, and inspect shared data and observation export.
10. Check narrow-screen layouts, internal table/graph scrolling, keyboard controls, and the reset confirmation.

## Verification recorded on 2 October 2026

- All 20 simulation state-machine tests passed; TypeScript checking, lint and the production build passed.
- The optional Django reference service's 7 catalog tests passed.
- Browser checks covered all seven activities, wrong field/cardinality/request-stage choices, migration prerequisites and snapshots, correct and incorrect query predictions, the complete create/read/update/delete journey, cancellation of deletion, linked-record and join-table construction, and both error diagnoses and repairs.
- At the database commit stage, the database observer showed four rows while the browser still showed three; the browser updated after the final response.
- All seven activities had no document-level horizontal overflow at a 390-pixel viewport. Wide record diagrams and tables scroll within their own panels.
- Notebook evidence and its copyable export were verified. The embedded browser did not expose a completed download event, so saving the text file through that browser remains unverified; the visible copy fallback is available.

These checks cover the stated scenarios, not every possible browser or input. Earlier layout reports remain historical. The learning sequence was informed by the [IIIT-H Data Structures lab](https://ds1-iiith.vlabs.ac.in/List%20of%20experiments.html), especially its demonstration, practice and exercise separation.
