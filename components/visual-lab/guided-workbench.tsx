import type { ReactNode } from 'react';

/** The same left-to-right reading order is used by every exercise. */
export function Workbench({
  input,
  execution,
  result,
}: {
  input: ReactNode;
  execution: ReactNode;
  result: ReactNode;
}) {
  return (
    <div className="guided-bench">
      {(
        [
          ['Input', input],
          ['Execution', execution],
          ['Result', result],
        ] as [string, ReactNode][]
      ).map(([title, content]) => (
        <section
          key={title}
          className="guided-column"
          aria-label={`${title} panel`}
        >
          <h3 className="guided-column-title">{title}</h3>
          <div className="guided-column-body">{content}</div>
        </section>
      ))}
    </div>
  );
}

export function ExecutionPreview({
  steps,
  children,
  code,
}: {
  steps: string[];
  children: ReactNode;
  code?: string;
}) {
  return (
    <div className="guided-execution-preview">
      <p className="guided-panel-caption">Follow the highlighted step</p>
      <ol className="guided-flow-path" aria-label="Execution path">
        {steps.map((step, i) => (
          <li key={`${step}-${i}`}>
            <span>{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <p className="guided-empty">{children}</p>
      {code && (
        <details className="guided-details">
          <summary>View Django code</summary>
          <pre className="guided-live-code">
            <code>{code}</code>
          </pre>
        </details>
      )}
    </div>
  );
}
