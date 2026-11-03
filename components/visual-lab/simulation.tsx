'use client';
import { useEffect, useRef, useState } from 'react';
import {
  initialState,
  reduce,
  restore,
  serialize,
  storageKey,
  type Action,
  type VisualState,
} from '@/lib/visual-lab';
import { resetExperimentState } from '@/lib/lab-progress';
import { RequestLab, ErrorLab } from './request';
import { ModelLab, MigrationLab } from './schema';
import { ORMLab } from './orm';
import { LibraryLab } from './library';
import { RelationshipsLab } from './relationships';
const exercises = [
  {
    title: 'Request and Response',
    problem:
      'A student opens the library website. Trace how Django turns their URL into a page, then investigate what changes for a missing book or an empty form.',
    objectives: [
      'Understand how a URL selects a view.',
      'Observe the page returned by the view.',
    ],
  },
  {
    title: 'Creating a Django Model',
    problem:
      'Design a Book model for a college library. Choose fields that represent money and availability, and discover whether a model edit changes stored data.',
    objectives: [
      'Identify model fields and their Django types.',
      'Represent a book using a model.',
    ],
  },
  {
    title: 'Database Migration',
    problem:
      'The librarian added a field, but the database has not changed. Decide which command records the change and which command actually applies it.',
    objectives: [
      'Distinguish a model change from a database change.',
      'Use a migration to update the database structure.',
    ],
  },
  {
    title: 'Querying Records',
    problem:
      'A student has a ₹700 budget. Build a filter, predict the matching records, and test your reasoning against every row in the library.',
    objectives: [
      'Retrieve records using a condition.',
      'Connect the results to a Django ORM query.',
    ],
  },
  {
    title: 'CRUD Operations',
    problem:
      'Manage the library collection. Follow each change from the website to the stored record, and determine which requests read data and which write it.',
    objectives: [
      'Use Create, Read, Update and Delete operations.',
      'Observe how each operation changes the records.',
    ],
  },
  {
    title: 'Model Relationships',
    problem:
      'Connect authors, books and categories. Use the actual records to choose cardinalities and see how Django stores each connection.',
    objectives: [
      'Construct one-to-many and many-to-many relationships.',
      'Explore records connected by a relationship.',
    ],
  },
  {
    title: 'Error Handling',
    problem:
      'The Books page has stopped working. Inspect the failed request, identify the responsible component, make a repair, and verify the response.',
    objectives: [
      'Recognize a broken URL and a missing template.',
      'Correct the name and verify that the page loads.',
    ],
  },
];
const modeDescriptions = {
  demo: 'Observe a worked example. Follow the highlighted changes and pause to inspect a stage.',
  practice:
    'Make the decisions yourself, one step at a time. Feedback explains what your action changes.',
  exercise:
    'Predict, build or diagnose before revealing the outcome. Use the evidence to explain your answer.',
};
const reflectionQuestions = [
  'Why does /books/create/ avoid a database read, while /books/999/ reaches the database before failing?',
  'Why is DecimalField appropriate for a price? Why has adding the field not changed the stored rows?',
  'What happens if you edit the model again after creating a migration but before applying it?',
  'Which records change when a filter is evaluated? How is an empty QuerySet different from an error?',
  'At which stage is a change saved? Why does a successful form submission redirect to a GET request?',
  'Why does a ForeignKey need one author_id column, while many-to-many membership needs pairs of IDs?',
  'How can two failed pages have different causes? Which earlier stages succeeded in each case?',
];
export default function VisualSimulation() {
  const top = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<VisualState | null>(null);
  const [chosen, setChosen] = useState(0);
  const [reset, setReset] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [mode, setMode] = useState<'demo' | 'practice' | 'exercise'>('demo');
  const [delay, setDelay] = useState(1000);
  const [revision, setRevision] = useState(0);
  const [exportText, setExportText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = restore(localStorage.getItem(storageKey));
        setState(saved);
        setChosen(Math.min(saved.step, 6));
      } catch {
        setState(initialState());
        setStorageError(
          'Your browser cannot save this work. Keep the page open to retain it.',
        );
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(storageKey, serialize(state));
    } catch {
      /* The action handler reports unavailable storage. */
    }
  }, [state]);
  useEffect(() => {
    if (!state?.flow?.playing || state.flow.done) return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const timer = setTimeout(
      () => setState((s) => (s ? reduce(s, { type: 'advance' }) : s)),
      reduced ? Math.max(700, delay) : delay,
    );
    return () => clearTimeout(timer);
  }, [state, delay]);
  function dispatch(action: Action) {
    setState((s) => (s ? reduce(s, action) : s));
    if (action.type === 'step') {
      setChosen(Math.min(action.step, 6));
      top.current?.scrollIntoView({ block: 'start' });
    }
    try {
      localStorage.setItem('vlab-storage-probe', '1');
      localStorage.removeItem('vlab-storage-probe');
    } catch {
      setStorageError(
        'Your browser cannot save this work. Keep the page open to retain it.',
      );
    }
  }
  if (!state) return <p role="status">Loading simulation…</p>;
  const exercise = exercises[state.step];
  const operationOwner =
    state.flow?.operation.kind === 'request'
      ? state.flow.operation.debug
        ? 6
        : 0
      : state.flow && ['generate', 'apply'].includes(state.flow.operation.kind)
        ? 2
        : state.flow?.operation.kind === 'query'
          ? 3
          : 4;
  const speedControl =
    mode === 'demo' && [0, 2, 4].includes(state.step) ? (
      <label className="reference-speed">
        <span>Min. Speed</span>
        <input
          aria-label="Playback speed"
          aria-valuetext={`${delay} milliseconds per step`}
          type="range"
          min={200}
          max={1600}
          step={50}
          value={2000 - delay}
          onChange={(e) => setDelay(2000 - Number(e.target.value))}
        />
        <span>Max. Speed</span>
      </label>
    ) : null;
  const exerciseProps = { state, dispatch, mode, speedControl };
  function downloadObservations() {
    if (!state) return;
    const text = [
      'Django Models and Views — experiment observations',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Observed operations (recorded when performed):',
      ...(state.observations.length
        ? state.observations.map((line, i) => `${i + 1}. ${line}`)
        : ['No operations recorded yet.']),
      '',
      `Current model fields: ${state.model.join(', ')}`,
      `Current database fields: ${state.schema.join(', ')}`,
      `Current records: ${state.books.length}`,
      '',
      'Reflection prompts:',
      ...reflectionQuestions.map((line, i) => `${i + 1}. ${line}`),
      '',
      'This is a visual teaching simulation. It does not execute Python or SQL.',
    ].join('\n');
    setExportText(text);
    const url = URL.createObjectURL(
      new Blob([text], { type: 'text/plain;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'django-lab-observations.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="classic-lab reference-lab" ref={top}>
      {exercise && (
        <details className="reference-instructions" key={state.step}>
          <summary>
            Instructions <span aria-hidden="true">▾</span>
          </summary>
          <div>
            <h2>{exercise.title}</h2>
            <p>{exercise.problem}</p>
            <ol>
              <li>
                Choose an activity below and select <strong>Submit</strong>.
              </li>
              <li>
                Use <strong>Demo</strong> to explore, <strong>Practice</strong>{' '}
                for guided decisions, or <strong>Exercise</strong> to check your
                understanding.
              </li>
              <li>{modeDescriptions[mode]}</li>
              <li>
                Inspect the diagram and observations after each action. Your
                library records are shared across activities.
              </li>
            </ol>
            <strong>Learning objectives</strong>
            <ul>
              {exercise.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        </details>
      )}
      <div className="reference-activity-toolbar">
        <form
          className="classic-selector"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'step', step: chosen });
          }}
        >
          <label htmlFor="exercise-select">Activity</label>
          <div>
            <select
              id="exercise-select"
              aria-label="Select an exercise from the list below"
              value={chosen}
              onChange={(e) => setChosen(Number(e.target.value))}
            >
              {exercises.map((ex, i) => (
                <option value={i} key={ex.title}>
                  {i + 1}. {ex.title}
                </option>
              ))}
            </select>
            <button type="submit">Submit</button>
          </div>
        </form>
        {exercise && (
          <div className="inquiry-mode-bar">
            <div
              className="inquiry-mode-buttons"
              role="group"
              aria-label="Learning mode"
            >
              {(['demo', 'practice', 'exercise'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={mode === item}
                  onClick={() => {
                    dispatch({ type: 'pause' });
                    setMode(item);
                  }}
                >
                  {item === 'demo'
                    ? 'Demo'
                    : item === 'practice'
                      ? 'Practice'
                      : 'Exercise'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {exercise ? (
        <>
          <h2 className="reference-activity-title">
            {exercise.title}{' '}
            <span>
              ·{' '}
              {mode === 'demo'
                ? 'Demo'
                : mode === 'practice'
                  ? 'Practice'
                  : 'Exercise'}
            </span>
          </h2>
          {state.flow && !state.flow.done && state.step !== operationOwner && (
            <p className="classic-resume">
              An operation is paused in {exercises[operationOwner].title}.
              Finish it before starting another activity.{' '}
              <button
                onClick={() => dispatch({ type: 'step', step: operationOwner })}
              >
                Return to paused operation
              </button>
            </p>
          )}
          <div
            className={`reference-exercise-canvas reference-activity-${state.step}`}
            key={`${state.step}-${mode}-${revision}`}
          >
            {state.step === 0 && <RequestLab {...exerciseProps} />}
            {state.step === 1 && <ModelLab {...exerciseProps} />}
            {state.step === 2 && <MigrationLab {...exerciseProps} />}
            {state.step === 3 && <ORMLab {...exerciseProps} />}
            {state.step === 4 && <LibraryLab {...exerciseProps} />}
            {state.step === 5 && <RelationshipsLab {...exerciseProps} />}
            {state.step === 6 && <ErrorLab {...exerciseProps} />}
          </div>
          {state.step !== 0 && speedControl}
          <details className="inquiry-reflection">
            <summary>Discuss your observation</summary>
            <p>{reflectionQuestions[state.step]}</p>
            <p>
              Use a result from your experiment to support your explanation.
            </p>
          </details>
        </>
      ) : (
        <section className="classic-output classic-finish">
          <h2>End of Experiment</h2>
          <p>
            You have reached the end of the Models and Views simulation. Review
            these key observations, repeat an exercise, or continue to the
            Posttest.
          </p>
          {state.observations.length ? (
            <ol>
              {state.observations.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          ) : (
            <p>
              No operations recorded yet. Select an exercise and run an
              experiment to collect observations.
            </p>
          )}
          <button onClick={downloadObservations}>Download observations</button>{' '}
          <button onClick={() => setReset(true)}>Repeat Experiment</button>{' '}
          <a className="classic-button" href="#posttest">
            Go to Posttest
          </a>
        </section>
      )}
      <nav className="classic-navigation" aria-label="Exercise navigation">
        <button
          disabled={state.step === 0}
          onClick={() => dispatch({ type: 'step', step: state.step - 1 })}
        >
          Previous
        </button>
        <button
          disabled={state.step === 7}
          onClick={() => dispatch({ type: 'step', step: state.step + 1 })}
        >
          {state.step === 6 ? 'Finish' : 'Next'}
        </button>
      </nav>
      {exercise && (
        <details className="inquiry-notebook">
          <summary>Observation notebook ({state.observations.length})</summary>
          {state.observations.length ? (
            <ol>
              {state.observations.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          ) : (
            <p>Your observed operations will appear here as you experiment.</p>
          )}
          <button onClick={downloadObservations}>Download observations</button>
        </details>
      )}
      {exportText && (
        <section className="inquiry-export" aria-label="Observation export">
          <p role="status">
            Your observations are ready. If this browser blocks the download,
            select and copy the same text below.
          </p>
          <label>
            Exported observations
            <textarea readOnly rows={8} value={exportText} />
          </label>
          <button onClick={() => setExportText('')}>Close export</button>
        </section>
      )}
      <button
        className="classic-reset"
        onClick={() => {
          dispatch({ type: 'pause' });
          setReset(true);
        }}
      >
        Reset Experiment
      </button>
      {reset && (
        <section className="classic-confirm" aria-label="Confirm reset">
          <p>
            Reset all exercise records, fields and relationships? Quiz answers
            are kept.
          </p>
          <button
            onClick={() => {
              dispatch({ type: 'reset' });
              setChosen(0);
              setRevision((v) => v + 1);
              setExportText('');
              resetExperimentState();
              setReset(false);
            }}
          >
            Reset all exercises
          </button>{' '}
          <button onClick={() => setReset(false)}>Cancel</button>
        </section>
      )}
      {storageError && <p role="alert">{storageError}</p>}
    </div>
  );
}
