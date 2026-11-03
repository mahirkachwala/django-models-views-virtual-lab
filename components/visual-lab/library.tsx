'use client';
import { useState } from 'react';
import { authors, type Book, type Operation } from '@/lib/visual-lab';
import {
  CodeReveal,
  Observation,
  Output,
  RecordsTable,
  WorkArea,
  type ExerciseProps,
} from './primitives';

export function LibraryLab({
  state,
  dispatch,
  mode = 'practice',
}: ExerciseProps) {
  const [screen, setScreen] = useState<'list' | 'form' | 'detail' | 'delete'>(
    'list',
  );
  const [editing, setEditing] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [author, setAuthor] = useState(1);
  const [available, setAvailable] = useState(true);
  const [method, setMethod] = useState(mode === 'exercise' ? '' : 'POST');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const selected = state.books.find((b) => b.id === state.selectedBook);
  const canWrite = state.schema.includes('price');
  const flow =
    state.flow &&
    ['create', 'read', 'update', 'delete'].includes(state.flow.operation.kind)
      ? state.flow
      : null;
  const busy = !!state.flow && !state.flow.done;
  const currentStage = flow?.stages[flow.index];
  const mutation =
    flow && ['create', 'update', 'delete'].includes(flow.operation.kind);
  const displayedBooks = mutation && !flow.done ? flow.before : state.books;
  const operationName = flow
    ? flow.operation.kind[0].toUpperCase() + flow.operation.kind.slice(1)
    : '';
  const address =
    screen === 'form'
      ? editing === null
        ? '/books/create/'
        : `/books/${editing}/edit/`
      : screen === 'delete' && selected
        ? `/books/${selected.id}/delete/`
        : screen === 'detail' && selected
          ? `/books/${selected.id}/`
          : '/books/';
  function form(book?: Book) {
    setEditing(book?.id ?? null);
    setTitle(book?.title ?? '');
    setPrice(book?.price?.toString() ?? '');
    setAuthor(book?.author_id ?? 1);
    setAvailable(book?.available ?? true);
    setMethod(mode === 'exercise' ? '' : 'POST');
    setMessage('');
    setScreen('form');
  }
  function run(operation: Operation) {
    if (busy) return;
    setError(false);
    setMessage('');
    dispatch({ type: 'start', operation, play: mode === 'demo' });
  }
  function checkMethod() {
    if (method !== 'POST') {
      setError(true);
      setMessage(
        method === 'GET'
          ? 'GET should retrieve information without changing records. This form changes data, so choose POST. No database row has changed.'
          : 'Choose the request method before submitting the form.',
      );
      return false;
    }
    return true;
  }
  const methodControl = (
    <label>
      Submit using
      <select
        aria-label="Form request method"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        disabled={busy}
      >
        <option value="">Choose HTTP method</option>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
      </select>
    </label>
  );

  return (
    <>
      <WorkArea title="Operate the library and inspect the evidence">
        <p>
          {mode === 'exercise'
            ? 'Challenge: create a book, read its details, change its price, then delete that book. Choose the correct HTTP method for each form and locate the stage where the database changes.'
            : 'Use this miniature library website. Advance each request and observe exactly when a row is created, read, updated or deleted.'}
        </p>
        <div className="inquiry-checklist" aria-label="CRUD observations">
          {(['created', 'read', 'updated', 'deleted'] as const).map(
            (item, index) => (
              <span
                key={item}
                className={state.evidence.includes(item) ? 'complete' : ''}
              >
                {state.evidence.includes(item) ? '✓' : index + 1}{' '}
                {['Create', 'Read', 'Update', 'Delete'][index]}
              </span>
            ),
          )}
        </div>
        {!canWrite && (
          <p>
            To add or edit books, first add Price to the model and apply its
            migration.{' '}
            <button
              disabled={busy}
              onClick={() =>
                dispatch({
                  type: 'step',
                  step: state.model.includes('price') ? 2 : 1,
                })
              }
            >
              {state.model.includes('price')
                ? 'Open Migration Exercise'
                : 'Open Model Exercise'}
            </button>
          </p>
        )}
        {busy && !flow && (
          <p>
            Finish the active operation first.{' '}
            <button
              onClick={() =>
                dispatch({
                  type: 'step',
                  step:
                    state.flow &&
                    ['generate', 'apply'].includes(state.flow.operation.kind)
                      ? 2
                      : state.flow?.operation.kind === 'query'
                        ? 3
                        : 0,
                })
              }
            >
              Return to active operation
            </button>
          </p>
        )}
      </WorkArea>

      <section
        className="inquiry-browser"
        aria-label="Miniature library website"
      >
        <div className="inquiry-browser-bar">
          <span aria-hidden="true">● ● ●</span>
          <code>{address}</code>
          <span>Library preview</span>
        </div>
        <div className="inquiry-library-header">
          <div>
            <h3>Campus Library</h3>
            <p>{displayedBooks.length} books in the shared catalogue</p>
          </div>
          <button disabled={!canWrite || busy} onClick={() => form()}>
            + Add Book
          </button>
        </div>
        {flow && !flow.done && (
          <p className="inquiry-hint" role="status">
            Waiting for response. The browser will update when Django returns
            the completed page.
          </p>
        )}
        {screen === 'form' && (
          <form
            className="classic-book-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !title.trim() ||
                !price.trim() ||
                !Number.isFinite(Number(price)) ||
                Number(price) < 0 ||
                Number(price) > 999999.99
              ) {
                setMessage(
                  'Enter a title and a price between ₹0 and ₹999999.99. No record was changed.',
                );
                setError(true);
                return;
              }
              if (!checkMethod()) return;
              if (
                editing !== null &&
                !state.books.some((b) => b.id === editing)
              ) {
                setMessage(
                  'This book no longer exists. Return to the catalogue and select an existing record.',
                );
                setError(true);
                return;
              }
              run({
                kind: editing !== null ? 'update' : 'create',
                ...(editing !== null ? { id: editing } : {}),
                book: {
                  title: title.trim(),
                  author_id: author,
                  price: Number(price),
                  ...(state.schema.includes('available') ? { available } : {}),
                  ...(editing !== null && state.schema.includes('published')
                    ? {
                        published:
                          state.books.find((b) => b.id === editing)
                            ?.published ?? null,
                      }
                    : {}),
                },
              });
              setScreen('list');
            }}
          >
            <h3>{editing !== null ? 'Edit Book' : 'Add Book'}</h3>
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                disabled={busy}
              />
            </label>
            <label>
              Author
              <select
                value={author}
                onChange={(e) => setAuthor(Number(e.target.value))}
                disabled={busy}
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
                disabled={busy}
              />
            </label>
            {state.schema.includes('available') && (
              <label>
                Available
                <select
                  value={String(available)}
                  onChange={(e) => setAvailable(e.target.value === 'true')}
                  disabled={busy}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
            )}
            {methodControl}
            <div>
              <button type="submit" disabled={busy}>
                Save
              </button>{' '}
              <button
                type="button"
                disabled={busy}
                onClick={() => setScreen('list')}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {screen === 'delete' && selected && (
          <section
            className="classic-confirm"
            aria-label="Confirm book deletion"
          >
            <h4>Confirm deletion</h4>
            <p>
              Delete “{selected.title}” (Book {selected.id}) and its category
              links from this exercise?
            </p>
            {methodControl}
            <div className="inquiry-controls">
              <button
                disabled={busy}
                onClick={() => {
                  if (!checkMethod()) return;
                  run({ kind: 'delete', id: selected.id });
                  setScreen('list');
                }}
              >
                Confirm Delete
              </button>
              <button disabled={busy} onClick={() => setScreen('list')}>
                Keep Book
              </button>
            </div>
          </section>
        )}
        {screen === 'detail' && selected && flow?.done && (
          <section
            className="classic-results"
            aria-label="Selected book details"
          >
            <h4>{selected.title}</h4>
            <p>
              Author: {authors.find((a) => a.id === selected.author_id)?.name}
            </p>
            {selected.price !== undefined && (
              <p>Price: ₹{selected.price.toFixed(2)}</p>
            )}
            <p>
              Book ID: {selected.id} · GET retrieves this record without
              modifying it.
            </p>
            <button disabled={busy} onClick={() => setScreen('list')}>
              Close Details
            </button>
          </section>
        )}
        {message && <Observation error={error}>{message}</Observation>}
        {(screen === 'list' || screen === 'detail') && (
          <div className="inquiry-bookshelf">
            {displayedBooks.map((b) => (
              <article
                key={b.id}
                className={state.selectedBook === b.id ? 'selected' : ''}
              >
                <div className="inquiry-book-cover" aria-hidden="true">
                  <span>BOOK</span>
                  <strong>{b.id.toString().padStart(2, '0')}</strong>
                </div>
                <div className="inquiry-book-info">
                  <h4>{b.title}</h4>
                  <p>{authors.find((a) => a.id === b.author_id)?.name}</p>
                  <p>
                    {b.price !== undefined
                      ? `₹${b.price.toFixed(2)}`
                      : 'Price field not migrated'}
                    {state.schema.includes('available')
                      ? ` · ${b.available ? 'Available' : 'On loan'}`
                      : ''}
                  </p>
                  <div className="inquiry-controls">
                    <button
                      aria-label={`View ${b.title}`}
                      disabled={busy}
                      onClick={() => {
                        run({ kind: 'read', id: b.id });
                        setScreen('detail');
                      }}
                    >
                      View
                    </button>
                    <button
                      aria-label={`Edit ${b.title}`}
                      disabled={!canWrite || busy}
                      onClick={() => form(b)}
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${b.title}`}
                      disabled={busy}
                      onClick={() => {
                        dispatch({ type: 'selectBook', id: b.id });
                        setMethod(mode === 'exercise' ? '' : 'POST');
                        setScreen('delete');
                        setMessage('');
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!displayedBooks.length && (
              <p>The catalogue is empty. Add a book to create a new record.</p>
            )}
          </div>
        )}
      </section>

      <Output
        title={
          flow
            ? `${operationName}: request → database → response`
            : 'Database observer'
        }
      >
        {flow ? (
          <>
            <div className="inquiry-execution">
              <div className="inquiry-controls">
                <strong>
                  {flow.method} {flow.path}
                </strong>
                <span className="inquiry-status">
                  {flow.done
                    ? 'Request complete'
                    : `Stage ${flow.index + 1} of ${flow.stages.length}`}
                </span>
                <span>
                  {mutation
                    ? flow.committed
                      ? 'Database write committed'
                      : 'No database write yet'
                    : 'Read only'}
                </span>
              </div>
              <ol className="inquiry-stage-strip">
                {flow.stages
                  .map((stage, index) => ({ stage, index }))
                  .filter(
                    ({ index }) =>
                      index >= Math.max(0, flow.index - 1) &&
                      index <= flow.index + 2,
                  )
                  .map(({ stage, index }) => (
                    <li
                      key={index}
                      className={
                        index === flow.index
                          ? 'current'
                          : index < flow.index
                            ? 'complete'
                            : ''
                      }
                    >
                      <span>{index + 1}</span>
                      {stage.node}
                      <small>{stage.title}</small>
                    </li>
                  ))}
              </ol>
              <p aria-live="polite">
                <strong>{currentStage?.title}.</strong> {currentStage?.detail}
              </p>
              {!flow.done && (
                <div className="inquiry-controls">
                  <button
                    onClick={() =>
                      dispatch({ type: flow.playing ? 'pause' : 'resume' })
                    }
                  >
                    {flow.playing ? 'Pause' : 'Auto play'}
                  </button>
                  <button
                    onClick={() => {
                      dispatch({ type: 'pause' });
                      dispatch({ type: 'advance' });
                    }}
                  >
                    Next stage →
                  </button>
                </div>
              )}
              {flow.done && (
                <Observation>
                  {mutation
                    ? `${operationName} completed: POST → 302 redirect → GET /books/ → 200 OK. The database changed at the first Database stage. Compare the row evidence below.`
                    : 'GET returned 200 OK and a book detail page. Compare the tables: reading an object changes neither its values nor the row count.'}
                </Observation>
              )}
              {currentStage?.code && (
                <CodeReveal
                  label="Explain this Django stage"
                  code={currentStage.code}
                />
              )}
            </div>
            <div className="classic-before-after">
              <section>
                <h4>Before request · {flow.before.length} rows</h4>
                <RecordsTable state={state} books={flow.before} />
              </section>
              <section>
                <h4>Current database · {state.books.length} rows</h4>
                <RecordsTable
                  state={state}
                  highlight={
                    flow.committed && state.selectedBook
                      ? [state.selectedBook]
                      : null
                  }
                />
              </section>
            </div>
          </>
        ) : (
          <RecordsTable state={state} />
        )}
        <CodeReveal
          label="Show Django Processing"
          code={
            'Create: Book.objects.create(...)\nRead: get_object_or_404(Book, pk=...)\nUpdate: book.save()\nDelete: book.delete()\n\nA valid form POST changes the database, then redirects (302).\nThe browser follows with GET /books/ and receives 200 OK.'
          }
        />
      </Output>
    </>
  );
}
