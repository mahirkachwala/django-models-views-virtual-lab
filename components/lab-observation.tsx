'use client';

import { useEffect, useState } from 'react';
import {
  completeSection,
  emptyProgress,
  readProgress,
  resetProgress,
  type LabProgress,
  type ObservationId,
} from '@/lib/lab-progress';

const rows: { id: ObservationId; label: string; principle: string }[] = [
  {
    id: 'model',
    label: 'Model Construction',
    principle:
      'Field types preserve the meaning and validation requirements of data.',
  },
  {
    id: 'migration',
    label: 'Migration',
    principle:
      'A recorded migration must be applied before the database schema changes.',
  },
  {
    id: 'orm',
    label: 'ORM Query',
    principle:
      'A QuerySet condition determines which current records are returned.',
  },
  {
    id: 'crud',
    label: 'CRUD Operations',
    principle:
      'Create, Read, Update and Delete perform distinct operations on persistent records.',
  },
  {
    id: 'request',
    label: 'View Processing',
    principle:
      'URL resolution selects a view that coordinates data and an HTTP response.',
  },
  {
    id: 'relationships',
    label: 'Relationships',
    principle:
      'Cardinality determines whether a relationship is one-to-one, one-to-many or many-to-many.',
  },
  {
    id: 'errors',
    label: 'Error Handling',
    principle:
      'Invalid input produces a validation response, while absent routes or resources produce 404.',
  },
];

export default function Observation() {
  const [progress, setProgress] = useState<LabProgress>(emptyProgress);
  const [conclusion, setConclusion] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const sync = () => setProgress(readProgress());
    const timer = window.setTimeout(() => {
      sync();
      setConclusion(localStorage.getItem('django-lab-conclusion') || '');
    }, 0);
    window.addEventListener('lab-progress', sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('lab-progress', sync);
    };
  }, []);
  function saveConclusion() {
    if (conclusion.trim().length < 30) return;
    localStorage.setItem('django-lab-conclusion', conclusion.trim());
    setSaved(true);
    completeSection('Simulation');
  }
  function clear() {
    resetProgress();
    localStorage.removeItem('django-lab-conclusion');
    setConclusion('');
    setSaved(false);
    setProgress(readProgress());
  }
  return (
    <div className="observation-page">
      <h2>Observation</h2>
      <p>
        After completing the experiment, compare the expected principle with the
        result generated from your actual simulation actions.
      </p>
      <ol className="observation-list">
        {rows.map((row) => {
          const value = progress.observations[row.id];
          return (
            <li key={row.id}>
              <h3>{row.label}</h3>
              <p>
                <strong>Expected:</strong> {value?.expected || row.principle}
              </p>
              <p>
                <strong>Observed:</strong>{' '}
                {value?.observed ||
                  'Complete the corresponding activity to record an observation.'}
              </p>
              <p
                className={
                  value?.success
                    ? 'observation-status verified'
                    : 'observation-status'
                }
              >
                {value?.success
                  ? 'Verified from the experiment'
                  : 'Not yet verified'}
              </p>
            </li>
          );
        })}
      </ol>
      <h2>Conclusion</h2>
      <p>
        Explain how the URL, view, model, database, template and response worked
        together. Refer to at least one result observed above.
      </p>
      <textarea
        value={conclusion}
        onChange={(event) => {
          setConclusion(event.target.value);
          setSaved(false);
        }}
        maxLength={1500}
        placeholder="From the experiment, I observed that..."
      />
      {conclusion.trim().length > 0 && conclusion.trim().length < 30 && (
        <p className="error-text">
          Write at least 30 characters to explain the observation.
        </p>
      )}
      <div className="actions">
        <button
          type="button"
          className="vlab-button"
          onClick={saveConclusion}
          disabled={conclusion.trim().length < 30}
        >
          Save Conclusion
        </button>
        <button type="button" className="outline-vlab-button" onClick={clear}>
          Reset Recorded Progress
        </button>
      </div>
      {saved && (
        <p className="success-text" role="status">
          Conclusion saved in this browser.
        </p>
      )}
    </div>
  );
}
