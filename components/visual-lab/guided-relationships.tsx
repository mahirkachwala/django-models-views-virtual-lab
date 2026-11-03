'use client';

import { useState } from 'react';
import {
  authors,
  categories,
  type Action,
  type VisualState,
} from '@/lib/visual-lab';
import { CodeReveal } from './primitives';

type Props = {
  state: VisualState;
  send: (...actions: Action[]) => void;
  go: (step: number) => void;
};

function Entity({
  name,
  fields,
  active = false,
}: {
  name: string;
  fields: { name: string; key?: string }[];
  active?: boolean;
}) {
  return (
    <div
      className={`guided-er-entity${active ? ' is-active' : ''}`}
      data-entity={name}
    >
      <h4>{name}</h4>
      <ul>
        {fields.map((field) => (
          <li key={field.name}>
            <code>{field.name}</code>
            {field.key && (
              <abbr title={field.key === 'PK' ? 'Primary key' : 'Foreign key'}>
                {field.key}
              </abbr>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Relationship({
  label,
  from,
  to,
  active,
}: {
  label: string;
  from: string;
  to: string;
  active: boolean;
}) {
  return (
    <div className={`guided-er-connector${active ? ' is-active' : ''}`}>
      <span className="guided-er-cardinality">{from}</span>
      <div className="guided-er-relationship">
        <span>{label}</span>
      </div>
      <span className="guided-er-cardinality">{to}</span>
    </div>
  );
}

export function RelationshipLesson({ state, send, go }: Props) {
  const [authorId, setAuthorId] = useState(state.selectedAuthor ?? 1);
  const [cardinality, setCardinality] = useState('1:*');
  const [bookId, setBookId] = useState(
    state.selectedBook ?? state.books[0]?.id ?? 0,
  );
  const [show, setShow] = useState(
    state.links.author && state.selectedAuthor !== null,
  );
  const [error, setError] = useState('');
  const book = state.books.find((b) => b.id === bookId) ?? state.books[0];
  const author = authors.find((a) => a.id === authorId)!;
  const linked = state.books.filter((b) => b.author_id === authorId);
  const selectedLinks = state.memberships.filter(
    (pair) => pair.bookId === book?.id,
  );

  return (
    <div className="guided-bench guided-er-bench">
      <section className="guided-column" aria-label="Relationship input">
        <h3 className="guided-column-title">Input</h3>
        <div className="guided-column-body">
          <h4>Author → Book</h4>
          <p className="guided-help">One author can write several books.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (cardinality !== '1:*') {
                setError(
                  'Choose One author → many books. Each Book stores one author_id, and several books can share that ID.',
                );
                setShow(false);
                return;
              }
              setError('');
              send(
                { type: 'link', from: 'Author', to: 'Book', cardinality },
                { type: 'author', id: authorId },
              );
              setShow(true);
            }}
          >
            <div className="guided-er-inputs">
              <label>
                Author
                <select
                  value={authorId}
                  onChange={(event) => {
                    setAuthorId(Number(event.target.value));
                    setShow(false);
                    setError('');
                  }}
                >
                  {authors.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Author → Book relationship
                <select
                  value={cardinality}
                  onChange={(event) => {
                    setCardinality(event.target.value);
                    setShow(false);
                    setError('');
                  }}
                >
                  <option value="1:*">One author → many books</option>
                  <option value="1:1">One author → one book only</option>
                  <option value="*:*">Many authors → many books</option>
                </select>
              </label>
              <button>Show linked books</button>
            </div>
          </form>
          {error && (
            <p className="guided-message is-error" role="status">
              {error}
            </p>
          )}

          <div className="guided-er-second-task">
            <h4>Book ↔ Category</h4>
            <p className="guided-help">Give one book two categories.</p>
            {!state.links.categories ? (
              <button
                className="guided-secondary"
                onClick={() =>
                  send({
                    type: 'link',
                    from: 'Book',
                    to: 'Category',
                    cardinality: '*:*',
                  })
                }
              >
                Enable book–category links
              </button>
            ) : book ? (
              <>
                <label>
                  Book to categorise
                  <select
                    value={book.id}
                    onChange={(event) => setBookId(Number(event.target.value))}
                  >
                    {state.books.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset className="guided-prediction">
                  <legend>Tick categories for this book</legend>
                  {categories.map((category) => (
                    <label key={category.id}>
                      <input
                        type="checkbox"
                        checked={selectedLinks.some(
                          (pair) => pair.categoryId === category.id,
                        )}
                        onChange={() =>
                          send({
                            type: 'tag',
                            bookId: book.id,
                            categoryId: category.id,
                          })
                        }
                      />
                      {category.name}
                    </label>
                  ))}
                </fieldset>
              </>
            ) : (
              <>
                <p>
                  The catalogue is empty. Add a book before creating category
                  links.
                </p>
                <button className="guided-secondary" onClick={() => go(4)}>
                  Go to Manage books
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="guided-column" aria-label="Relationship execution">
        <h3 className="guided-column-title">Execution</h3>
        <div className="guided-column-body">
          <h4>Entity–relationship diagram</h4>
          <div
            className="guided-er-diagram"
            role="group"
            aria-label="Author one to many Book; Book many to many Category"
          >
            <Entity
              name="Author"
              active={show}
              fields={[{ name: 'id', key: 'PK' }, { name: 'name' }]}
            />
            <Relationship label="writes" from="1" to="N" active={show} />
            <Entity
              name="Book"
              active={show || state.links.categories}
              fields={[
                { name: 'id', key: 'PK' },
                { name: 'title' },
                { name: 'author_id', key: 'FK' },
              ]}
            />
            <Relationship
              label="has category"
              from="M"
              to="N"
              active={state.links.categories}
            />
            <Entity
              name="Category"
              active={state.links.categories}
              fields={[{ name: 'id', key: 'PK' }, { name: 'name' }]}
            />
          </div>
          <p className="guided-er-legend">
            <strong>1</strong> = one; <strong>M / N</strong> = many
            <br />
            <strong>PK</strong> = primary key; <strong>FK</strong> = foreign key
          </p>
          <div className="guided-er-explanation" aria-live="polite">
            {show ? (
              <p>
                <code>Book.author_id → Author.id</code> ({linked.length} match
                {linked.length === 1 ? '' : 'es'}).
              </p>
            ) : (
              <p>
                Click <strong>Show linked books</strong> to trace the foreign
                key.
              </p>
            )}
          </div>
          <CodeReveal
            label="See the Django relationship fields"
            code={
              'author = models.ForeignKey(Author, on_delete=models.CASCADE)\ncategories = models.ManyToManyField(Category)\n# ForeignKey stores author_id in Book.\n# ManyToManyField uses a separate join table.'
            }
          />
        </div>
      </section>

      <section className="guided-column" aria-label="Relationship result">
        <h3 className="guided-column-title">Result</h3>
        <div className="guided-column-body">
          <h4>Books by the selected author</h4>
          {show ? (
            <div className="guided-link-example guided-er-author-result">
              <strong>
                {author.name}
                <small>Author ID {authorId}</small>
              </strong>
              <ul>
                {linked.map((item) => (
                  <li key={item.id}>
                    {item.title}
                    <small>author_id = {item.author_id}</small>
                  </li>
                ))}
                {!linked.length && <li>No linked books yet</li>}
              </ul>
            </div>
          ) : (
            <p className="guided-empty">
              The selected author’s books will appear here.
            </p>
          )}

          <div className="guided-er-second-task">
            <h4>Book–category join table</h4>
            {state.links.categories ? (
              <>
                <div className="guided-table-scroll guided-er-pairs">
                  <table>
                    <caption className="guided-er-table-caption">
                      Stored category links — one row per connection
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Book</th>
                        <th scope="col">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.memberships.map((pair) => (
                        <tr
                          key={`${pair.bookId}-${pair.categoryId}`}
                          className={
                            pair.bookId === book?.id ? 'is-selected' : ''
                          }
                        >
                          <td>
                            {
                              state.books.find(
                                (item) => item.id === pair.bookId,
                              )?.title
                            }
                            <small>book_id = {pair.bookId}</small>
                          </td>
                          <td>
                            {
                              categories.find(
                                (item) => item.id === pair.categoryId,
                              )?.name
                            }
                            <small>category_id = {pair.categoryId}</small>
                          </td>
                        </tr>
                      ))}
                      {!state.memberships.length && (
                        <tr>
                          <td colSpan={2}>
                            No links yet. Tick a category in Input.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="guided-help">
                  Highlighted = selected book. Unticking removes the link, not
                  the book or category.
                </p>
                <p className="guided-er-total" role="status">
                  {state.memberships.length} stored connection
                  {state.memberships.length === 1 ? '' : 's'}
                </p>
              </>
            ) : (
              <p className="guided-empty">
                Enable category links, then tick two categories to see their
                stored pairs.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
