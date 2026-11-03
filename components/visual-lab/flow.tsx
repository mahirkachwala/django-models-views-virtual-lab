'use client';
import { useState } from 'react';
import type { Journey, Stage } from '@/lib/visual-lab';
import { CodeReveal } from './primitives';

export const requestComponents = [
  'Browser',
  'URLconf',
  'View',
  'Model',
  'Database',
  'Template',
  'Response',
] as const;

const exampleStages: Stage[] = [
  {
    node: 'Browser',
    title: 'Send GET',
    detail: 'The browser sends an HTTP request for a URL.',
  },
  {
    node: 'URLconf',
    title: 'Match a route',
    detail:
      'Django checks URL patterns and selects a view. It does not query the database here.',
  },
  {
    node: 'View',
    title: 'Handle request',
    detail:
      'The selected Python view decides what data is needed and what response to return.',
  },
  {
    node: 'Model',
    title: 'Prepare a query',
    detail:
      'The ORM expresses a query using the Book model. A QuerySet is lazy until evaluated.',
  },
  {
    node: 'Database',
    title: 'Read records',
    detail:
      'Evaluating the query retrieves the stored records. This GET does not change them.',
  },
  {
    node: 'View',
    title: 'Build context',
    detail: 'The view supplies the retrieved books to the template as context.',
  },
  {
    node: 'Template',
    title: 'Render HTML',
    detail: 'The template combines markup and context to produce HTML.',
  },
  {
    node: 'Response',
    title: 'Return HTTP',
    detail: 'Django returns the HTML, headers, and an HTTP status code.',
  },
  {
    node: 'Browser',
    title: 'Display page',
    detail:
      'The browser displays the returned HTML. Django templates are rendered on the server.',
  },
];

export function SimpleRequestDiagram({
  flow,
  hideFuture = false,
  showCode = true,
}: {
  flow: Journey | null;
  hideFuture?: boolean;
  showCode?: boolean;
}) {
  const [inspected, setInspected] = useState<number | null>(null);
  const stages = flow?.stages ?? exampleStages;
  const active = flow?.index ?? -1;
  const inspection =
    inspected !== null &&
    inspected < stages.length &&
    (!hideFuture || inspected <= active)
      ? inspected
      : null;
  const detail = stages[inspection ?? (active < 0 ? 0 : active)];
  return (
    <>
      <div className="reference-pipeline-canvas">
        <ol
          className="classic-pipeline"
          aria-label="Django request execution stages"
        >
          {stages.map((stage, index) => {
            const hidden = hideFuture && index > active;
            const visited = flow && index < active;
            const failed = flow && index <= active && stage.error;
            return (
              <li
                className="classic-pipeline-stage"
                key={`${index}-${stage.node}`}
              >
                {index > 0 && (
                  <span
                    className={`classic-pipeline-arrow ${index === active && flow?.playing ? 'moving' : ''}`}
                    aria-hidden="true"
                  >
                    →
                  </span>
                )}
                <button
                  type="button"
                  className={`classic-stage-node ${index === active ? 'active' : ''} ${visited ? 'visited' : ''} ${failed ? 'failed' : ''}`}
                  disabled={hidden}
                  aria-current={index === active ? 'step' : undefined}
                  aria-label={
                    hidden
                      ? `Stage ${index + 1}, not reached`
                      : `Inspect stage ${index + 1}: ${stage.node}, ${stage.title}`
                  }
                  onClick={() => setInspected(index)}
                >
                  <span className="classic-stage-number">
                    {index + 1}
                    {failed ? ' ✕' : visited ? ' ✓' : ''}
                  </span>
                  <strong>{hidden ? '?' : stage.node}</strong>
                  <span>{hidden ? 'Predict to reveal' : stage.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <section
        className="reference-observations"
        aria-label="Stage observations"
      >
        <h3>Observations</h3>
        <div className="classic-flow-detail" aria-live="polite">
          <p>
            <strong>
              {inspection !== null
                ? 'Inspecting'
                : flow
                  ? 'Current stage'
                  : 'Start with'}
              : {detail.node} — {detail.title}
            </strong>
          </p>
          <p>{detail.detail}</p>
          {inspection !== null && (
            <button type="button" onClick={() => setInspected(null)}>
              Follow active step
            </button>
          )}
          {showCode && detail.code && (
            <CodeReveal label="Code at this stage" code={detail.code} />
          )}
        </div>
        <p className="classic-flow-legend">
          Green: reached · Amber: current · Blue: waiting · Red: failure. The
          view appears again when it prepares the template context.
        </p>
      </section>
    </>
  );
}

export function RequestDetails({ flow }: { flow: Journey | null }) {
  return (
    <details className="classic-details">
      <summary>Execution trace and observations</summary>
      {flow ? (
        <>
          <ol className="classic-detail-flow">
            {flow.stages.slice(0, flow.index + 1).map((stage, i) => (
              <li key={i} className={flow.index === i ? 'active' : ''}>
                <b>{stage.node}</b> — {stage.title}: {stage.detail}
              </li>
            ))}
          </ol>
          <p>
            {flow.method} {flow.path} ·{' '}
            {flow.done ? `HTTP ${flow.status}` : 'Response pending'}
          </p>
          {flow.path === '/books/create/' && (
            <p>
              This form is empty: its GET request needs no book query. Not every
              view must use a model or a database.
            </p>
          )}
          {flow.done && flow.error === 'Book does not exist' && (
            <p>
              The URL matched a view, but no object matched the requested
              primary key. This is a different 404 cause from a missing URL
              pattern.
            </p>
          )}
        </>
      ) : (
        <p>
          Send a request to collect the execution trace. Click each stage to
          inspect its responsibility.
        </p>
      )}
    </details>
  );
}
