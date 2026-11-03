'use client';
import { useState } from 'react';
import {
  CodeReveal,
  Observation,
  Output,
  WorkArea,
  type ExerciseProps,
} from './primitives';
import {
  SimpleRequestDiagram,
  RequestDetails,
  requestComponents,
} from './flow';

export function RequestLab({
  state,
  dispatch,
  mode = 'practice',
  speedControl,
}: ExerciseProps) {
  const [path, setPath] = useState('/books/');
  const [feedback, setFeedback] = useState('');
  const [wrong, setWrong] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [correct, setCorrect] = useState(0);
  const flow =
    state.flow?.operation.kind === 'request' && !state.flow.operation.debug
      ? state.flow
      : null;
  const busy = !!flow?.playing;
  const exercise = mode === 'exercise';
  function send(requestPath = path) {
    setFeedback('');
    setMistakes(0);
    setCorrect(0);
    dispatch({
      type: 'start',
      operation: { kind: 'request', path: requestPath.trim() },
      play: mode === 'demo',
    });
  }
  function predict(component: string) {
    if (!flow || flow.done) return;
    const next = flow.stages[flow.index + 1];
    if (component !== next.node) {
      setMistakes((n) => n + 1);
      setWrong(true);
      setFeedback(
        `${component} does not run next. Reconsider what the current stage must hand off. The request has not advanced.`,
      );
      return;
    }
    setWrong(false);
    setCorrect((n) => n + 1);
    setFeedback(`Correct — ${next.node}: ${next.title}.`);
    dispatch({ type: 'advance' });
  }
  return (
    <div className="reference-request">
      <section
        className="reference-request-inputs"
        aria-label="Configure request"
      >
        <p className="reference-task-prompt">
          {exercise
            ? 'At every step, choose the component that runs next. A wrong choice leaves the request in place.'
            : mode === 'demo'
              ? 'Send a request and watch each component take its turn. Pause to inspect the data and code.'
              : 'Send a request, then advance one step at a time. Compare a list page, a detail page, an empty form, and two kinds of 404.'}
        </p>
        <form
          className="classic-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label>
            Request URL
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              maxLength={180}
              required
              disabled={busy}
            />
          </label>
          <button type="submit" disabled={busy}>
            Send Request
          </button>
        </form>
        <div
          className="classic-preset-buttons"
          aria-label="Example request URLs"
        >
          {[
            ['/books/', 'All books'],
            ['/books/2/', 'Book 2'],
            ['/books/create/', 'Empty form'],
            ['/books/999/', 'Missing book'],
            ['/unknown/', 'Unknown route'],
          ].map(([url, label]) => (
            <button
              key={url}
              type="button"
              disabled={busy}
              onClick={() => {
                setPath(url);
                send(url);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <section
        className="reference-request-workspace"
        aria-label="Request and Response"
      >
        <SimpleRequestDiagram flow={flow} hideFuture={exercise} />
        {exercise && flow && !flow.done && (
          <fieldset className="classic-prediction">
            <legend>Which component runs next?</legend>
            <div className="classic-preset-buttons">
              {requestComponents.map((component) => (
                <button
                  type="button"
                  key={component}
                  onClick={() => predict(component)}
                >
                  {component}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {feedback && <Observation error={wrong}>{feedback}</Observation>}
        {exercise && flow && (
          <p>
            {correct} correct transitions · {mistakes}{' '}
            {mistakes === 1 ? 'retry' : 'retries'}
            {flow.done
              ? ' · Request complete. Replay another URL to compare its path.'
              : ''}
          </p>
        )}
        <div
          className="classic-transport reference-playback"
          aria-label="Request playback controls"
        >
          {speedControl}
          <div className="reference-playback-buttons">
            {!flow && (
              <button
                type="button"
                className="reference-playback-button"
                onClick={() => send()}
              >
                <span className="reference-playback-icon" aria-hidden="true">
                  ▶
                </span>
                Start
              </button>
            )}
            {flow && (
              <>
                <button
                  type="button"
                  className="reference-playback-button"
                  onClick={() => {
                    setPath(flow.path);
                    send(flow.path);
                  }}
                >
                  <span className="reference-playback-icon" aria-hidden="true">
                    ↺
                  </span>
                  Replay Request
                </button>
                {!exercise && (
                  <>
                    <button
                      type="button"
                      className="reference-playback-button"
                      disabled={flow.done}
                      onClick={() =>
                        dispatch({ type: busy ? 'pause' : 'resume' })
                      }
                    >
                      <span
                        className="reference-playback-icon"
                        aria-hidden="true"
                      >
                        {busy ? 'Ⅱ' : '▶'}
                      </span>
                      {busy ? 'Pause' : 'Play'}
                    </button>
                    <button
                      type="button"
                      className="reference-playback-button"
                      disabled={busy || flow.done}
                      onClick={() => dispatch({ type: 'advance' })}
                    >
                      <span
                        className="reference-playback-icon"
                        aria-hidden="true"
                      >
                        ▶│
                      </span>
                      Next Step
                    </button>
                  </>
                )}
                <span className="reference-playback-status" role="status">
                  {flow.done
                    ? `Finished · HTTP ${flow.status}`
                    : `Step ${flow.index + 1} of ${flow.stages.length} · ${busy ? 'Playing' : 'Paused'}`}
                </span>
              </>
            )}
          </div>
        </div>
        {flow?.done && (
          <details className="classic-details reference-response-preview">
            <summary>Returned browser page · HTTP {flow.status}</summary>
            <div className="classic-browser-result">
              <div className="classic-browser-address">GET {flow.path}</div>
              {flow.error ? (
                <>
                  <h4>{flow.status} — Page could not load</h4>
                  <p>
                    {flow.error === 'Book does not exist'
                      ? 'The URL matched, but no book has that ID. The view returns HTTP 404.'
                      : 'The URL did not match a configured pattern. No view or database query ran.'}
                  </p>
                </>
              ) : flow.path === '/books/create/' ? (
                <>
                  <h4>Add a book</h4>
                  <p>
                    The empty form is ready. Use CRUD Operations to add a
                    record.
                  </p>
                  <p>200 OK · No book query was needed.</p>
                </>
              ) : (
                <>
                  <h4>{flow.path === '/books/' ? 'Books' : 'Book details'}</h4>
                  <ul>
                    {flow.result.map((b) => (
                      <li key={b.id}>{b.title}</li>
                    ))}
                  </ul>
                  <p>
                    200 OK · {flow.result.length}{' '}
                    {flow.result.length === 1 ? 'book' : 'books'} displayed
                  </p>
                </>
              )}
            </div>
          </details>
        )}
        <RequestDetails flow={flow} />
      </section>
    </div>
  );
}

export function ErrorLab({
  state,
  dispatch,
  mode = 'practice',
}: ExerciseProps) {
  const [choice, setChoice] = useState<'route' | 'template'>(
    state.debug.scenario,
  );
  const [loaded, setLoaded] = useState(false);
  const [repair, setRepair] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosed, setDiagnosed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [wrong, setWrong] = useState(false);
  const [hints, setHints] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const scenario = state.debug.scenario;
  const exercise = mode === 'exercise';
  const expected = scenario === 'route' ? '/books/' : 'catalog/book_list.html';
  const incorrect = scenario === 'route' ? '/book/' : 'catalog/missing.html';
  const flow =
    state.flow?.operation.kind === 'request' && state.flow.operation.debug
      ? state.flow
      : null;
  const fixed = !!flow?.done && !flow.error && attempted;
  const hintText =
    scenario === 'route'
      ? [
          'Look at the last successful action: the request was sent, but no view was selected.',
          'Compare every character in the requested URL with the registered pattern.',
          'Enter a route with a leading and trailing slash. It must match the plural resource in GET /books/.',
        ]
      : [
          'The URL matched and records were retrieved. Investigate what happens after context is built.',
          'Compare the filename passed to render() with the files available inside templates/.',
          'The loader expects a path relative to templates/, including the catalogue folder and the list-page filename.',
        ];
  function load() {
    dispatch({ type: 'debug', scenario: choice });
    dispatch({
      type: 'fix',
      value: choice === 'route' ? '/book/' : 'catalog/missing.html',
    });
    dispatch({
      type: 'perform',
      operation: { kind: 'request', path: '/books/', debug: true },
    });
    setRepair(choice === 'route' ? '/book/' : 'catalog/missing.html');
    setLoaded(true);
    setAttempted(false);
    setDiagnosed(false);
    setDiagnosis('');
    setFeedback('');
    setHints(0);
    setAttempts(0);
  }
  function checkDiagnosis() {
    const success =
      diagnosis === (scenario === 'route' ? 'URLconf' : 'Template');
    setDiagnosed(success);
    setWrong(!success);
    setFeedback(
      success
        ? `Correct. The fault is in ${diagnosis}. Now change the configuration and test the request again.`
        : 'That component is not where this trace fails. Find the first operation that could not complete.',
    );
  }
  return (
    <div className="reference-request reference-debug">
      <WorkArea>
        <p className="reference-task-prompt">
          Inspect the failed request, identify the responsible component, change
          one configuration value, and rerun the same request.
        </p>
        <form
          className="classic-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <label>
            Select Error
            <select
              value={choice}
              onChange={(e) =>
                setChoice(e.target.value as 'route' | 'template')
              }
            >
              <option value="route">Case A: books page returns 404</option>
              <option value="template">Case B: books page returns 500</option>
            </select>
          </label>
          <button type="submit">Load Problem</button>
        </form>
        {loaded && (
          <>
            <p>
              <strong>Observed request:</strong> <code>GET /books/</code>
            </p>
            <details
              className="classic-debug-evidence classic-details"
              open={exercise && !diagnosed}
            >
              <summary>Evidence from the failing request</summary>
              <ol className="classic-trace-list">
                <li>The browser sent GET /books/.</li>
                {scenario === 'route' ? (
                  <>
                    <li>
                      Registered URL pattern:{' '}
                      <code>{'path("book/", views.book_list)'}</code>.
                    </li>
                    <li>No view was called; no database query was issued.</li>
                    <li>
                      Result: <strong>404 Not Found</strong>.
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      The URL selected <code>book_list(request)</code>.
                    </li>
                    <li>
                      The query returned {state.books.length} book records and
                      the view built its context.
                    </li>
                    <li>
                      The renderer requested <code>catalog/missing.html</code>.
                    </li>
                    <li>
                      Available files:{' '}
                      <code>templates/catalog/book_list.html</code> and{' '}
                      <code>templates/catalog/book_detail.html</code>.
                    </li>
                    <li>
                      Result: <strong>500 · TemplateDoesNotExist</strong>.
                    </li>
                  </>
                )}
              </ol>
            </details>
            {!diagnosed && (
              <form
                className="classic-inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  checkDiagnosis();
                }}
              >
                <label>
                  Where does this request fail?
                  <select
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    required
                  >
                    <option value="">Choose a component</option>
                    {requestComponents
                      .filter((n) => !['Browser', 'Response'].includes(n))
                      .map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                  </select>
                </label>
                <button type="submit">Check Diagnosis</button>
              </form>
            )}
            {feedback && <Observation error={wrong}>{feedback}</Observation>}
            {!fixed && (
              <>
                <button
                  type="button"
                  disabled={hints >= hintText.length}
                  onClick={() =>
                    setHints((n) => Math.min(n + 1, hintText.length))
                  }
                >
                  Hint {Math.min(hints + 1, hintText.length)} of{' '}
                  {hintText.length}
                </button>
                {hintText.slice(0, hints).map((hint, i) => (
                  <p key={hint}>
                    <strong>Hint {i + 1}:</strong> {hint}
                  </p>
                ))}
              </>
            )}
            {(!exercise || diagnosed) && (
              <>
                <p>
                  <strong>
                    Current {scenario === 'route' ? 'route' : 'template name'}:
                  </strong>{' '}
                  <code>{state.debug[scenario]}</code>
                </p>
                {mode === 'demo' && (
                  <p>
                    The repair is <code>{expected}</code>. Apply it and compare
                    the trace.
                  </p>
                )}
                <form
                  className="classic-inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    dispatch({ type: 'fix', value: repair });
                    dispatch({
                      type: 'perform',
                      operation: {
                        kind: 'request',
                        path: '/books/',
                        debug: true,
                      },
                    });
                    setAttempted(true);
                    setAttempts((n) => n + 1);
                  }}
                >
                  <label>
                    {scenario === 'route'
                      ? 'Route (include leading /)'
                      : 'Template path (relative to templates/)'}
                    <input
                      value={repair}
                      onChange={(e) => setRepair(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </label>
                  <button type="submit">Apply and Test Repair</button>
                </form>
              </>
            )}
            {exercise && !diagnosed && (
              <p>
                Identify the failing component to unlock the configuration
                editor.
              </p>
            )}
          </>
        )}
      </WorkArea>
      <Output title="Before and After">
        {loaded ? (
          <>
            <p>
              <strong>Before:</strong> <code>{incorrect}</code> →{' '}
              {scenario === 'route'
                ? '404 Not Found'
                : '500 TemplateDoesNotExist'}
              .
            </p>
            {attempted && (
              <>
                <Observation error={!fixed}>
                  {fixed
                    ? `200 OK — the Books page now loads. Verified in ${attempts} repair ${attempts === 1 ? 'attempt' : 'attempts'}.`
                    : 'The same request still fails. Revisit the trace and compare the new configuration with the evidence above.'}
                </Observation>
                {fixed && (
                  <div className="classic-browser-result">
                    <div className="classic-browser-address">
                      GET /books/ · 200 OK
                    </div>
                    <h4>Books</h4>
                    <ul>
                      {flow?.result.map((book) => (
                        <li key={book.id}>{book.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {(!exercise || diagnosed) && (
              <>
                <SimpleRequestDiagram
                  flow={flow}
                  showCode={!exercise || fixed}
                />
                <RequestDetails flow={flow} />
              </>
            )}
            {fixed && (
              <CodeReveal
                code={
                  scenario === 'route'
                    ? 'urlpatterns = [path("books/", views.book_list)]'
                    : 'return render(request, "catalog/book_list.html", {"books": books})'
                }
              />
            )}
            {exercise && !diagnosed && (
              <p>
                Use the execution evidence above to locate the failure. The
                annotated diagram unlocks after a correct diagnosis.
              </p>
            )}
          </>
        ) : (
          <p className="classic-empty">
            Select a case and load the problem to collect the evidence.
          </p>
        )}
      </Output>
    </div>
  );
}
