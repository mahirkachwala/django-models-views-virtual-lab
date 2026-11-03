import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialState,
  reduce,
  plan,
  queryBooks,
  completed,
  serialize,
  restore,
  generatedCode,
} from '../lib/visual-lab.ts';

function finish(s) {
  for (let i = 0; s.flow && !s.flow.done && i < 30; i++)
    s = reduce(s, { type: 'advance' });
  assert.ok(s.flow?.done);
  return s;
}
function run(s, operation) {
  return finish(reduce(s, { type: 'start', operation }));
}
function migrated() {
  let s = reduce(initialState(), { type: 'field', field: 'price' });
  s = run(s, { kind: 'generate' });
  return run(s, { kind: 'apply' });
}

test('simple controls perform operations atomically and reject invalid writes', () => {
  let s = migrated();
  s = reduce(s, {
    type: 'perform',
    operation: {
      kind: 'create',
      book: { title: 'New Book', author_id: 1, price: 123 },
    },
  });
  assert.equal(s.books.length, 4);
  assert.equal(s.flow.done, true);
  const before = structuredClone(s.books);
  s = reduce(s, {
    type: 'perform',
    operation: { kind: 'create', book: { title: '', author_id: 1, price: -3 } },
  });
  assert.deepEqual(s.books, before);
  s = reduce(s, {
    type: 'perform',
    operation: {
      kind: 'query',
      query: { field: 'price', operator: 'lt', value: '700' },
    },
  });
  assert.deepEqual(s.queryIds, [1, 2, 3, 4]);
});
test('removing a field requires migration and discards only that field values', () => {
  let s = reduce(migrated(), { type: 'prices' });
  s = reduce(s, { type: 'removeField', field: 'price' });
  assert.equal(s.model.includes('price'), false);
  assert.equal(s.books[0].price, 500);
  s = run(s, { kind: 'generate' });
  assert.equal(s.schema.includes('price'), true);
  s = run(s, { kind: 'apply' });
  assert.equal(s.schema.includes('price'), false);
  assert.equal('price' in s.books[0], false);
  assert.equal(s.books[0].title, 'Django Basics');
  s = reduce(s, { type: 'removeField', field: 'title' });
  assert.equal(s.model.includes('title'), true);
});
test('relationship removal updates graph and category pairs without deleting books', () => {
  let s = reduce(initialState(), {
    type: 'link',
    from: 'Book',
    to: 'Category',
    cardinality: '*:*',
  });
  s = reduce(s, {
    type: 'relationshipLabel',
    relation: 'categories',
    label: 'classified as',
  });
  s = reduce(s, { type: 'tag', bookId: 1, categoryId: 1 });
  assert.equal(
    restore(serialize(s)).relationshipLabels.categories,
    'classified as',
  );
  s = reduce(s, { type: 'unlink', relation: 'categories' });
  assert.equal(s.links.categories, false);
  assert.deepEqual(s.memberships, []);
  assert.equal(s.books.length, 3);
});

test('request progression advances exactly one stage and completion needs display', () => {
  let s = reduce(initialState(), {
    type: 'start',
    operation: { kind: 'request', path: '/books/' },
    play: false,
  });
  assert.equal(s.flow.index, 0);
  assert.equal(s.flow.stages[0].node, 'Browser');
  assert.equal(completed(s)[0], false);
  s = reduce(s, { type: 'advance' });
  assert.equal(s.flow.index, 1);
  assert.equal(s.flow.stages[1].node, 'URLconf');
  s = finish(s);
  assert.equal(completed(s)[0], true);
  assert.equal(s.flow.result.length, 3);
});
test('route failures stop at resolver; missing objects stop at database', () => {
  const route = run(initialState(), { kind: 'request', path: '/missing/' });
  assert.equal(route.flow.status, 404);
  assert.equal(route.flow.stages.at(-1).node, 'URLconf');
  const object = run(initialState(), { kind: 'request', path: '/books/999/' });
  assert.equal(object.flow.status, 404);
  assert.equal(object.flow.stages.at(-1).node, 'Database');
  assert.equal(object.evidence.includes('request'), false);
});
test('unbound form skips database; detail uses the actual selected row', () => {
  assert.equal(
    plan(initialState(), {
      kind: 'request',
      path: '/books/create/',
    }).stages.some((s) => s.node === 'Database'),
    false,
  );
  assert.equal(
    run(initialState(), { kind: 'request', path: '/books/2/' }).flow.result[0]
      .title,
    'Web Development',
  );
});
test('adding fields is idempotent and cannot change the database', () => {
  let s = reduce(initialState(), { type: 'field', field: 'price' });
  s = reduce(s, { type: 'field', field: 'price' });
  assert.equal(s.model.filter((f) => f === 'price').length, 1);
  assert.equal(s.schema.includes('price'), false);
  assert.equal(s.books[0].price, undefined);
  assert.match(generatedCode(s), /DecimalField/);
});
test('generation records only model snapshot; apply updates schema and defaults', () => {
  let s = reduce(initialState(), { type: 'field', field: 'price' });
  s = run(s, { kind: 'generate' });
  assert.equal(s.migrations[1].applied, false);
  assert.equal(s.schema.includes('price'), false);
  s = run(s, { kind: 'apply' });
  assert.equal(s.migrations[1].applied, true);
  assert.equal(s.books[0].price, 0);
  assert.equal(completed(s)[2], true);
  const next = reduce(s, { type: 'start', operation: { kind: 'generate' } });
  assert.equal(next.migrations.length, 2);
  assert.match(next.notice, /No model changes/);
});
test('later model changes need a second migration and preserve data', () => {
  let s = reduce(migrated(), { type: 'prices' });
  s = reduce(s, { type: 'field', field: 'available' });
  assert.equal(completed(s)[2], false);
  s = run(s, { kind: 'generate' });
  s = run(s, { kind: 'apply' });
  assert.equal(s.migrations.length, 3);
  assert.equal(s.books[0].price, 500);
  assert.equal(s.books[0].available, true);
});
test('ORM filters matching rows and preserves database contents', () => {
  let s = reduce(migrated(), { type: 'prices' });
  const before = structuredClone(s.books);
  s = run(s, {
    kind: 'query',
    query: { field: 'price', operator: 'lt', value: '700' },
  });
  assert.deepEqual(s.queryIds, [1, 3]);
  assert.deepEqual(s.books, before);
  assert.match(s.sql, /price < 700/);
  assert.equal(completed(s)[3], true);
  assert.equal(
    queryBooks(s, { field: 'title', operator: 'contains', value: 'Django' })
      .result.length,
    2,
  );
  assert.throws(
    () => queryBooks(s, { field: 'price', operator: 'lt', value: 'NaN' }),
    /finite/,
  );
  assert.throws(
    () =>
      queryBooks(initialState(), {
        field: 'price',
        operator: 'lt',
        value: '700',
      }),
    /no price column/,
  );
});
test('CRUD commits at database stage exactly once and PRG reads latest state', () => {
  let s = migrated();
  s = reduce(s, {
    type: 'start',
    operation: {
      kind: 'create',
      book: { title: 'Building APIs', author_id: 1, price: 825 },
    },
    play: false,
  });
  assert.equal(s.books.length, 3);
  while (s.flow.stages[s.flow.index].node !== 'Database')
    s = reduce(s, { type: 'advance' });
  assert.equal(s.books.length, 4);
  s = finish(s);
  assert.equal(s.books.length, 4);
  assert.ok(s.flow.stages.some((x) => x.title === '302 Found'));
  const id = s.selectedBook;
  s = run(s, { kind: 'read', id });
  assert.equal(s.flow.result[0].title, 'Building APIs');
  s = run(s, {
    kind: 'update',
    id,
    book: { title: 'Building APIs', author_id: 2, price: 850 },
  });
  assert.equal(s.books.at(-1).price, 850);
  s = run(s, { kind: 'delete', id });
  assert.equal(s.books.length, 3);
  assert.equal(completed(s)[4], true);
});
test('invalid writes fail without animation or mutation', () => {
  const s = migrated();
  const invalid = reduce(s, {
    type: 'start',
    operation: { kind: 'create', book: { title: '', author_id: 1, price: 2 } },
  });
  assert.deepEqual(invalid.books, s.books);
  assert.match(invalid.notice, /Title/);
  const missing = reduce(s, {
    type: 'start',
    operation: { kind: 'delete', id: 999 },
  });
  assert.deepEqual(missing.books, s.books);
  assert.match(missing.notice, /no longer exists/);
});
test('relationships enforce cardinality, share books and preserve join pairs', () => {
  let s = migrated();
  s = reduce(s, {
    type: 'link',
    from: 'Author',
    to: 'Book',
    cardinality: '1:1',
  });
  assert.equal(s.links.author, false);
  s = reduce(s, {
    type: 'link',
    from: 'Author',
    to: 'Book',
    cardinality: '1:*',
  });
  s = reduce(s, { type: 'author', id: 1 });
  s = reduce(s, {
    type: 'link',
    from: 'Book',
    to: 'Category',
    cardinality: '*:*',
  });
  s = reduce(s, { type: 'tag', bookId: 1, categoryId: 1 });
  s = reduce(s, { type: 'tag', bookId: 1, categoryId: 2 });
  assert.equal(s.memberships.length, 2);
  assert.equal(completed(s)[5], true);
  s = run(s, { kind: 'delete', id: 1 });
  assert.equal(s.memberships.length, 0);
});
test('debug completion requires observing the failure and verifying each repair', () => {
  let s = run(initialState(), {
    kind: 'request',
    path: '/books/',
    debug: true,
  });
  assert.equal(s.flow.status, 404);
  s = reduce(s, { type: 'fix', value: '/books/' });
  assert.equal(completed(s)[6], false);
  s = run(s, { kind: 'request', path: '/books/', debug: true });
  assert.equal(s.flow.status, 200);
  s = reduce(s, { type: 'debug', scenario: 'template' });
  s = run(s, { kind: 'request', path: '/books/', debug: true });
  assert.equal(s.flow.status, 500);
  assert.equal(s.flow.stages.at(-1).node, 'Template');
  s = reduce(s, { type: 'fix', value: 'catalog/book_list.html' });
  s = run(s, { kind: 'request', path: '/books/', debug: true });
  assert.equal(completed(s)[6], true);
});
test('navigation and persistence pause without losing committed state; resume works', () => {
  let s = reduce(migrated(), {
    type: 'start',
    operation: {
      kind: 'create',
      book: { title: 'Persistent book', price: 850, author_id: 1 },
    },
  });
  while (!s.flow.committed) s = reduce(s, { type: 'advance' });
  s = reduce(s, { type: 'step', step: 3 });
  assert.equal(s.flow.playing, false);
  s = restore(serialize(s));
  assert.equal(s.books.length, 4);
  assert.equal(s.flow.playing, false);
  s = reduce(s, { type: 'resume' });
  s = finish(s);
  assert.equal(s.books.length, 4);
});
test('reset and corrupt storage recover cleanly; navigation alone earns no completion', () => {
  let s = initialState();
  for (let i = 0; i < 8; i++) s = reduce(s, { type: 'step', step: i });
  assert.deepEqual(completed(s), Array(7).fill(false));
  assert.deepEqual(restore('{broken'), initialState());
  assert.deepEqual(restore('{"version":3}'), initialState());
  assert.deepEqual(reduce(migrated(), { type: 'reset' }), initialState());
});

test('a paused migration generation retains its captured model, later edits need another migration', () => {
  let s = reduce(initialState(), { type: 'field', field: 'price' });
  s = reduce(s, {
    type: 'start',
    operation: { kind: 'generate' },
    play: false,
  });
  s = reduce(s, { type: 'field', field: 'available' });
  s = finish(s);
  assert.deepEqual(s.migrations.at(-1).fields, ['title', 'author', 'price']);
  s = run(s, { kind: 'apply' });
  assert.equal(s.schema.includes('available'), false);
  assert.equal(completed(s)[2], false);
  s = run(s, { kind: 'generate' });
  s = run(s, { kind: 'apply' });
  assert.equal(s.books[0].available, true);
  assert.equal(completed(s)[2], true);
});

test('sequential pending migrations drop and re-add data with the field default', () => {
  let s = reduce(migrated(), { type: 'prices' });
  s = reduce(s, { type: 'removeField', field: 'price' });
  assert.equal(completed(s)[2], false);
  s = run(s, { kind: 'generate' });
  s = reduce(s, { type: 'field', field: 'price' });
  s = run(s, { kind: 'generate' });
  assert.equal(s.books[0].price, 500);
  s = run(s, { kind: 'apply' });
  assert.equal(s.books[0].price, 0);
  assert.ok(s.migrations.every((m) => m.applied));
});

test('query predicates treat wildcard characters as text and reject incompatible conditions', () => {
  const s = migrated();
  s.books[0].title = '100%_Django';
  const q = queryBooks(s, {
    field: 'title',
    operator: 'contains',
    value: '%_',
  });
  assert.deepEqual(
    q.result.map((b) => b.id),
    [1],
  );
  assert.ok(q.sql.includes('\\%\\_'));
  assert.throws(
    () => queryBooks(s, { field: 'price', operator: 'contains', value: '5' }),
    /supported/,
  );
  assert.deepEqual(
    queryBooks(s, { field: 'price', operator: 'lt', value: '0' }).result,
    [],
  );
});

test('detail tracing shows the same record, context and template as its response', () => {
  const s = run(initialState(), { kind: 'request', path: '/books/2/' });
  assert.match(
    s.flow.stages.find((stage) => stage.node === 'Database').code,
    /WHERE id = 2/,
  );
  assert.match(
    s.flow.stages.find((stage) => stage.title === 'Build context').code,
    /book_detail/,
  );
  assert.equal(
    s.flow.stages.find((stage) => stage.node === 'Template').code,
    '<h1>{{ book.title }}</h1>',
  );
  assert.equal(s.flow.result[0].id, 2);
});

test('captured record IDs reach compatible view signatures for detail and mutation routes', () => {
  const state = migrated();
  const book = { title: 'Updated book', author_id: 1, price: 250 };
  for (const { operation, route, view } of [
    {
      operation: { kind: 'request', path: '/books/2/' },
      route: 'books/<int:pk>/',
      view: 'book_detail',
    },
    {
      operation: { kind: 'read', id: 2 },
      route: 'books/<int:pk>/',
      view: 'book_detail',
    },
    {
      operation: { kind: 'update', id: 2, book },
      route: 'books/<int:pk>/edit/',
      view: 'book_update',
    },
    {
      operation: { kind: 'delete', id: 2 },
      route: 'books/<int:pk>/delete/',
      view: 'book_delete',
    },
  ]) {
    const journey = plan(state, operation);
    const url = journey.stages.find((stage) => stage.node === 'URLconf');
    const invocation = journey.stages.find(
      (stage) => stage.title === 'View called',
    );
    assert.equal(url.code, `path("${route}", views.${view}, name="${view}")`);
    assert.equal(invocation.detail, `${view}(request, pk=2)`);
    assert.equal(invocation.code, `def ${view}(request, pk):`);
  }
  for (const path of ['/books/', '/books/create/']) {
    const journey = plan(state, { kind: 'request', path });
    assert.equal(
      journey.stages.find((stage) => stage.title === 'View called').code,
      `def ${journey.view}(request):`,
    );
  }
});

test('list templates trigger lazy query evaluation and a missing template never reads the books', () => {
  const state = initialState();
  const list = plan(state, { kind: 'request', path: '/books/' });
  const modelIndex = list.stages.findIndex((stage) => stage.node === 'Model');
  const contextIndex = list.stages.findIndex(
    (stage) => stage.title === 'Build context',
  );
  const templateIndex = list.stages.findIndex(
    (stage) => stage.node === 'Template',
  );
  const databaseIndex = list.stages.findIndex(
    (stage) => stage.node === 'Database',
  );
  assert.match(list.stages[modelIndex].title, /lazy QuerySet/);
  assert.match(list.stages[modelIndex].detail, /No database read/);
  assert.ok(modelIndex < contextIndex && contextIndex < templateIndex);
  assert.ok(templateIndex < databaseIndex);
  assert.match(list.stages[templateIndex].code, /for book in books/);

  const missingTemplate = plan(
    { ...state, debug: { ...state.debug, scenario: 'template' } },
    { kind: 'request', path: '/books/', debug: true },
  );
  assert.equal(missingTemplate.status, 500);
  assert.equal(
    missingTemplate.stages.some((stage) => stage.node === 'Database'),
    false,
  );
  assert.equal(missingTemplate.stages.at(-1).node, 'Template');

  const detail = plan(state, { kind: 'request', path: '/books/2/' });
  assert.ok(
    detail.stages.findIndex((stage) => stage.node === 'Database') <
      detail.stages.findIndex((stage) => stage.title === 'Build context'),
  );
});

test('filter results appear at evaluation while constructing the lazy query leaves records untouched', () => {
  let state = reduce(migrated(), { type: 'prices' });
  const before = structuredClone(state.books);
  state = reduce(state, {
    type: 'start',
    play: false,
    operation: {
      kind: 'query',
      query: { field: 'price', operator: 'lt', value: '700' },
    },
  });
  assert.match(state.flow.stages[0].title, /lazy QuerySet/);
  assert.equal(state.queryIds, null);
  state = reduce(state, { type: 'advance' });
  assert.equal(state.flow.stages[state.flow.index].title, 'Evaluate QuerySet');
  assert.equal(state.queryIds, null);
  state = reduce(state, { type: 'advance' });
  assert.equal(state.flow.stages[state.flow.index].node, 'Database');
  assert.deepEqual(state.queryIds, [1, 3]);
  assert.deepEqual(state.books, before);
});

test('CSRF precedes write views and ModelForm preparation saves the same instance once', () => {
  const state = migrated();
  const book = { title: 'Validated book', author_id: 1, price: 250 };
  for (const operation of [
    { kind: 'create', book },
    { kind: 'update', id: 2, book },
    { kind: 'delete', id: 2 },
  ]) {
    const journey = plan(state, operation);
    const middlewareIndex = journey.stages.findIndex(
      (stage) => stage.node === 'Middleware',
    );
    const viewIndex = journey.stages.findIndex(
      (stage) => stage.title === 'View called',
    );
    const databaseIndex = journey.stages.findIndex(
      (stage) => stage.node === 'Database',
    );
    assert.ok(middlewareIndex > 0 && middlewareIndex < viewIndex);
    assert.match(journey.stages[middlewareIndex].detail, /CsrfViewMiddleware/);
    const preparation = journey.stages.find(
      (stage) => stage.title === 'Validate and prepare',
    );
    if (operation.kind === 'delete') {
      assert.equal(journey.stages[databaseIndex].code, 'book.delete()');
    } else {
      assert.match(preparation.code, /form\.is_valid\(\)/);
      assert.match(preparation.code, /book = form\.save\(commit=False\)/);
      assert.equal(journey.stages[databaseIndex].code, 'book.save()');
      if (operation.kind === 'update') {
        assert.match(preparation.code, /get_object_or_404\(Book, pk=pk\)/);
        assert.match(
          preparation.code,
          /BookForm\(request\.POST, instance=book\)/,
        );
      }
    }
    const redirectIndex = journey.stages.findIndex(
      (stage) => stage.title === '302 Found',
    );
    const followup = journey.stages.slice(redirectIndex + 1);
    assert.ok(
      followup.findIndex((stage) => stage.node === 'Template') <
        followup.findIndex((stage) => stage.node === 'Database'),
    );
  }
});
