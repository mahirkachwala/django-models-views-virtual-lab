'use client';
import type { ReactNode } from 'react';
import {
  authors,
  fields,
  type Book,
  type FieldId,
  type VisualState,
  type Action,
} from '@/lib/visual-lab';
export type ExerciseProps = {
  state: VisualState;
  dispatch: (action: Action) => void;
  mode?: 'demo' | 'practice' | 'exercise';
  speedControl?: ReactNode;
};
export function CodeReveal({
  code,
  label = 'View Django Code',
}: {
  code: string;
  label?: string;
}) {
  return (
    <details className="classic-details">
      <summary>{label}</summary>
      <pre>
        <code>{code}</code>
      </pre>
    </details>
  );
}
export function WorkArea({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <section className="classic-work">
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}
export function Output({
  children,
  title = 'Output',
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <section className="classic-output" aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}
export function Observation({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <p className={`classic-observation ${error ? 'error' : ''}`} role="status">
      {children}
    </p>
  );
}
export function ModelDiagram({
  selected,
  database = false,
  changed = [],
}: {
  selected: FieldId[];
  database?: boolean;
  changed?: FieldId[];
}) {
  const friendly: Record<FieldId, string> = {
    title: 'Text',
    author: 'Link to Author',
    price: 'Number',
    available: 'Yes / No',
    published: 'Date',
  };
  return (
    <div
      className="classic-model"
      aria-label={database ? 'Book table structure' : 'Book model diagram'}
    >
      <h4>Book</h4>
      <div>
        <b>id</b>
        <span>Primary key</span>
      </div>
      {selected.map((f) => (
        <div key={f} className={changed.includes(f) ? 'changed' : ''}>
          <b>{database ? fields[f].column : f}</b>
          <span>{friendly[f]}</span>
        </div>
      ))}
    </div>
  );
}
export function RecordsTable({
  state,
  books = state.books,
  highlight,
  actions,
}: {
  state: VisualState;
  books?: Book[];
  highlight?: number[] | null;
  actions?: (book: Book) => ReactNode;
}) {
  return (
    <div className="classic-table-scroll">
      <table className="classic-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Author</th>
            {state.schema.includes('price') && <th>Price (₹)</th>}
            {state.schema.includes('available') && <th>Available</th>}
            {state.schema.includes('published') && <th>Published</th>}
            {actions && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr
              key={b.id}
              className={
                highlight?.includes(b.id)
                  ? 'match'
                  : highlight
                    ? 'not-matched'
                    : ''
              }
            >
              <td data-label="ID">{b.id}</td>
              <td data-label="Title">{b.title}</td>
              <td data-label="Author">
                {authors.find((a) => a.id === b.author_id)?.name}
              </td>
              {state.schema.includes('price') && (
                <td data-label="Price (₹)">{b.price?.toFixed(2) ?? '—'}</td>
              )}
              {state.schema.includes('available') && (
                <td data-label="Available">{b.available ? 'Yes' : 'No'}</td>
              )}
              {state.schema.includes('published') && (
                <td data-label="Published">{b.published ?? '—'}</td>
              )}
              {actions && (
                <td data-label="Actions" className="classic-row-actions">
                  {actions(b)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!books.length && <p>No book records. Use Add Book to create one.</p>}
    </div>
  );
}
export function Arrow({
  active = false,
  label,
}: {
  active?: boolean;
  label?: string;
}) {
  return (
    <div
      className={`classic-arrow ${active ? 'moving' : ''}`}
      aria-hidden="true"
    >
      {label && <span>{label}</span>}↓
    </div>
  );
}
