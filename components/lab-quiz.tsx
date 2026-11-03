'use client';

import { useState } from 'react';
import { questions } from '@/lib/lesson-data';
import { completeSection, saveScore } from '@/lib/lab-progress';

const levels = ['Beginner', 'Intermediate', 'Advanced'] as const;

export default function Quiz({ kind }: { kind: 'pre' | 'post' }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedLevels, setSelectedLevels] = useState<string[]>([...levels]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const visible = questions[kind]
    .map((question, index) => ({
      ...question,
      index,
      difficulty:
        levels.find((level) => level === question.difficulty) ||
        levels[index % levels.length],
    }))
    .filter((question) => selectedLevels.includes(question.difficulty));
  const score = visible.filter(
    (question) => answers[question.index] === question.answer,
  ).length;

  function toggleLevel(level: string) {
    setSelectedLevels((current) =>
      current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level],
    );
    setSubmitted(false);
    setError('');
  }
  function submit() {
    if (!visible.length) {
      setError('Select at least one difficulty level.');
      return;
    }
    if (visible.some((question) => answers[question.index] === undefined)) {
      setError('Please answer all displayed questions before submitting.');
      return;
    }
    setSubmitted(true);
    setError('');
    saveScore(kind, score, visible.length);
    completeSection(kind === 'pre' ? 'Pretest' : 'Posttest');
  }
  function reset() {
    setAnswers({});
    setSubmitted(false);
    setError('');
  }

  return (
    <div className="quiz-page">
      <div className="difficulty-row">
        <strong>Choose difficulty:</strong>
        {levels.map((level) => (
          <label key={level}>
            <input
              type="checkbox"
              checked={selectedLevels.includes(level)}
              onChange={() => toggleLevel(level)}
            />
            {level}
          </label>
        ))}
      </div>
      {visible.map((question, displayedIndex) => (
        <fieldset className="quiz-question" key={question.index}>
          <legend>
            {displayedIndex + 1}. {question.question}
          </legend>
          {question.options.map((option, optionIndex) => (
            <label className="answer-option" key={option}>
              <input
                type="radio"
                name={`${kind}-question-${question.index}`}
                checked={answers[question.index] === optionIndex}
                onChange={() => {
                  setAnswers((current) => ({
                    ...current,
                    [question.index]: optionIndex,
                  }));
                  setSubmitted(false);
                  setError('');
                }}
              />
              <span>
                {String.fromCharCode(97 + optionIndex)}: {option}
              </span>
            </label>
          ))}
          {submitted && (
            <p
              className={
                answers[question.index] === question.answer
                  ? 'quiz-feedback correct'
                  : 'quiz-feedback incorrect'
              }
            >
              <strong>
                {answers[question.index] === question.answer
                  ? 'Correct.'
                  : `Correct answer: ${String.fromCharCode(97 + question.answer)}.`}
              </strong>{' '}
              {question.explanation}
            </p>
          )}
        </fieldset>
      ))}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <div className="quiz-actions">
        <button type="button" className="vlab-button" onClick={submit}>
          Submit Quiz
        </button>
        {submitted && (
          <button type="button" className="plain-action" onClick={reset}>
            Retry Quiz
          </button>
        )}
      </div>
      {submitted && (
        <p className="quiz-result" role="status">
          <strong>
            Score: {score} / {visible.length}
          </strong>{' '}
          — Review the explanations above before continuing.
        </p>
      )}
    </div>
  );
}
