'use client';
import { useState } from 'react';
import { authors, categories } from '@/lib/visual-lab';
import {
  CodeReveal,
  Observation,
  Output,
  WorkArea,
  type ExerciseProps,
} from './primitives';

type Selection = { entity: 'Author' | 'Book' | 'Category'; id: number };

export function RelationshipsLab({
  state,
  dispatch,
  mode = 'practice',
}: ExerciseProps) {
  const [from, setFrom] = useState('Author');
  const [to, setTo] = useState('Book');
  const [kind, setKind] = useState('1:*');
  const [label, setLabel] = useState('writes');
  const [message, setMessage] = useState('');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [challengeAuthor, setChallengeAuthor] = useState(authors[0].id);
  const [answerKind, setAnswerKind] = useState('');
  const [answerIds, setAnswerIds] = useState<number[]>([]);
  const [noBooks, setNoBooks] = useState(false);
  const [assessment, setAssessment] = useState<{
    key: string;
    text: string;
    correct: boolean;
  } | null>(null);
  const [construction, setConstruction] = useState<{
    key: string;
    text: string;
    correct: boolean;
  } | null>(null);
  const entities = ['Author', 'Book', 'Category'];
  const book =
    state.books.find((b) => b.id === state.selectedBook) ?? state.books[0];
  const labels = state.relationshipLabels ?? {
    author: 'writes',
    categories: 'belongs to',
  };
  const graphHeight = Math.max(350, state.books.length * 80 + 110);
  const actualIds = state.books
    .filter((b) => b.author_id === challengeAuthor)
    .map((b) => b.id);
  const challengeKey = JSON.stringify([
    challengeAuthor,
    state.books,
    answerKind,
    answerIds,
    noBooks,
  ]);
  const activeAssessment = assessment?.key === challengeKey ? assessment : null;
  const submittedPrediction = Boolean(
    activeAssessment && answerKind && (answerIds.length || noBooks),
  );
  const constructionKey = JSON.stringify([
    state.books.map((b) => b.id),
    state.links.categories,
    state.memberships,
  ]);
  const activeConstruction =
    construction?.key === constructionKey ? construction : null;
  const visibleIds =
    selection?.entity === 'Author'
      ? state.books
          .filter(
            (b) =>
              state.links.author &&
              b.author_id === selection.id &&
              (mode !== 'exercise' || submittedPrediction),
          )
          .map((b) => b.id)
      : selection?.entity === 'Category'
        ? state.memberships
            .filter(
              (pair) =>
                state.links.categories && pair.categoryId === selection.id,
            )
            .map((pair) => pair.bookId)
        : selection?.entity === 'Book'
          ? [selection.id]
          : [];
  const selectedAuthor = authors.find(
    (a) => selection?.entity === 'Author' && a.id === selection.id,
  );
  const selectedCategory = categories.find(
    (c) => selection?.entity === 'Category' && c.id === selection.id,
  );
  const selectedBook = state.books.find(
    (b) => selection?.entity === 'Book' && b.id === selection.id,
  );

  function add() {
    const relation =
      from === 'Author' && to === 'Book' && kind === '1:*'
        ? 'author'
        : from === 'Book' && to === 'Category' && kind === '*:*'
          ? 'categories'
          : null;
    if (!relation) {
      setMessage(
        from === 'Author' && to === 'Book'
          ? 'Consider the catalog rule: one author may write several books; each Book stores one author_id. Which cardinality allows that?'
          : from === 'Book' && to === 'Category'
            ? 'A book can have several categories and each category can contain several books. Choose a relationship that permits both directions.'
            : 'For this experiment, connect Author → Book or Book → Category. Choose endpoints first, then reason about the cardinality.',
      );
      return;
    }
    if (state.links[relation]) {
      setMessage(
        'This model relationship already exists. You can explore its records or remove it below.',
      );
      return;
    }
    dispatch({ type: 'link', from, to, cardinality: kind });
    dispatch({
      type: 'relationshipLabel',
      relation,
      label: label.trim() || (relation === 'author' ? 'writes' : 'belongs to'),
    });
    setMessage(
      relation === 'author'
        ? 'Author → Book connected. Click an author to trace the Book rows storing that author_id.'
        : 'Book ↔ Category connected. Choose a book and add categories to create visible links and join-table rows.',
    );
  }
  function select(next: Selection) {
    setSelection(next);
    if (next.entity === 'Author') {
      if (mode === 'exercise' && next.id !== challengeAuthor) {
        setChallengeAuthor(next.id);
        setAnswerIds([]);
        setNoBooks(false);
      }
      if (mode !== 'exercise') dispatch({ type: 'author', id: next.id });
    }
    if (next.entity === 'Book') dispatch({ type: 'selectBook', id: next.id });
  }
  function check() {
    if (!answerKind || (!answerIds.length && !noBooks)) {
      setAssessment({
        key: challengeKey,
        text: 'Choose a cardinality and predict the linked books (or select “No books”).',
        correct: false,
      });
      return;
    }
    const missed = actualIds.filter((id) => !answerIds.includes(id));
    const extra = answerIds.filter((id) => !actualIds.includes(id));
    const correct = answerKind === '1:*' && !missed.length && !extra.length;
    setAssessment({
      key: challengeKey,
      correct,
      text: `${correct ? 'Correct.' : 'Review your prediction.'} Author → Book is one-to-many: each Book holds one author_id, while several books can hold the same author_id. For author ${challengeAuthor}, the matching Book IDs are ${actualIds.length ? actualIds.join(', ') : 'none'}.${missed.length ? ` You missed ${missed.join(', ')}.` : ''}${extra.length ? ` Book IDs ${extra.join(', ')} reference a different author.` : ''}`,
    });
    if (correct && state.links.author)
      dispatch({ type: 'author', id: challengeAuthor });
  }

  return (
    <>
      <WorkArea title="Connect models, then trace individual records">
        <p>
          A catalog has authors, books and categories. Build the model
          relationships; then click a record in the diagram to follow its
          connections. The records are shared with CRUD Operations.
        </p>
        <form
          className="classic-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
        >
          <label>
            From
            <select
              aria-label="From entity"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            >
              {entities.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Cardinality
            <select
              aria-label="Relationship type"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="1:1">One-to-One</option>
              <option value="1:*">One-to-Many</option>
              <option value="*:*">Many-to-Many</option>
            </select>
          </label>
          <label>
            To
            <select
              aria-label="To entity"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            >
              {entities.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Relationship label
            <input
              aria-label="Relationship label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={40}
            />
          </label>
          <button type="submit">Connect models</button>
        </form>
        {mode === 'demo' && (
          <p>
            Try Author → Book with One-to-Many; then Book → Category with
            Many-to-Many. The first uses a foreign key; the second uses a
            separate table of record pairs.
          </p>
        )}
        <div className="inquiry-current-links">
          {state.links.author && (
            <p>
              <strong>Author 1 → many Book</strong> · {labels.author}{' '}
              <button
                onClick={() => {
                  dispatch({ type: 'unlink', relation: 'author' });
                  setMessage(
                    'Author connector removed from this diagram. Book.author_id remains because Author is a required field in this lab.',
                  );
                }}
              >
                Remove author connector
              </button>
            </p>
          )}
          {state.links.categories && (
            <p>
              <strong>Book many ↔ many Category</strong> · {labels.categories}{' '}
              <button
                onClick={() => {
                  dispatch({ type: 'unlink', relation: 'categories' });
                  setMessage(
                    'Category relationship removed; its join-table pairs were removed. The Book and Category records remain.',
                  );
                }}
              >
                Remove category relationship
              </button>
            </p>
          )}
          {!state.links.author && !state.links.categories && (
            <p>
              No model connectors yet. Build a relationship above to reveal the
              record links.
            </p>
          )}
        </div>
        {message && <Observation>{message}</Observation>}
      </WorkArea>

      <Output title="Live record diagram">
        <p>
          Click any record. Highlighted lines show its matching records; every
          line represents a foreign key or a join-table pair.
        </p>
        <div className="classic-table-scroll inquiry-graph-scroll">
          <div
            className="inquiry-relation-graph"
            style={{ position: 'relative', minWidth: 950, height: graphHeight }}
          >
            <div
              className="inquiry-graph-heading"
              style={{ position: 'absolute', left: 12, top: 10 }}
            >
              Author <small>id · name</small>
            </div>
            <div
              className="inquiry-graph-heading"
              style={{ position: 'absolute', left: 370, top: 10 }}
            >
              Book <small>id · title · author_id</small>
            </div>
            <div
              className="inquiry-graph-heading"
              style={{ position: 'absolute', left: 755, top: 10 }}
            >
              Category <small>id · name</small>
            </div>
            <svg
              width="950"
              height={graphHeight}
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0 }}
            >
              {state.links.author &&
                state.books.map((b, index) => {
                  const authorIndex = authors.findIndex(
                    (a) => a.id === b.author_id,
                  );
                  if (authorIndex < 0) return null;
                  return (
                    <path
                      key={`author-${b.id}`}
                      d={`M 222 ${104 + authorIndex * 90} C 285 ${104 + authorIndex * 90}, 305 ${104 + index * 80}, 370 ${104 + index * 80}`}
                      fill="none"
                      stroke={visibleIds.includes(b.id) ? '#e96919' : '#aab7c2'}
                      strokeWidth={visibleIds.includes(b.id) ? 4 : 2}
                      className={
                        visibleIds.includes(b.id)
                          ? 'inquiry-link-active'
                          : undefined
                      }
                    />
                  );
                })}
              {state.links.categories &&
                state.memberships.map((pair) => {
                  const bookIndex = state.books.findIndex(
                    (b) => b.id === pair.bookId,
                  );
                  const categoryIndex = categories.findIndex(
                    (c) => c.id === pair.categoryId,
                  );
                  if (bookIndex < 0 || categoryIndex < 0) return null;
                  const active =
                    selection?.entity === 'Category'
                      ? selection.id === pair.categoryId
                      : visibleIds.includes(pair.bookId);
                  return (
                    <path
                      key={`${pair.bookId}-${pair.categoryId}`}
                      d={`M 610 ${104 + bookIndex * 80} C 670 ${104 + bookIndex * 80}, 690 ${104 + categoryIndex * 90}, 755 ${104 + categoryIndex * 90}`}
                      fill="none"
                      stroke={active ? '#e96919' : '#aab7c2'}
                      strokeWidth={active ? 4 : 2}
                      className={active ? 'inquiry-link-active' : undefined}
                    />
                  );
                })}
            </svg>
            {authors.map((author, index) => (
              <button
                key={author.id}
                className={`inquiry-record-node ${selection?.entity === 'Author' && selection.id === author.id ? 'selected' : ''}`}
                aria-pressed={
                  selection?.entity === 'Author' && selection.id === author.id
                }
                style={{
                  position: 'absolute',
                  left: 12,
                  top: 80 + index * 90,
                  width: 210,
                  minHeight: 50,
                }}
                onClick={() => select({ entity: 'Author', id: author.id })}
              >
                <b>
                  {author.id}. {author.name}
                </b>
              </button>
            ))}
            {state.books.map((b, index) => (
              <button
                key={b.id}
                className={`inquiry-record-node ${visibleIds.includes(b.id) ? 'selected' : ''}`}
                aria-pressed={
                  selection?.entity === 'Book' && selection.id === b.id
                }
                style={{
                  position: 'absolute',
                  left: 370,
                  top: 80 + index * 80,
                  width: 240,
                  minHeight: 50,
                }}
                onClick={() => select({ entity: 'Book', id: b.id })}
              >
                <b>
                  {b.id}. {b.title}
                </b>
                <small>author_id = {b.author_id}</small>
              </button>
            ))}
            {categories.map((category, index) => (
              <button
                key={category.id}
                className={`inquiry-record-node ${selection?.entity === 'Category' && selection.id === category.id ? 'selected' : ''}`}
                aria-pressed={
                  selection?.entity === 'Category' &&
                  selection.id === category.id
                }
                style={{
                  position: 'absolute',
                  left: 755,
                  top: 80 + index * 90,
                  width: 185,
                  minHeight: 50,
                }}
                onClick={() => select({ entity: 'Category', id: category.id })}
              >
                <b>
                  {category.id}. {category.name}
                </b>
              </button>
            ))}
            {!state.books.length && (
              <p
                style={{ position: 'absolute', left: 370, top: 80, width: 230 }}
              >
                No Book records. Add one in CRUD Operations.
              </p>
            )}
          </div>
        </div>
        {selection && (
          <div className="inquiry-record-detail" role="status">
            {selectedAuthor && (
              <>
                <strong>{selectedAuthor.name}</strong>
                <p>
                  {mode === 'exercise' && !submittedPrediction
                    ? 'Predict this author’s linked books in the question below, then select Check linked records to reveal the highlighted matches.'
                    : state.links.author
                      ? `${visibleIds.length} linked books: ${
                          state.books
                            .filter((b) => visibleIds.includes(b.id))
                            .map((b) => b.title)
                            .join(', ') || 'none'
                        }. Match the author’s id to each Book.author_id.`
                      : 'Connect Author → Book to trace its foreign-key links.'}
                </p>
                <code>{`Book.objects.filter(author_id=${selectedAuthor.id})`}</code>
              </>
            )}
            {selectedCategory && (
              <>
                <strong>{selectedCategory.name}</strong>
                <p>
                  {state.links.categories
                    ? `${visibleIds.length} linked books: ${
                        state.books
                          .filter((b) => visibleIds.includes(b.id))
                          .map((b) => b.title)
                          .join(', ') || 'none'
                      }. These links come from the intermediate table.`
                    : 'Connect Book → Category, then add category pairs below.'}
                </p>
                <code>{`Book.objects.filter(categories__id=${selectedCategory.id})`}</code>
              </>
            )}
            {selectedBook && (
              <>
                <strong>{selectedBook.title}</strong>
                <p>
                  Author:{' '}
                  {authors.find((a) => a.id === selectedBook.author_id)?.name}.
                  Categories:{' '}
                  {state.memberships
                    .filter((pair) => pair.bookId === selectedBook.id)
                    .map(
                      (pair) =>
                        categories.find((c) => c.id === pair.categoryId)?.name,
                    )
                    .join(', ') || 'none yet'}
                  .
                </p>
                <code>{`book = Book.objects.get(pk=${selectedBook.id})\nbook.author\n${state.links.categories ? 'book.categories.all()' : '# Add the categories relationship to query its manager.'}`}</code>
              </>
            )}
          </div>
        )}
        {state.links.categories && (
          <section className="inquiry-pair-editor">
            <h4>Create and remove record links</h4>
            {book ? (
              <>
                <label>
                  Book to tag
                  <select
                    aria-label="Book to tag"
                    value={book.id}
                    onChange={(event) =>
                      select({ entity: 'Book', id: Number(event.target.value) })
                    }
                  >
                    {state.books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id}. {b.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="classic-checkboxes">
                  {categories.map((category) => (
                    <label key={category.id}>
                      <input
                        type="checkbox"
                        checked={state.memberships.some(
                          (pair) =>
                            pair.bookId === book.id &&
                            pair.categoryId === category.id,
                        )}
                        onChange={() => {
                          dispatch({
                            type: 'tag',
                            bookId: book.id,
                            categoryId: category.id,
                          });
                          setSelection({ entity: 'Book', id: book.id });
                        }}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
                <p>
                  Ticking a category inserts one pair; unticking it removes that
                  pair. Neither operation deletes the book or category.
                </p>
              </>
            ) : (
              <p>Add a Book in CRUD Operations before creating record links.</p>
            )}
            <div className="classic-table-scroll">
              <table className="classic-table inquiry-table">
                <caption>Intermediate table: catalog_book_categories</caption>
                <thead>
                  <tr>
                    <th>book_id</th>
                    <th>category_id</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {state.memberships.map((pair) => (
                    <tr
                      key={`${pair.bookId}-${pair.categoryId}`}
                      className={
                        (
                          selection?.entity === 'Category'
                            ? selection.id === pair.categoryId
                            : visibleIds.includes(pair.bookId)
                        )
                          ? 'match'
                          : ''
                      }
                    >
                      <td>{pair.bookId}</td>
                      <td>{pair.categoryId}</td>
                      <td>
                        {state.books.find((b) => b.id === pair.bookId)?.title} →{' '}
                        {categories.find((c) => c.id === pair.categoryId)?.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!state.memberships.length && (
              <p>
                No pairs yet. Select a category above to draw the first
                connection.
              </p>
            )}
          </section>
        )}
        {(mode !== 'exercise' || submittedPrediction) && (
          <CodeReveal
            label="View Django relationship definitions"
            code={`class Book(models.Model):\n    author = models.ForeignKey(Author, on_delete=models.CASCADE)${state.links.categories ? '\n    categories = models.ManyToManyField(Category)' : ''}\n\n# author_id is stored in the Book table.\n# A ManyToManyField uses a separate intermediate table.`}
          />
        )}
        <p className="inquiry-note">
          The author field already exists in the library model; its connector
          illustrates it. Adding the categories field abstracts its migration in
          this activity. Explore schema migration separately in Migrations.
        </p>
      </Output>

      {mode !== 'demo' && (
        <WorkArea title="Predict and check: follow a foreign key">
          <p>
            For the selected author, predict which Book records reference that
            author. The catalog allows an author to write several books, while
            every book has one author.
          </p>
          <div className="classic-inline-form">
            <label>
              Author for this question
              <select
                value={challengeAuthor}
                onChange={(event) => {
                  setChallengeAuthor(Number(event.target.value));
                  setSelection({
                    entity: 'Author',
                    id: Number(event.target.value),
                  });
                  setAnswerIds([]);
                  setNoBooks(false);
                }}
              >
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id}. {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Author → Book cardinality
              <select
                value={answerKind}
                onChange={(event) => setAnswerKind(event.target.value)}
              >
                <option value="">Choose an answer</option>
                <option value="1:1">One-to-One</option>
                <option value="1:*">One-to-Many</option>
                <option value="*:*">Many-to-Many</option>
              </select>
            </label>
          </div>
          <fieldset className="inquiry-prediction">
            <legend>Which books are linked to this author?</legend>
            {state.books.map((b) => (
              <label key={b.id}>
                <input
                  type="checkbox"
                  checked={answerIds.includes(b.id)}
                  onChange={() => {
                    setAnswerIds(
                      answerIds.includes(b.id)
                        ? answerIds.filter((id) => id !== b.id)
                        : [...answerIds, b.id],
                    );
                    setNoBooks(false);
                  }}
                />
                {b.id}. {b.title}
              </label>
            ))}
            <label>
              <input
                type="checkbox"
                checked={noBooks}
                onChange={(event) => {
                  setNoBooks(event.target.checked);
                  setAnswerIds([]);
                }}
              />
              No books reference this author
            </label>
          </fieldset>
          <button onClick={check}>Check linked records</button>
          {activeAssessment && (
            <Observation error={!activeAssessment.correct}>
              {activeAssessment.text}
            </Observation>
          )}
          {mode === 'exercise' && state.books.length >= 2 && (
            <div className="inquiry-prediction">
              <h4>Construct a many-to-many example</h4>
              <p>
                Connect Book → Category. Link “{state.books[0].title}” to Python
                and Django, and “{state.books[1].title}” to Python. Click Python
                to observe two books; click the first book to observe two
                categories.
              </p>
              <button
                onClick={() => {
                  const required = [
                    [state.books[0].id, 1],
                    [state.books[0].id, 2],
                    [state.books[1].id, 1],
                  ];
                  const missing = required.filter(
                    ([bookId, categoryId]) =>
                      !state.memberships.some(
                        (pair) =>
                          pair.bookId === bookId &&
                          pair.categoryId === categoryId,
                      ),
                  );
                  setConstruction({
                    key: constructionKey,
                    correct: state.links.categories && !missing.length,
                    text: !state.links.categories
                      ? 'First connect Book → Category with Many-to-Many.'
                      : missing.length
                        ? `The construction is incomplete. Add these join-table pairs: ${missing.map(([bookId, categoryId]) => `(${bookId}, ${categoryId})`).join(', ')}. Each pair connects one existing book to one existing category.`
                        : 'Construction correct: one book has two categories, and Python contains two books. The shared category record is not duplicated; separate join-table pairs express the connections.',
                  });
                }}
              >
                Check many-to-many construction
              </button>
              {activeConstruction && (
                <Observation error={!activeConstruction.correct}>
                  {activeConstruction.text}
                </Observation>
              )}
            </div>
          )}
        </WorkArea>
      )}
    </>
  );
}
