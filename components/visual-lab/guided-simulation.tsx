'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  authors,
  completed,
  fields,
  generatedCode,
  initialState,
  queryBooks,
  reduce,
  restore,
  serialize,
  storageKey,
  type Action,
  type Book,
  type FieldId,
  type Operation,
  type VisualState,
} from '@/lib/visual-lab';
import { completeSection, resetExperimentState } from '@/lib/lab-progress';
import { CodeReveal, ModelDiagram, RecordsTable } from './primitives';
import { Workbench, ExecutionPreview } from './guided-workbench';
import { RelationshipLesson } from './guided-relationships';

const lessons = [
  {
    short: 'Open a page',
    title: 'How does Django open a page?',
    task: 'Choose the Books page and click Open page. Watch the request reach the database and return.',
    takeaway:
      'The URL selects a view. The view gets the data and returns a page.',
  },
  {
    short: 'Add a field',
    title: 'Tell Django what a book contains',
    task: 'Add a price field to the Book model. Choose DecimalField because a price needs decimal places.',
    takeaway:
      'A model describes the data. Changing a model does not immediately change the database.',
  },
  {
    short: 'Update the database',
    title: 'Move your model change into the database',
    task: 'First create a migration file. Then apply it to add the price column to the database.',
    takeaway:
      'makemigrations records a change; migrate applies the recorded change to the database.',
  },
  {
    short: 'Find books',
    title: 'Find books within a budget',
    task: 'Load the example prices, enter a budget of 700, then click Find books.',
    takeaway:
      'Evaluating a filtered QuerySet retrieves matching records. The other books remain in the database.',
  },
  {
    short: 'Manage books',
    title: 'Add, read, edit and delete a book',
    task: 'Add Practical Django for ₹825. Read it, edit its price to ₹900, then delete it.',
    takeaway:
      'Create adds a row, read retrieves it, update changes it, and delete removes it.',
  },
  {
    short: 'Connect records',
    title: 'Connect authors, books and categories',
    task: 'Connect an author to their books. Then give one book two categories and inspect the stored links.',
    takeaway:
      'A foreign key links a book to one author. A many-to-many field stores book–category pairs in another table.',
  },
  {
    short: 'Fix a problem',
    title: 'Find and fix two common mistakes',
    task: 'Open each problem, identify the failing component, correct the highlighted text, and test your fix.',
    takeaway:
      'Find the first failing component, correct its configuration, and rerun the request to verify the repair.',
  },
];
type Send = (...actions: Action[]) => void;
type Props = { state: VisualState; send: Send; go: (step: number) => void };

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="guided-panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function Message({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <p className={`guided-message${error ? ' is-error' : ''}`} role="status">
      {children}
    </p>
  );
}
function BookCards({
  state,
  books,
  actions,
}: {
  state: VisualState;
  books: Book[];
  actions?: (book: Book) => ReactNode;
}) {
  return (
    <ul className="guided-record-cards">
      {books.map((book) => (
        <li key={book.id}>
          <div className="guided-record-title">
            <strong>{book.title}</strong>
            <span>#{book.id}</span>
          </div>
          <p>
            {authors.find((a) => a.id === book.author_id)?.name}
            {state.schema.includes('price') && (
              <> · ₹{book.price?.toFixed(2)}</>
            )}
          </p>
          {state.schema.includes('available') && (
            <small>{book.available ? 'Available' : 'Not available'}</small>
          )}
          {state.schema.includes('published') && (
            <small>Published: {book.published ?? 'Not set'}</small>
          )}
          {actions && (
            <div className="guided-record-actions">{actions(book)}</div>
          )}
        </li>
      ))}
    </ul>
  );
}
function NeedPrice({ state, go }: Props) {
  const step = state.model.includes('price') ? 2 : 1;
  return (
    <Panel title="One quick step first">
      <p>
        This activity needs a price column.{' '}
        {step === 1
          ? 'Add price to the model in lesson 2.'
          : 'Apply your migration in lesson 3.'}{' '}
        Your existing work is saved.
      </p>
      <button onClick={() => go(step)}>
        Go to lesson {step + 1}: {lessons[step].short}
      </button>
    </Panel>
  );
}
const friendlyNode: Record<string, string> = {
  Browser: 'Browser',
  URLconf: 'URL matching',
  Middleware: 'CSRF protection',
  View: 'View',
  Model: 'Model / ORM',
  Database: 'Database',
  Template: 'Page template',
  Response: 'HTTP response',
  Migration: 'Migration file',
  SQL: 'Database query',
};
function Playback({ state, send }: Pick<Props, 'state' | 'send'>) {
  const flow = state.flow;
  if (!flow) return null;
  const current = flow.stages[flow.index];
  return (
    <section className="guided-playback" aria-label="Operation progress">
      <div className="guided-playback-heading">
        <strong>
          {flow.done
            ? flow.error
              ? 'Request stopped'
              : 'Operation complete'
            : `Step ${flow.index + 1} of ${flow.stages.length}`}
        </strong>
        <span>
          {flow.method} {flow.path}
        </span>
      </div>
      <ol className="guided-flow-path" aria-label="Execution path">
        {flow.stages.map((stage, index) => (
          <li
            key={index}
            className={
              index === flow.index
                ? 'is-current'
                : index < flow.index
                  ? 'is-finished'
                  : ''
            }
            aria-current={index === flow.index ? 'step' : undefined}
          >
            <span>{index + 1}</span>
            {friendlyNode[stage.node] ?? stage.node}
          </li>
        ))}
      </ol>
      <div className="guided-current-stage">
        <span>{friendlyNode[current.node] ?? current.node}</span>
        <div>
          <strong>{current.title}</strong>
          <p>{current.detail}</p>
        </div>
      </div>
      {!flow.done && (
        <div className="guided-actions">
          <button
            onClick={() => send({ type: flow.playing ? 'pause' : 'resume' })}
          >
            {flow.playing ? 'Pause animation' : 'Continue animation'}
          </button>
          <button
            className="guided-secondary"
            disabled={flow.playing}
            onClick={() => send({ type: 'advance' })}
          >
            Next step
          </button>
          <small>Pause to explain a step, or let the animation finish.</small>
        </div>
      )}
      {flow.done && (
        <Message error={!!flow.error}>
          {flow.error
            ? `${flow.status}: ${flow.error}`
            : flow.operation.kind === 'request' ||
                flow.operation.kind === 'read'
              ? `${flow.status} OK — the page is ready.`
              : state.notice}
        </Message>
      )}
      <details className="guided-details">
        <summary>Code and full journey</summary>
        {current.code && (
          <pre
            className="guided-live-code"
            aria-label="Django code at this step"
          >
            <code>{current.code}</code>
          </pre>
        )}
        <ol className="guided-trace">
          {flow.stages.map((stage, index) => (
            <li key={index} className={index === flow.index ? 'current' : ''}>
              {friendlyNode[stage.node] ?? stage.node}: {stage.title}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function RequestLesson({ state, send }: Props) {
  const [path, setPath] = useState('/books/');
  const busy = !!state.flow && !state.flow.done;
  const flow =
    state.flow?.operation.kind === 'request' && !state.flow.operation.debug
      ? state.flow
      : null;
  return (
    <Workbench
      input={
        <>
          <h4>Choose a page</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send({
                type: 'start',
                operation: { kind: 'request', path },
                play: true,
              });
            }}
          >
            <div className="guided-form-row">
              <label>
                Page to open
                <select
                  value={path}
                  disabled={busy}
                  onChange={(e) => setPath(e.target.value)}
                >
                  <option value="/books/">All books — /books/</option>
                  <option value="/books/2/">One book — /books/2/</option>
                  <option value="/books/create/">
                    Empty book form — /books/create/
                  </option>
                  <option value="/books/999/">
                    Missing book — /books/999/
                  </option>
                  <option value="/unknown/">Unknown page — /unknown/</option>
                </select>
              </label>
              <button disabled={busy}>Open page</button>
            </div>
          </form>
          <p className="guided-help">
            Start with All books. Afterwards, try Unknown page to see where a
            404 happens.
          </p>
        </>
      }
      execution={
        <>
          {flow ? (
            <Playback state={state} send={send} />
          ) : (
            <ExecutionPreview
              steps={[
                'Browser',
                'URL matching',
                'View',
                'Model / ORM',
                'Page template',
                'Database',
                'Response',
              ]}
              code={
                'def book_list(request):\n    books = Book.objects.all()\n    return render(request,\n        "catalog/book_list.html",\n        {"books": books})'
              }
            >
              Click Open page to follow the request. For All books, the template
              loop evaluates the lazy QuerySet and reads the database.
            </ExecutionPreview>
          )}
        </>
      }
      result={
        <>
          <h4>The browser receives</h4>
          {flow?.done ? (
            <>
              {flow.error ? (
                <p>
                  {flow.error === 'Book does not exist'
                    ? 'The URL matched a view, but there is no book with that ID.'
                    : 'No URL pattern matched, so no view or database query ran.'}{' '}
                  Try All books to complete this lesson.
                </p>
              ) : flow.path === '/books/create/' ? (
                <p>
                  The empty form is ready. No book query was needed. Use All
                  books to follow the complete request journey.
                </p>
              ) : (
                <>
                  <div className="guided-browser-address">
                    {flow.path} <span>200 OK</span>
                  </div>
                  <h4>Campus Library</h4>
                  <ul className="guided-book-list">
                    {flow.result.map((book) => (
                      <li key={book.id}>{book.title}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="guided-empty">
              {flow
                ? 'Waiting for Django to return the page…'
                : 'Your page will appear here. Start with All books.'}
            </p>
          )}
        </>
      }
    />
  );
}

function ModelLesson({ state, send }: Props) {
  const [field, setField] = useState<FieldId>('price');
  const [type, setType] = useState('DecimalField');
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  return (
    <Workbench
      input={
        <>
          <h4>Add a useful field</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (type !== fields[field].type) {
                setError(
                  `${fields[field].label} needs ${fields[field].type}. ${field === 'price' ? 'A price such as ₹649.50 needs decimal places.' : field === 'available' ? 'Availability is a yes-or-no value.' : 'A publication date is a calendar date.'} Choose that type and try again.`,
                );
                return;
              }
              setError('');
              send({ type: 'field', field });
            }}
          >
            <div className="guided-form-row">
              <label>
                What should a book remember?
                <select
                  value={field}
                  onChange={(e) => {
                    const next = e.target.value as FieldId;
                    setField(next);
                    setType(fields[next].type);
                    setError('');
                  }}
                >
                  <option value="price">
                    Price — an amount such as ₹649.50
                  </option>
                  <option value="available">Availability — yes or no</option>
                  <option value="published">
                    Publication date — a calendar date
                  </option>
                </select>
              </label>
              <label>
                Django field type
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>DecimalField</option>
                  <option>BooleanField</option>
                  <option>DateField</option>
                  <option>CharField</option>
                </select>
              </label>
              <button disabled={state.model.includes(field)}>
                {state.model.includes(field)
                  ? 'Field added'
                  : 'Add field to model'}
              </button>
            </div>
          </form>
          {error && <Message error>{error}</Message>}
          <p className="guided-help">
            Start with Price + DecimalField. You can also add Availability +
            BooleanField.
          </p>
        </>
      }
      execution={
        <>
          <h4>Python model · models.py</h4>
          <ModelDiagram
            selected={state.model}
            changed={state.model.filter((f) => !state.schema.includes(f))}
          />
          <p className="guided-help">
            New fields are highlighted. This changes the Python model
            definition.
          </p>
          <CodeReveal code={generatedCode(state)} />
        </>
      }
      result={
        <>
          <h4>Database table</h4>
          <ModelDiagram selected={state.schema} database />
          <p>
            The model has <strong>{state.model.length} fields</strong>; the
            database has <strong>{state.schema.length} fields</strong>, plus its
            automatic ID.
          </p>
          {state.model.includes('price') && (
            <div className="guided-check-understanding">
              <p>Does editing the Python model alone change the database?</p>
              <div className="guided-actions">
                <button
                  className="guided-secondary"
                  onClick={() => setReason('wrong')}
                >
                  Yes
                </button>
                <button
                  className="guided-secondary"
                  onClick={() => setReason('right')}
                >
                  No — a migration is needed
                </button>
              </div>
              {reason && (
                <Message error={reason === 'wrong'}>
                  {reason === 'right'
                    ? 'Correct. Continue to lesson 3 to create and apply the migration.'
                    : 'Editing the model changes its definition. A migration must apply that change to the database.'}
                </Message>
              )}
            </div>
          )}
        </>
      }
    />
  );
}

function MigrationLesson({ state, send, go }: Props) {
  if (!state.model.includes('price'))
    return <NeedPrice state={state} send={send} go={go} />;
  const pending = state.migrations.some((m) => !m.applied);
  const snapshot = state.migrations.at(-1)!.fields;
  const difference =
    snapshot.length !== state.model.length ||
    state.model.some((f) => !snapshot.includes(f));
  const busy = !!state.flow && !state.flow.done;
  const isMigration =
    state.flow && ['generate', 'apply'].includes(state.flow.operation.kind);
  return (
    <Workbench
      input={
        <div className="guided-migration-actions">
          <Panel title="1. Create a migration file">
            <p>
              Record the model changes. This does not change the database yet.
            </p>
            <code>python manage.py makemigrations</code>
            <button
              disabled={busy || !difference}
              onClick={() =>
                send({
                  type: 'start',
                  operation: { kind: 'generate' },
                  play: true,
                })
              }
            >
              {!difference
                ? 'Migration file recorded'
                : 'Create migration file'}
            </button>
          </Panel>
          <Panel title="2. Apply it to the database">
            <p>Apply the recorded changes to the stored table.</p>
            <code>python manage.py migrate</code>
            <button
              disabled={busy || !pending}
              onClick={() =>
                send({
                  type: 'start',
                  operation: { kind: 'apply' },
                  play: true,
                })
              }
            >
              {state.schema.includes('price') && !pending
                ? 'Database updated'
                : 'Update database'}
            </button>
            {!pending && !state.schema.includes('price') && (
              <small>Create the migration file first.</small>
            )}
          </Panel>
        </div>
      }
      execution={
        <>
          {isMigration ? (
            <Playback state={state} send={send} />
          ) : (
            <ExecutionPreview
              steps={[
                'Compare model',
                'Record migration',
                'Apply migration',
                'Update table',
              ]}
            >
              Create the migration file first. Then apply it to see the database
              change.
            </ExecutionPreview>
          )}
          <details className="guided-details">
            <summary>Current Python model</summary>
            <ModelDiagram selected={state.model} />
          </details>
        </>
      }
      result={
        <>
          <h4>Database structure</h4>
          <ModelDiagram selected={state.schema} database />
          {state.schema.includes('price') ? (
            <Message>
              The price column now exists. Existing books received the default
              ₹0. You will load example prices in the next lesson.
            </Message>
          ) : (
            <p>
              The database has no price column yet. It appears only when the
              migration is applied.
            </p>
          )}
          <details className="guided-details">
            <summary>See migration history and stored records</summary>
            <ul>
              {state.migrations.map((m) => (
                <li key={m.name}>
                  <code>{m.name}</code> —{' '}
                  {m.applied ? 'Applied' : 'Waiting to be applied'}
                </li>
              ))}
            </ul>
            <RecordsTable state={state} />
          </details>
        </>
      }
    />
  );
}

function QueryLesson({ state, send, go }: Props) {
  const [budget, setBudget] = useState('700');
  const [prediction, setPrediction] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  if (!state.schema.includes('price'))
    return <NeedPrice state={state} send={send} go={go} />;
  const hasPrices = state.evidence.includes('prices');
  const query = {
    field: 'price' as const,
    operator: 'lt' as const,
    value: budget,
  };
  const visible =
    checked && state.queryIds !== null && state.query.value === budget;
  const matches = visible
    ? state.books.filter((b) => state.queryIds!.includes(b.id))
    : [];
  const exact =
    visible &&
    matches.length === prediction.length &&
    matches.every((b) => prediction.includes(b.id));
  return (
    <Workbench
      input={
        <>
          <h4>1. Load the sample prices</h4>
          <p className="guided-help">
            Set the original books to ₹500, ₹750 and ₹650.
          </p>
          <button
            className="guided-secondary"
            onClick={() => {
              send({ type: 'prices' });
              setChecked(false);
              setPrediction([]);
            }}
          >
            {hasPrices ? 'Reload example prices' : 'Load example prices'}
          </button>
          <h4 className="guided-input-section">2. Set your budget</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                queryBooks(state, query);
                setError('');
                send({ type: 'perform', operation: { kind: 'query', query } });
                setChecked(true);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : 'Check the budget.',
                );
              }
            }}
          >
            <div className="guided-form-row">
              <label>
                Find books costing less than (₹)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budget}
                  required
                  onChange={(e) => {
                    setBudget(e.target.value);
                    setChecked(false);
                    setPrediction([]);
                  }}
                />
              </label>
              <button disabled={!hasPrices}>Find books</button>
            </div>
            <fieldset className="guided-prediction">
              <legend>
                Before clicking, which books do you think will match? (Optional)
              </legend>
              {state.books.map((b) => (
                <label key={b.id}>
                  <input
                    type="checkbox"
                    checked={prediction.includes(b.id)}
                    onChange={() => {
                      setPrediction((ids) =>
                        ids.includes(b.id)
                          ? ids.filter((id) => id !== b.id)
                          : [...ids, b.id],
                      );
                      setChecked(false);
                    }}
                  />
                  {b.title} — ₹{b.price?.toFixed(2)}
                </label>
              ))}
            </fieldset>
          </form>
          {!hasPrices && (
            <p className="guided-help">
              First click Load example prices above.
            </p>
          )}
          {error && <Message error>{error}</Message>}
        </>
      }
      execution={
        <>
          <h4>Compare each price</h4>
          <p className="guided-help">
            Keep a book only when its price is strictly below the budget.
          </p>
          <pre className={`guided-live-code${visible ? ' is-active' : ''}`}>
            <code>{`Book.objects.filter(\n    price__lt=${budget.trim() && Number.isFinite(Number(budget)) ? Number(budget) : 'budget'}\n)`}</code>
          </pre>
          <ul className="guided-query-steps" aria-label="Price comparisons">
            {state.books.map((b) => (
              <li
                key={b.id}
                className={
                  visible
                    ? matches.some((m) => m.id === b.id)
                      ? 'is-match'
                      : 'is-skipped'
                    : ''
                }
              >
                <strong>{b.title}</strong>
                <span>
                  ₹{b.price?.toFixed(2) ?? '0.00'}{' '}
                  {visible ? `< ₹${Number(budget).toFixed(2)}` : ''}
                </span>
                {visible && (
                  <b>{matches.some((m) => m.id === b.id) ? 'Keep' : 'Skip'}</b>
                )}
              </li>
            ))}
          </ul>
          <p className="guided-help">
            {visible
              ? 'The QuerySet contains the matches. No stored book was changed.'
              : 'Click Find books to evaluate the condition.'}
          </p>
        </>
      }
      result={
        <>
          <h4>Matching books</h4>
          {visible ? (
            <>
              <Message>
                {matches.length
                  ? `${matches.length} matching ${matches.length === 1 ? 'book' : 'books'}. The database still contains ${state.books.length} books.`
                  : `No books match: an empty QuerySet. All ${state.books.length} books remain in the database.`}
              </Message>
              <BookCards state={state} books={matches} />
              {prediction.length > 0 && (
                <Message error={!exact}>
                  {exact
                    ? 'Your prediction matches the result.'
                    : 'Compare your selected books with the result. Only prices strictly below the budget match.'}
                </Message>
              )}
              <p>
                <strong>Try it:</strong> change the budget to 600, then click
                Find books again.
              </p>
              <CodeReveal label="See the Django query" code={state.orm} />
            </>
          ) : (
            <p className="guided-empty">
              The matching books will appear here after you click Find books.
            </p>
          )}
        </>
      }
    />
  );
}

function LibraryLesson({ state, send, go }: Props) {
  const [form, setForm] = useState<'create' | 'update' | null>(null);
  const [id, setId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('825');
  const [author, setAuthor] = useState(1);
  const [method, setMethod] = useState('POST');
  const [available, setAvailable] = useState(true);
  const [remove, setRemove] = useState<number | null>(null);
  const [error, setError] = useState('');
  if (!state.schema.includes('price'))
    return <NeedPrice state={state} send={send} go={go} />;
  const busy = !!state.flow && !state.flow.done;
  const flow =
    state.flow &&
    ['create', 'read', 'update', 'delete'].includes(state.flow.operation.kind)
      ? state.flow
      : null;
  const write = flow && flow.operation.kind !== 'read';
  const shownBooks = write && !flow.done ? flow.before : state.books;
  const readBook =
    flow?.operation.kind === 'read' && flow.done
      ? state.books.find((b) => b.id === (flow.operation as { id: number }).id)
      : null;
  function edit(book?: Book) {
    setForm(book ? 'update' : 'create');
    setId(book?.id ?? null);
    setTitle(book?.title ?? '');
    setPrice(String(book?.price ?? 825));
    setAuthor(book?.author_id ?? 1);
    setAvailable(book?.available ?? true);
    setMethod('POST');
    setError('');
    setRemove(null);
  }
  function run(operation: Operation) {
    send({ type: 'start', operation, play: true });
    setForm(null);
    setRemove(null);
    setError('');
  }
  return (
    <Workbench
      input={
        <>
          <h4>Add → Read → Edit → Delete</h4>
          <p className="guided-help">
            Suggested example: Practical Django, A. Sharma, ₹825. Edit the price
            to ₹900 afterwards.
          </p>
          <div className="guided-actions">
            <button disabled={busy} onClick={() => edit()}>
              Add a book
            </button>
          </div>
          {form && (
            <form
              className="guided-book-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (method !== 'POST') {
                  setError(
                    'GET reads data. To save a change, choose POST. No book has changed.',
                  );
                  return;
                }
                const amount = Number(price);
                if (
                  !title.trim() ||
                  !price.trim() ||
                  !Number.isFinite(amount) ||
                  amount < 0 ||
                  amount > 999999.99 ||
                  Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
                ) {
                  setError(
                    'Enter a title and a price from 0 to 999999.99 with at most two decimal places.',
                  );
                  return;
                }
                const existing = state.books.find((b) => b.id === id);
                run({
                  kind: form,
                  ...(id !== null ? { id } : {}),
                  book: {
                    ...existing,
                    title: title.trim(),
                    author_id: author,
                    price: amount,
                    ...(state.schema.includes('available')
                      ? { available }
                      : {}),
                  },
                });
              }}
            >
              <h4>{form === 'create' ? 'New book' : 'Edit book'}</h4>
              <div className="guided-form-grid">
                <label>
                  Book title
                  <input
                    value={title}
                    placeholder="Practical Django"
                    maxLength={200}
                    required
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label>
                  Author
                  <select
                    value={author}
                    onChange={(e) => setAuthor(Number(e.target.value))}
                  >
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Price (₹)
                  <input
                    type="number"
                    min="0"
                    max="999999.99"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </label>
                <label>
                  Request method
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option>POST</option>
                    <option>GET</option>
                  </select>
                </label>
                {state.schema.includes('available') && (
                  <label>
                    Available
                    <select
                      value={String(available)}
                      onChange={(e) => setAvailable(e.target.value === 'true')}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                )}
              </div>
              <p className="guided-help">
                POST sends a change. GET only reads information.
              </p>
              <div className="guided-actions">
                <button>Save book</button>
                <button
                  type="button"
                  className="guided-secondary"
                  onClick={() => {
                    setForm(null);
                    setError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {error && <Message error>{error}</Message>}
          {!form && (
            <p className="guided-help">
              Add a new book here. To read, edit or delete an existing book, use
              its buttons in Result.
            </p>
          )}
        </>
      }
      result={
        <>
          <h4>Campus Library — the website</h4>
          <div className="guided-library-bar">
            <span>{shownBooks.length} books displayed</span>
          </div>
          <div className="guided-library-records">
            <BookCards
              state={state}
              books={shownBooks}
              actions={(b) => (
                <>
                  <button
                    className="guided-secondary"
                    disabled={busy}
                    onClick={() => run({ kind: 'read', id: b.id })}
                    aria-label={`Read ${b.title}`}
                  >
                    Read
                  </button>
                  <button
                    className="guided-secondary"
                    disabled={busy}
                    onClick={() => edit(b)}
                    aria-label={`Edit ${b.title}`}
                  >
                    Edit
                  </button>
                  <button
                    className="guided-secondary"
                    disabled={busy}
                    onClick={() => {
                      setRemove(b.id);
                      setForm(null);
                    }}
                    aria-label={`Delete ${b.title}`}
                  >
                    Delete
                  </button>
                </>
              )}
            />
          </div>
          {remove !== null && (
            <div
              className="guided-confirm"
              role="group"
              aria-label="Confirm book deletion"
            >
              <p>
                Delete{' '}
                <strong>
                  {state.books.find((b) => b.id === remove)?.title}
                </strong>
                ? This removes its stored row and category links.
              </p>
              <div className="guided-actions">
                <button onClick={() => run({ kind: 'delete', id: remove })}>
                  Yes, delete this book
                </button>
                <button
                  className="guided-secondary"
                  onClick={() => setRemove(null)}
                >
                  Keep this book
                </button>
              </div>
            </div>
          )}
          {readBook && (
            <div className="guided-read-detail">
              <h4>Book details</h4>
              <p>
                <strong>{readBook.title}</strong> ·{' '}
                {authors.find((a) => a.id === readBook.author_id)?.name} · ₹
                {readBook.price?.toFixed(2)} · ID {readBook.id}
              </p>
              <p>
                Reading this book did not change its values or the number of
                records.
              </p>
            </div>
          )}
        </>
      }
      execution={
        <>
          {flow ? (
            <>
              <Playback state={state} send={send} />
              {write && (
                <Message>
                  {flow.committed
                    ? `The database now has ${state.books.length} rows. ${flow.done ? 'The browser has received the updated page.' : 'The browser is still waiting for the updated page.'}`
                    : 'The request is travelling through Django. No stored row has changed yet.'}
                </Message>
              )}
              <details className="guided-details">
                <summary>Compare the database before and after</summary>
                <h4>Before this request</h4>
                <RecordsTable state={state} books={flow.before} />
                <h4>Database now</h4>
                <RecordsTable state={state} />
              </details>
              <CodeReveal
                label="See Django CRUD code"
                code={
                  '# BookForm excludes categories; links are managed separately\n# Create or update, after form.is_valid()\nbook = form.save(commit=False)\nbook.save()\n# Read one book\nbook = get_object_or_404(Book, pk=pk)\n# Delete an existing book on POST\nbook.delete()\n\n# Successful form: POST → 302 redirect → GET → 200 OK'
                }
              />
            </>
          ) : (
            <ExecutionPreview
              steps={[
                'Browser',
                'CSRF protection',
                'View / validation',
                'Database',
                'Response',
              ]}
              code={
                '# Inside a view after CSRF middleware accepts the POST\n# BookForm excludes categories; links are managed separately\nform = BookForm(request.POST)\nif form.is_valid():\n    book = form.save(commit=False)\n    book.save()\n    return redirect("book_list")\n# Invalid input: display the bound form and its errors\nreturn render(request, "catalog/book_form.html", {"form": form})'
              }
            >
              Save a book or click Read in Result. Follow the request here.
            </ExecutionPreview>
          )}
        </>
      }
    />
  );
}

function ErrorLesson({ state, send }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [message, setMessage] = useState('');
  const [hint, setHint] = useState(false);
  const scenario = state.debug.scenario;
  const expected = scenario === 'route' ? '/books/' : 'catalog/book_list.html';
  const flow =
    state.flow?.operation.kind === 'request' && state.flow.operation.debug
      ? state.flow
      : null;
  function load(next: 'route' | 'template') {
    const broken = next === 'route' ? '/book/' : 'catalog/missing.html';
    send(
      { type: 'debug', scenario: next },
      { type: 'fix', value: broken },
      {
        type: 'perform',
        operation: { kind: 'request', path: '/books/', debug: true },
      },
    );
    setLoaded(true);
    setValue(broken);
    setDiagnosis('');
    setMessage('');
    setHint(false);
  }
  return (
    <Workbench
      input={
        <>
          <h4>1. Choose a problem</h4>
          <div className="guided-actions">
            <button className="guided-secondary" onClick={() => load('route')}>
              Problem 1: page not found (404)
            </button>
            <button
              className="guided-secondary"
              onClick={() => load('template')}
            >
              Problem 2: missing template (500)
            </button>
          </div>
          <p className="guided-help">
            Complete both problems. Start with Problem 1.
          </p>
          {loaded && (
            <>
              <h4 className="guided-input-section">2. Make a repair</h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    diagnosis !==
                    (scenario === 'route' ? 'URLconf' : 'Template')
                  ) {
                    setMessage(
                      scenario === 'route'
                        ? 'The address failed before the view ran. Choose URL matching.'
                        : 'The template could not be loaded, so the lazy book query has not run. Choose Page template.',
                    );
                    return;
                  }
                  setMessage('');
                  send(
                    { type: 'fix', value },
                    {
                      type: 'perform',
                      operation: {
                        kind: 'request',
                        path: '/books/',
                        debug: true,
                      },
                    },
                  );
                }}
              >
                <div className="guided-form-grid">
                  <label>
                    Where is the mistake?
                    <select
                      value={diagnosis}
                      required
                      onChange={(e) => setDiagnosis(e.target.value)}
                    >
                      <option value="">Choose a component</option>
                      <option value="URLconf">URL matching</option>
                      <option value="View">View</option>
                      <option value="Database">Database</option>
                      <option value="Template">Page template</option>
                    </select>
                  </label>
                  <label>
                    {scenario === 'route'
                      ? 'Correct route'
                      : 'Correct template path'}
                    <input
                      value={value}
                      required
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </label>
                </div>
                <div className="guided-actions">
                  <button>Test my fix</button>
                  <button
                    type="button"
                    className="guided-secondary"
                    onClick={() => setHint(!hint)}
                  >
                    {hint ? 'Hide hint' : 'Show hint'}
                  </button>
                </div>
              </form>
              {hint && (
                <p className="guided-help">
                  Use <code>{expected}</code>, then click Test my fix.
                </p>
              )}
              {message && <Message error>{message}</Message>}
            </>
          )}
        </>
      }
      execution={
        <>
          {loaded ? (
            <>
              <div className="guided-clue">
                <strong>
                  {scenario === 'route'
                    ? 'Clue: compare the addresses.'
                    : 'Clue: check the template name.'}
                </strong>
                <p>
                  {scenario === 'route' ? (
                    <>
                      Requested: <code>/books/</code>
                      <br />
                      Initial route: <code>/book/</code>
                      <br />
                      An unmatched address never reaches the view.
                    </>
                  ) : (
                    <>
                      Initial template: <code>catalog/missing.html</code>
                      <br />
                      Available: <code>catalog/book_list.html</code>
                      <br />
                      The template was not found. The lazy book query has not
                      reached the database.
                    </>
                  )}
                </p>
              </div>
              {flow && <Playback state={state} send={send} />}
            </>
          ) : (
            <ExecutionPreview
              steps={[
                'URL matching',
                'View',
                'Page template',
                'Database',
                'Response',
              ]}
            >
              Open Problem 1 to find where the request fails.
            </ExecutionPreview>
          )}
        </>
      }
      result={
        <>
          <h4>Test result</h4>
          {!loaded && (
            <p className="guided-empty">
              A failed request explains what to repair. A successful retest
              returns the Books page.
            </p>
          )}
          {loaded && flow?.done && (
            <Message error={!!flow.error}>
              {flow.error
                ? `${flow.status} — the page still fails. Use the clue, correct the text, and test again.`
                : '200 OK — your repair worked. The Books page now loads.'}
            </Message>
          )}
          {loaded && flow?.done && !flow.error && (
            <ul className="guided-book-list">
              {flow.result.map((b) => (
                <li key={b.id}>{b.title}</li>
              ))}
            </ul>
          )}
        </>
      }
    />
  );
}

export default function GuidedSimulation() {
  const [state, setState] = useState<VisualState>(initialState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [reset, setReset] = useState(false);
  const [exportText, setExportText] = useState('');
  const [revision, setRevision] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const send: Send = (...actions) =>
    setState((previous) => actions.reduce(reduce, previous));
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setState(restore(localStorage.getItem(storageKey)));
      } catch {
        setStorageError(
          'Your browser cannot save progress. You can still complete the experiment in this tab.',
        );
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, serialize(state));
      } catch {
        setStorageError(
          'Progress could not be saved. Keep this tab open to continue your work.',
        );
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [state, ready]);
  useEffect(() => {
    if (!ready || !state.flow?.playing || state.flow.done) return;
    const timer = window.setTimeout(() => send({ type: 'advance' }), 650);
    return () => window.clearTimeout(timer);
  }, [state.flow, ready]);
  const done = completed(state);
  // The beginner relationship task asks for two categories on one book.
  done[5] =
    done[5] &&
    state.books.some(
      (book) =>
        state.memberships.filter((pair) => pair.bookId === book.id).length >= 2,
    );
  const count = done.filter(Boolean).length;
  useEffect(() => {
    if (ready && count === 7) {
      try {
        completeSection('Simulation');
      } catch {
        /* Work remains usable without storage. */
      }
    }
  }, [ready, count]);
  const busy = !!state.flow && !state.flow.done;
  function go(step: number) {
    if (busy) return;
    send({ type: 'step', step });
    setExportText('');
    window.setTimeout(() => heading.current?.focus(), 0);
  }
  const props = { state, send, go };
  const active = lessons[state.step];
  function exportNotes() {
    const text = [
      'Models and Views in Django — observations',
      `${count}/7 lessons completed`,
      '',
      ...lessons.map(
        (l, i) => `${done[i] ? 'Completed' : 'To do'}: ${l.short}`,
      ),
      '',
      ...state.observations,
      '',
      `Model fields: ${state.model.join(', ')}`,
      `Database fields: ${state.schema.join(', ')}`,
      `Stored books: ${state.books.length}`,
    ].join('\n');
    setExportText(text);
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'django-lab-observations.txt';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      /* Copyable notes remain visible. */
    }
  }
  if (!ready) return <p role="status">Opening your guided experiment…</p>;
  return (
    <div className="guided-lab">
      <div className="guided-intro">
        <h2>Simulation</h2>
        <p>Choose an input, follow the execution, then inspect the result.</p>
      </div>
      <nav className="guided-lessons" aria-label="Simulation lessons">
        {lessons.map((l, i) => (
          <button
            key={l.short}
            disabled={busy}
            aria-current={state.step === i ? 'step' : undefined}
            onClick={() => go(i)}
          >
            {l.short}
          </button>
        ))}
      </nav>
      {storageError && <Message error>{storageError}</Message>}
      {active ? (
        <>
          <header className="guided-lesson-heading">
            <h2 ref={heading} tabIndex={-1}>
              {active.title}
            </h2>
          </header>
          <div className="guided-task">
            <strong>Try it: </strong>
            <p>{active.task}</p>
          </div>
          {busy && (
            <p className="guided-help" role="status">
              An animation is in progress. Let it finish before changing
              lessons.
            </p>
          )}
          {/* A restored operation may belong to a different lesson; expose its controls rather than trapping navigation. */}
          {busy &&
            !(
              (state.step === 0 &&
                state.flow?.operation.kind === 'request' &&
                !state.flow.operation.debug) ||
              (state.step === 2 &&
                ['generate', 'apply'].includes(state.flow!.operation.kind)) ||
              (state.step === 4 &&
                ['create', 'read', 'update', 'delete'].includes(
                  state.flow!.operation.kind,
                ))
            ) && <Playback state={state} send={send} />}
          <div key={`${revision}-${state.step}`} className="guided-workspace">
            {state.step === 0 && <RequestLesson {...props} />}
            {state.step === 1 && <ModelLesson {...props} />}
            {state.step === 2 && <MigrationLesson {...props} />}
            {state.step === 3 && <QueryLesson {...props} />}
            {state.step === 4 && <LibraryLesson {...props} />}
            {state.step === 5 && <RelationshipLesson {...props} />}
            {state.step === 6 && <ErrorLesson {...props} />}
          </div>
          <aside className="guided-takeaway">
            <strong>What you learned: </strong>
            <p>{active.takeaway}</p>
          </aside>
          <div className="guided-bottom-nav">
            <button
              className="guided-secondary"
              disabled={state.step === 0 || busy}
              onClick={() => go(state.step - 1)}
            >
              Previous lesson
            </button>
            <div>
              {!done[state.step] && (
                <span>Complete the task above to continue.</span>
              )}
              <button
                disabled={!done[state.step] || busy}
                onClick={() => go(state.step + 1)}
              >
                {state.step === 6
                  ? 'Review my experiment'
                  : `Next: ${lessons[state.step + 1].short}`}
              </button>
            </div>
          </div>
        </>
      ) : (
        <Panel title="Your experiment record">
          <h2 ref={heading} tabIndex={-1}>
            {count === 7
              ? 'You completed the Django experiment.'
              : `${count} of 7 lessons completed`}
          </h2>
          <ul className="guided-summary">
            {lessons.map((l, i) => (
              <li key={l.short}>
                <span>
                  {l.short} — {done[i] ? 'Completed' : 'To do'}
                </span>
                <button className="guided-secondary" onClick={() => go(i)}>
                  {done[i] ? 'Revisit' : 'Continue lesson'}
                </button>
              </li>
            ))}
          </ul>
          <div className="guided-actions">
            <button onClick={exportNotes}>Save my observations</button>
            <a className="guided-button" href="#posttest">
              Go to Posttest
            </a>
          </div>
        </Panel>
      )}
      <div className="guided-utilities">
        <details className="guided-details guided-notebook">
          <summary>My observations ({state.observations.length})</summary>
          {state.observations.length ? (
            <ol>
              {state.observations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          ) : (
            <p>Your completed operations will be recorded here.</p>
          )}
          <button className="guided-secondary" onClick={exportNotes}>
            Save my observations
          </button>
        </details>
        {exportText && (
          <div className="guided-export">
            <label>
              Observation text — you can also copy this
              <textarea rows={9} readOnly value={exportText} />
            </label>
            <button
              className="guided-secondary"
              onClick={() => setExportText('')}
            >
              Close notes
            </button>
          </div>
        )}
        <div className="guided-reset">
          <button
            className="guided-secondary"
            disabled={busy}
            onClick={() => setReset(true)}
          >
            Start over
          </button>
        </div>
      </div>
      {reset && (
        <div
          className="guided-confirm"
          role="group"
          aria-label="Confirm experiment reset"
        >
          <p>
            Start again with the original three books? This clears model
            changes, migrations, category links and observations.
          </p>
          <div className="guided-actions">
            <button
              onClick={() => {
                send({ type: 'reset' });
                try {
                  resetExperimentState();
                } catch {
                  /* The visible lab still resets without storage. */
                }
                setRevision((value) => value + 1);
                setReset(false);
                setExportText('');
              }}
            >
              Yes, start a fresh experiment
            </button>
            <button
              className="guided-secondary"
              onClick={() => setReset(false)}
            >
              Keep my work
            </button>
          </div>
        </div>
      )}
      <p className="guided-footnote">
        This guided simulation models Django behaviour in your browser. Code
        examples are available inside each lesson.
      </p>
    </div>
  );
}
