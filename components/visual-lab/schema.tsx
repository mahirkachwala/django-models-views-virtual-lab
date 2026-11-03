'use client';
import { useState } from 'react';
import { fields, generatedCode, type FieldId } from '@/lib/visual-lab';
import {
  CodeReveal,
  ModelDiagram,
  Observation,
  Output,
  RecordsTable,
  WorkArea,
  type ExerciseProps,
} from './primitives';

const requirements = [
  {
    field: 'price',
    title: 'Sell a book',
    detail: 'Store ₹649.50 exactly, with two decimal places.',
    reason:
      'DecimalField represents fixed decimal amounts. CharField would store text, and BooleanField represents only true or false.',
  },
  {
    field: 'available',
    title: 'Track availability',
    detail: 'Record whether a book can currently be borrowed.',
    reason:
      'BooleanField represents a yes/no value. It does not store a price, date, or free text.',
  },
  {
    field: 'published',
    title: 'Record publication',
    detail: 'Store the publication date, allowing an unknown date.',
    reason:
      'DateField represents a calendar date. Here null=True and blank=True permit an unknown date.',
  },
] as const;

export function ModelLab({
  state,
  dispatch,
  mode = 'practice',
}: ExerciseProps) {
  const [requirement, setRequirement] = useState<(typeof requirements)[number]>(
    requirements[0],
  );
  const [name, setName] = useState('price');
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [remove, setRemove] = useState<FieldId | null>(null);
  const [prediction, setPrediction] = useState('');
  const busy = !!state.flow && !state.flow.done;
  const additions = state.model.filter((f) => !state.schema.includes(f));
  const removals = state.schema.filter((f) => !state.model.includes(f));
  function add() {
    const field = name.trim().toLowerCase() as FieldId;
    setError(true);
    if (!Object.hasOwn(fields, field)) {
      setMessage(
        'Use a field from this Book experiment: title, author, price, available or published.',
      );
      return;
    }
    if (fields[field].type !== type) {
      const explanation = requirements.find((r) => r.field === field)?.reason;
      setMessage(
        `${type || 'No field type'} does not match ${field}. ${explanation ?? `${fields[field].label} uses ${fields[field].type}.`} The model has not changed; choose another type.`,
      );
      return;
    }
    if (state.model.includes(field)) {
      setMessage(
        `${field} is already in the model. Compare it with the database, or try another requirement.`,
      );
      return;
    }
    dispatch({ type: 'field', field });
    setError(false);
    setMessage(
      `${field} added as ${type}. Look at the highlighted model field: the database still has ${state.schema.length + 1} columns, including its primary key.`,
    );
  }
  function removeField(field: FieldId) {
    dispatch({ type: 'removeField', field });
    setRemove(null);
    setError(false);
    setMessage(
      `${field} removed from the model. Its existing database column and values remain until you create and apply a migration.`,
    );
  }
  return (
    <>
      <WorkArea title="Design a model from a requirement">
        <p>
          {mode === 'exercise'
            ? 'Challenge: ensure the model supports book prices and availability. Select appropriate Django field types, then identify how model changes reach the database.'
            : 'Choose something the library needs to remember. Decide which Django field can represent that value.'}
        </p>
        <div className="inquiry-choices" aria-label="Book requirements">
          {requirements.map((r) => (
            <button
              key={r.field}
              className={requirement.field === r.field ? 'selected' : ''}
              aria-pressed={requirement.field === r.field}
              disabled={busy}
              onClick={() => {
                setRequirement(r);
                setName(r.field);
                setType('');
                setMessage('');
              }}
            >
              <strong>
                {r.title}
                {state.model.includes(r.field) ? ' ✓' : ''}
              </strong>
              <span>{r.detail}</span>
            </button>
          ))}
        </div>
        {mode === 'demo' && (
          <p className="inquiry-hint">
            For this requirement, try <code>{requirement.field}</code> with{' '}
            <code>{fields[requirement.field].type}</code>. Observe which diagram
            changes.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <div className="inquiry-controls">
            <label>
              Field Name
              <input
                aria-label="Field Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                required
                disabled={busy}
              />
            </label>
            <label>
              Field Type
              <select
                aria-label="Field Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                disabled={busy}
              >
                <option value="">Choose a Django type</option>
                {Object.values(fields).map((f) => (
                  <option key={f.type}>{f.type}</option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={busy}>
              + Add Field
            </button>
          </div>
        </form>
        {busy && <p>Finish the active operation before editing the model.</p>}
        {message && <Observation error={error}>{message}</Observation>}
      </WorkArea>
      <Output title="Model definition and database are separate">
        <div className="inquiry-compare">
          <section>
            <h4>Python model · models.py</h4>
            <ModelDiagram selected={state.model} changed={additions} />
            <p>
              {additions.length
                ? `${additions.join(', ')} added to the definition.`
                : 'No added fields waiting for migration.'}
            </p>
          </section>
          <section>
            <h4>Current database · catalog_book</h4>
            <ModelDiagram selected={state.schema} database />
            <p>
              {removals.length
                ? `${removals.join(', ')} still stored until migration.`
                : `${state.books.length} existing records; ${state.schema.length + 1} columns including id.`}
            </p>
          </section>
        </div>
        <div className="inquiry-prediction">
          <strong>
            Check your reasoning: does adding a field here immediately change
            the database?
          </strong>
          <div className="inquiry-controls">
            <button
              aria-pressed={prediction === 'yes'}
              onClick={() => setPrediction('yes')}
            >
              Yes, both change
            </button>
            <button
              aria-pressed={prediction === 'no'}
              onClick={() => setPrediction('no')}
            >
              No, only the model changes
            </button>
          </div>
          {prediction && (
            <Observation error={prediction === 'yes'}>
              {prediction === 'no'
                ? 'Correct. The Python definition describes the intended structure. A migration must be created and applied to change the database.'
                : 'Compare the two diagrams. Editing models.py changes the definition; the database keeps its existing columns until migrate applies a recorded change.'}
            </Observation>
          )}
        </div>
        <details className="classic-details">
          <summary>Inspect or remove model fields</summary>
          <table className="classic-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Django type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {state.model.map((f) => (
                <tr key={f}>
                  <td>{f}</td>
                  <td>{fields[f].type}</td>
                  <td>
                    {['title', 'author'].includes(f) ? (
                      'Required by this library'
                    ) : (
                      <button
                        disabled={busy}
                        aria-label={`Remove ${f}`}
                        onClick={() =>
                          state.schema.includes(f)
                            ? setRemove(f)
                            : removeField(f)
                        }
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        {remove && (
          <div className="classic-confirm">
            <p>
              Remove {remove} from the model? Applying its next migration will
              also remove the stored values.
            </p>
            <button disabled={busy} onClick={() => removeField(remove)}>
              Remove field
            </button>{' '}
            <button onClick={() => setRemove(null)}>Cancel removal</button>
          </div>
        )}
        <CodeReveal code={generatedCode(state)} />
        {(additions.length > 0 || removals.length > 0) && (
          <button onClick={() => dispatch({ type: 'step', step: 2 })}>
            Test this change in Database Migration →
          </button>
        )}
      </Output>
    </>
  );
}

export function MigrationLab({
  state,
  dispatch,
  mode = 'practice',
}: ExerciseProps) {
  const [before, setBefore] = useState(state.schema);
  const [beforeBooks, setBeforeBooks] = useState(state.books);
  const [prediction, setPrediction] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const last = state.migrations.at(-1)!;
  const pending = state.migrations.some((m) => !m.applied);
  const changed =
    state.model.some((f) => !last.fields.includes(f)) ||
    last.fields.some((f) => !state.model.includes(f));
  const additions = state.model.filter((f) => !state.schema.includes(f));
  const removals = state.schema.filter((f) => !state.model.includes(f));
  const flow =
    state.flow && ['generate', 'apply'].includes(state.flow.operation.kind)
      ? state.flow
      : null;
  const previousSchema = flow?.schemaBefore ?? before;
  const previousBooks = flow?.before ?? beforeBooks;
  const busy = !!state.flow && !state.flow.done;
  const active = flow && !flow.done;
  const previous = state.migrations.at(-2)?.fields ?? [];
  const snapshotAdditions = last.fields.filter((f) => !previous.includes(f));
  const snapshotRemovals = previous.filter((f) => !last.fields.includes(f));
  function run(kind: 'generate' | 'apply') {
    if (busy) return;
    setError(false);
    if (kind === 'generate' && !changed) {
      setError(true);
      setMessage(
        pending
          ? 'The current model is already recorded in a migration. Creating another file would not apply it. Which command actually updates the database?'
          : 'No model changes to record. Add a field in the Model activity, then return.',
      );
      return;
    }
    if (kind === 'apply' && !pending) {
      setError(true);
      setMessage(
        changed
          ? 'There is no pending migration to apply. migrate reads migration files; it does not create one from models.py. Record your change first.'
          : 'All recorded migrations are already applied. The database remains unchanged.',
      );
      return;
    }
    if (kind === 'generate' && mode === 'exercise' && !prediction) {
      setError(true);
      setMessage(
        'Make a prediction about makemigrations before you test it. Either answer can be tested.',
      );
      return;
    }
    setBefore([...state.schema]);
    setBeforeBooks(structuredClone(state.books));
    setMessage('');
    dispatch({ type: 'start', operation: { kind }, play: mode === 'demo' });
  }
  return (
    <>
      <WorkArea title="Which operation makes the database match your model?">
        <p>
          {mode === 'demo'
            ? 'First create a migration to record the model difference. Then apply it and watch the database gain the recorded columns.'
            : 'Compare the two structures, predict the effect of creating a migration, and choose the next operation. Watch the database at every stage.'}
        </p>
        <div className="inquiry-prediction">
          <label>
            After makemigrations finishes, where will a newly added field exist?
            <select
              aria-label="Migration prediction"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              disabled={busy}
            >
              <option value="">Make a prediction</option>
              <option value="file">
                In the model and migration file; not yet in the database
              </option>
              <option value="database">
                In the model, migration file and database
              </option>
            </select>
          </label>
        </div>
        <div className="inquiry-controls">
          <button disabled={busy} onClick={() => run('generate')}>
            Create Migration
          </button>
          <button disabled={busy} onClick={() => run('apply')}>
            Apply Migration
          </button>
          <button
            disabled={busy}
            onClick={() => dispatch({ type: 'step', step: 1 })}
          >
            Edit Model
          </button>
        </div>
        {message && <Observation error={error}>{message}</Observation>}
        {busy && !active && (
          <p>
            Finish the active request before changing the database.{' '}
            <button
              onClick={() =>
                dispatch({
                  type: 'step',
                  step: ['create', 'update', 'delete', 'read'].includes(
                    state.flow!.operation.kind,
                  )
                    ? 4
                    : 0,
                })
              }
            >
              Return to active operation
            </button>
          </p>
        )}
      </WorkArea>
      <Output title="Observe the structure, then the records">
        <div className="inquiry-compare">
          <section>
            <h4>Current model</h4>
            <ModelDiagram selected={state.model} changed={additions} />
            {removals.length > 0 && (
              <p>Removed from model: {removals.join(', ')}</p>
            )}
          </section>
          <section>
            <h4>Current database</h4>
            <ModelDiagram
              selected={state.schema}
              database
              changed={state.schema.filter((f) => !previousSchema.includes(f))}
            />
            <p>
              {additions.length || removals.length
                ? 'A model/database difference remains.'
                : 'Model and database currently agree.'}
            </p>
          </section>
        </div>
        <section className="inquiry-snapshot" aria-label="Migration snapshot">
          <h4>
            Recorded snapshot · {last.name}{' '}
            <span className="inquiry-status">
              {last.applied ? 'Applied' : 'Pending'}
            </span>
          </h4>
          <p>
            {state.migrations.length === 1
              ? 'The initial migration contains title and author. Your next migration will record a difference from this snapshot.'
              : `${snapshotAdditions.length ? `Add: ${snapshotAdditions.join(', ')}. ` : ''}${snapshotRemovals.length ? `Remove: ${snapshotRemovals.join(', ')}. ` : ''}Recorded fields: ${last.fields.join(', ')}.`}
          </p>
          {changed && pending && (
            <p>
              The model has changed again since this snapshot. Applying it uses
              its recorded fields; create another migration to record the newer
              change.
            </p>
          )}
        </section>
        {flow && (
          <section
            className="inquiry-execution"
            aria-label="Migration execution"
          >
            <ol className="inquiry-stage-strip">
              {flow.stages.map((stage, index) => (
                <li
                  key={`${stage.node}-${index}`}
                  className={
                    index === flow.index
                      ? 'current'
                      : index < flow.index
                        ? 'complete'
                        : ''
                  }
                >
                  <span>{index + 1}</span>
                  {stage.title}
                </li>
              ))}
            </ol>
            <p aria-live="polite">{flow.stages[flow.index]?.detail}</p>
            {active && (
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
              <Observation
                error={
                  flow.operation.kind === 'generate' &&
                  prediction === 'database'
                }
              >
                {flow.operation.kind === 'generate'
                  ? `${prediction === 'file' ? 'Your prediction was correct. ' : prediction === 'database' ? 'Your prediction needs revising. ' : ''}The migration file was created. The database columns and existing records did not change. Choose the operation that applies the snapshot.`
                  : 'The recorded migrations were applied. New price values receive the default ₹0; availability receives Yes. Business prices are entered separately.'}
              </Observation>
            )}
          </section>
        )}
        <details className="classic-details">
          <summary>Compare records before and after this operation</summary>
          <div className="classic-before-after">
            <section>
              <h4>Before operation</h4>
              <RecordsTable
                state={{ ...state, schema: previousSchema }}
                books={previousBooks}
              />
            </section>
            <section>
              <h4>Current database</h4>
              <RecordsTable state={state} />
            </section>
          </div>
        </details>
        <details className="classic-details">
          <summary>Migration history</summary>
          <ol>
            {state.migrations.map((m) => (
              <li key={m.name}>
                <code>{m.name}</code> · {m.applied ? 'Applied' : 'Pending'} ·{' '}
                {m.fields.join(', ')}
              </li>
            ))}
          </ol>
        </details>
        <CodeReveal
          label="View Migration Commands"
          code={'python manage.py makemigrations\npython manage.py migrate'}
        />
      </Output>
    </>
  );
}
