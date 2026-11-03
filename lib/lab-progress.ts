export type ObservationId =
  | 'model'
  | 'migration'
  | 'orm'
  | 'request'
  | 'crud'
  | 'errors'
  | 'relationships';
export type Observation = {
  id: ObservationId;
  experiment: string;
  expected: string;
  observed: string;
  success: boolean;
  at: string;
};
export type LabProgress = {
  sections: string[];
  activities: string[];
  observations: Partial<Record<ObservationId, Observation>>;
  preScore: { score: number; total: number } | null;
  postScore: { score: number; total: number } | null;
};

export const emptyProgress: LabProgress = {
  sections: [],
  activities: [],
  observations: {},
  preScore: null,
  postScore: null,
};
const initial = emptyProgress;
const key = 'django-virtual-lab-progress-v2';

export function readProgress(): LabProgress {
  if (typeof window === 'undefined') return initial;
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value &&
      Array.isArray(value.sections) &&
      Array.isArray(value.activities)
      ? { ...initial, ...value, observations: value.observations || {} }
      : initial;
  } catch {
    return initial;
  }
}
export function writeProgress(update: Partial<LabProgress>) {
  const next = { ...readProgress(), ...update };
  localStorage.setItem(key, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('lab-progress', { detail: next }));
  return next;
}
export function completeSection(section: string) {
  const current = readProgress();
  if (!current.sections.includes(section))
    writeProgress({ sections: [...current.sections, section] });
}
export function completeActivity(activity: string) {
  const current = readProgress();
  if (!current.activities.includes(activity))
    writeProgress({ activities: [...current.activities, activity] });
}
export function recordObservation(observation: Omit<Observation, 'at'>) {
  const current = readProgress();
  writeProgress({
    observations: {
      ...current.observations,
      [observation.id]: { ...observation, at: new Date().toISOString() },
    },
  });
}
export function saveScore(kind: 'pre' | 'post', score: number, total: number) {
  writeProgress(
    kind === 'pre'
      ? { preScore: { score, total } }
      : { postScore: { score, total } },
  );
}
export function resetExperimentState() {
  const current = readProgress();
  return writeProgress({
    activities: [],
    observations: {},
    sections: current.sections.filter(
      (section) =>
        section !== 'Experiment' &&
        section !== 'Observation' &&
        section !== 'Simulation',
    ),
  });
}
export function resetProgress() {
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent('lab-progress', { detail: initial }));
  return initial;
}
