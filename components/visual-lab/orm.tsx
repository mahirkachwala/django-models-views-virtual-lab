'use client';
import { useState } from 'react';
import { authors, queryBooks, type Book, type Query } from '@/lib/visual-lab';
import {
  Observation,
  Output,
  WorkArea,
  type ExerciseProps,
} from './primitives';

function rowReason(book: Book, query: Query, matches: boolean) {
  if (query.field === 'all')
    return 'all() includes every Book row; there is no filter.';
  if (query.field === 'price') {
    const operator =
      query.operator === 'lt' ? '<' : query.operator === 'gt' ? '>' : '=';
    return `₹${book.price?.toFixed(2)} ${operator} ₹${Number(query.value).toFixed(2)} is ${matches ? 'true' : 'false'}.`;
  }
  if (query.field === 'available')
    return `available=${book.available ? 'True' : 'False'} ${matches ? 'equals' : 'does not equal'} ${query.value === 'true' ? 'True' : 'False'}.`;
  if (query.operator === 'contains')
    return `“${book.title}” ${matches ? 'contains' : 'does not contain'} “${query.value}” (case-insensitive).`;
  return `“${book.title}” ${matches ? 'equals' : 'does not equal'} “${query.value}” exactly.`;
}

export function ORMLab({ state, dispatch, mode = 'practice' }: ExerciseProps) {
  const [query, setQuery] = useState<Query>(
    state.query.field === 'all' || state.schema.includes(state.query.field)
      ? state.query
      : { field: 'title', operator: 'contains', value: 'Django' },
  );
  const [prediction, setPrediction] = useState<number[]>([]);
  const [emptyPrediction, setEmptyPrediction] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [run, setRun] = useState<{
    key: string;
    count: number;
    checked: boolean;
  } | null>(null);
  const fingerprint = JSON.stringify([query, state.schema, state.books]);
  const activeRun = run?.key === fingerprint ? run : null;
  let evaluation: ReturnType<typeof queryBooks> | null = null;
  let queryError = '';
  try {
    evaluation = queryBooks(state, query);
  } catch (error) {
    queryError = error instanceof Error ? error.message : 'Check the query.';
  }
  const matches = evaluation?.result.map((book) => book.id) ?? [];
  const count = activeRun?.count ?? 0;
  const finished = activeRun !== null && count >= state.books.length;
  const revealedIds = state.books
    .slice(0, count)
    .filter((b) => matches.includes(b.id))
    .map((b) => b.id);
  const selected = prediction.filter((id) =>
    state.books.some((b) => b.id === id),
  );
  const correct =
    selected.length === matches.length &&
    selected.every((id) => matches.includes(id));
  const checked = activeRun?.checked === true;

  function changeQuery(next: Query) {
    setQuery(next);
    setPrediction([]);
    setEmptyPrediction(false);
    setReason('');
    setRun(null);
    setMessage('');
  }
  function evaluate(all: boolean) {
    if (queryError) {
      setMessage(queryError);
      return;
    }
    if (mode !== 'demo' && !selected.length && !emptyPrediction) {
      setMessage(
        'Select the rows you predict will match, or choose “No rows will match”.',
      );
      return;
    }
    if (mode === 'exercise' && !reason) {
      setMessage(
        'Choose what you think happens to the source table before checking your prediction.',
      );
      return;
    }
    const nextCount = all
      ? state.books.length
      : Math.min(count + 1, state.books.length);
    setRun({ key: fingerprint, count: nextCount, checked: mode !== 'demo' });
    setMessage('');
    if (nextCount === state.books.length)
      dispatch({ type: 'perform', operation: { kind: 'query', query } });
  }
  function toggle(id: number) {
    setPrediction(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
    setEmptyPrediction(false);
    setRun(null);
    setMessage('');
  }

  return (
    <>
      <WorkArea title="Build a query and predict its result">
        <p>
          {mode === 'demo'
            ? 'Change a condition, then evaluate one row at a time. Follow how a QuerySet is selected from the source table.'
            : 'Study the source records. Predict which rows satisfy your condition, then compare your prediction with the query result.'}
        </p>
        <form
          className="classic-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            evaluate(true);
          }}
        >
          <label>
            Choose field
            <select
              value={query.field}
              onChange={(event) => {
                const field = event.target.value as Query['field'];
                changeQuery({
                  field,
                  operator:
                    field === 'price'
                      ? 'lt'
                      : field === 'title'
                        ? 'contains'
                        : 'exact',
                  value:
                    field === 'price'
                      ? '700'
                      : field === 'title'
                        ? 'Django'
                        : 'true',
                });
              }}
            >
              <option value="price">Price</option>
              <option value="title">Title</option>
              <option value="available">Availability</option>
              <option value="all">All books</option>
            </select>
          </label>
          {query.field !== 'all' && (
            <>
              <label>
                Condition
                <select
                  value={query.operator}
                  onChange={(event) =>
                    changeQuery({
                      ...query,
                      operator: event.target.value as Query['operator'],
                    })
                  }
                >
                  <option value="exact">Equal to</option>
                  {query.field === 'price' && (
                    <>
                      <option value="lt">Less than</option>
                      <option value="gt">Greater than</option>
                    </>
                  )}
                  {query.field === 'title' && (
                    <option value="contains">Contains (ignore case)</option>
                  )}
                </select>
              </label>
              <label>
                Value
                {query.field === 'available' ? (
                  <select
                    value={query.value}
                    onChange={(event) =>
                      changeQuery({ ...query, value: event.target.value })
                    }
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    required
                    aria-label="Query value"
                    value={query.value}
                    onChange={(event) =>
                      changeQuery({ ...query, value: event.target.value })
                    }
                    maxLength={80}
                    inputMode={query.field === 'price' ? 'decimal' : 'text'}
                  />
                )}
              </label>
            </>
          )}
        </form>
        <div
          className="inquiry-query-code"
          aria-label="Current query translation"
        >
          {evaluation ? (
            <>
              <p>
                <strong>Django ORM</strong>
              </p>
              <pre>
                <code>{evaluation.orm}</code>
              </pre>
              <p>
                <strong>Conceptual SQL</strong>
              </p>
              <pre>
                <code>{evaluation.sql}</code>
              </pre>
              <small>
                The query describes a selection. In Django, filter() and all()
                return lazy QuerySets; fetching rows happens when the QuerySet
                is evaluated. Actual SQL and case handling depend on the
                database backend.
              </small>
            </>
          ) : (
            <Observation error>{queryError}</Observation>
          )}
        </div>
        {query.field === 'price' && !state.schema.includes('price') && (
          <p>
            Add Price in the model and apply its migration first.{' '}
            <button onClick={() => dispatch({ type: 'step', step: 2 })}>
              Open Migrations
            </button>{' '}
            <button
              onClick={() =>
                changeQuery({
                  field: 'title',
                  operator: 'contains',
                  value: 'Django',
                })
              }
            >
              Try a title query now
            </button>
          </p>
        )}
        {state.schema.includes('price') && (
          <p>
            <button
              onClick={() => {
                dispatch({ type: 'prices' });
                setRun(null);
                setPrediction([]);
                setEmptyPrediction(false);
                setMessage(
                  'Example prices loaded for original books 1–3. Any custom books are preserved. Make a fresh prediction.',
                );
              }}
            >
              Load example prices
            </button>{' '}
            Assign ₹500, ₹750 and ₹650 to existing books 1, 2 and 3.
          </p>
        )}
        {mode !== 'demo' && (
          <div className="inquiry-prediction">
            <p>
              <strong>Your prediction:</strong> select every row that should be
              returned.
            </p>
            <label>
              <input
                type="checkbox"
                checked={emptyPrediction}
                onChange={(event) => {
                  setEmptyPrediction(event.target.checked);
                  setPrediction([]);
                  setRun(null);
                }}
              />{' '}
              No rows will match (empty QuerySet)
            </label>
          </div>
        )}
        <div className="classic-table-scroll">
          <table className="classic-table inquiry-table">
            <caption>
              Source table: catalog_book ({state.books.length} records)
            </caption>
            <thead>
              <tr>
                {mode !== 'demo' && <th scope="col">Predict</th>}
                <th scope="col">ID</th>
                <th scope="col">Title</th>
                <th scope="col">Author</th>
                {state.schema.includes('price') && (
                  <th scope="col">Price (₹)</th>
                )}
                {state.schema.includes('available') && (
                  <th scope="col">Available</th>
                )}
                <th scope="col">Evaluation</th>
              </tr>
            </thead>
            <tbody>
              {state.books.map((book, index) => (
                <tr
                  key={book.id}
                  className={
                    index < count
                      ? matches.includes(book.id)
                        ? 'match'
                        : 'not-matched'
                      : selected.includes(book.id)
                        ? 'inquiry-selected-row'
                        : ''
                  }
                >
                  {mode !== 'demo' && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Predict book ${book.id}: ${book.title}`}
                        checked={selected.includes(book.id)}
                        onChange={() => toggle(book.id)}
                      />
                    </td>
                  )}
                  <td>{book.id}</td>
                  <td>{book.title}</td>
                  <td>{authors.find((a) => a.id === book.author_id)?.name}</td>
                  {state.schema.includes('price') && (
                    <td>{book.price?.toFixed(2) ?? '—'}</td>
                  )}
                  {state.schema.includes('available') && (
                    <td>{book.available ? 'Yes' : 'No'}</td>
                  )}
                  <td>
                    {index < count ? (
                      <>
                        <strong>
                          {matches.includes(book.id) ? 'Keep' : 'Skip'}
                        </strong>{' '}
                        — {rowReason(book, query, matches.includes(book.id))}
                        {checked && (
                          <span className="inquiry-row-verdict">
                            {' '}
                            {selected.includes(book.id) ===
                            matches.includes(book.id)
                              ? '✓ Predicted correctly'
                              : matches.includes(book.id)
                                ? '✗ You missed this row'
                                : '✗ You included an extra row'}
                          </span>
                        )}
                      </>
                    ) : (
                      'Not evaluated'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!state.books.length && (
          <p>
            The source table is empty, so this query returns an empty QuerySet.
            Add records in CRUD Operations to explore non-empty results.
          </p>
        )}
        {mode === 'exercise' && (
          <fieldset className="inquiry-prediction">
            <legend>What happens to records that do not match?</legend>
            {[
              [
                'remain',
                'They remain in the source table but are absent from this result.',
              ],
              ['deleted', 'They are deleted from the source table.'],
              ['changed', 'Django changes their values so that they match.'],
            ].map(([value, text]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="orm-source-prediction"
                  value={value}
                  checked={reason === value}
                  onChange={() => {
                    setReason(value);
                    setRun(null);
                  }}
                />
                {text}
              </label>
            ))}
          </fieldset>
        )}
        <div className="classic-actions inquiry-actions">
          <button
            onClick={() => evaluate(false)}
            disabled={finished || Boolean(queryError)}
          >
            Evaluate next row
          </button>
          <button onClick={() => evaluate(true)} disabled={Boolean(queryError)}>
            {mode === 'demo' ? 'Evaluate all rows' : 'Check prediction'}
          </button>
          <button
            onClick={() => {
              setRun(null);
              setPrediction([]);
              setEmptyPrediction(false);
              setReason('');
              setMessage(
                'Prediction cleared. The query and database are unchanged.',
              );
            }}
          >
            Try again
          </button>
        </div>
        {message && <Observation>{message}</Observation>}
      </WorkArea>
      <Output title="QuerySet result">
        <div className="inquiry-scan" role="status">
          {activeRun
            ? `${count} / ${state.books.length} rows evaluated · ${revealedIds.length} matched so far`
            : 'Build a condition, inspect the records, and start evaluating.'}
        </div>
        {activeRun && (
          <>
            <pre>
              <code>{`<QuerySet [${state.books
                .filter((book) => revealedIds.includes(book.id))
                .map(
                  (book) =>
                    `Book(id=${book.id}, title=${JSON.stringify(book.title)})`,
                )
                .join(', ')}]>`}</code>
            </pre>
            {!finished && (
              <p>
                This is a partial result. Evaluate the remaining rows before
                drawing a conclusion.
              </p>
            )}
            {finished && (
              <>
                <Observation
                  error={
                    checked &&
                    (!correct || (mode === 'exercise' && reason !== 'remain'))
                  }
                >
                  {mode === 'demo'
                    ? `Evaluation complete. ${matches.length} of ${state.books.length} rows satisfy the condition.`
                    : correct
                      ? `Your row prediction is correct: ${matches.length} matching ${matches.length === 1 ? 'book' : 'books'}.`
                      : `Compare the row explanations: you missed ${matches.filter((id) => !selected.includes(id)).length} matching rows and selected ${selected.filter((id) => !matches.includes(id)).length} extra rows.`}
                  {mode === 'exercise' &&
                    (reason === 'remain'
                      ? ' Your explanation is also correct: filtering leaves all source records unchanged.'
                      : ' Reconsider the source table: SELECT reads records; it does not update or delete any rows.')}
                </Observation>
                {!matches.length && (
                  <p>
                    An empty QuerySet is a valid result, not a missing-table
                    error. filter() does not raise DoesNotExist when no rows
                    match; get() does.
                  </p>
                )}
                <p>
                  <strong>Observe:</strong> the source table still contains{' '}
                  {state.books.length} records. Only the selection changed. Try
                  changing just the boundary (for example, price &lt; 650 versus
                  price = 650) and predict again.
                </p>
              </>
            )}
          </>
        )}
      </Output>
    </>
  );
}
