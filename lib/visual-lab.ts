// Deterministic teaching model: no Python, SQL or host commands are executed.
export const fields = {
  title: {
    label: 'Title',
    type: 'CharField',
    symbol: 'Aa',
    code: 'models.CharField(max_length=200)',
    column: 'title',
  },
  author: {
    label: 'Author',
    type: 'ForeignKey',
    symbol: '↗',
    code: 'models.ForeignKey(Author, on_delete=models.CASCADE)',
    column: 'author_id',
  },
  price: {
    label: 'Price',
    type: 'DecimalField',
    symbol: '₹',
    code: 'models.DecimalField(max_digits=8, decimal_places=2, default=0)',
    column: 'price',
  },
  available: {
    label: 'Available',
    type: 'BooleanField',
    symbol: '✓',
    code: 'models.BooleanField(default=True)',
    column: 'available',
  },
  published: {
    label: 'Published date',
    type: 'DateField',
    symbol: '▦',
    code: 'models.DateField(null=True, blank=True)',
    column: 'published',
  },
} as const;
export type FieldId = keyof typeof fields;
export type Book = {
  id: number;
  title: string;
  author_id: number;
  price?: number;
  available?: boolean;
  published?: string | null;
};
export const authors = [
  { id: 1, name: 'A. Sharma' },
  { id: 2, name: 'R. Mehta' },
];
export const categories = [
  { id: 1, name: 'Python' },
  { id: 2, name: 'Django' },
  { id: 3, name: 'Web' },
];
export type Query = {
  field: 'all' | 'price' | 'title' | 'available';
  operator: 'lt' | 'gt' | 'exact' | 'contains';
  value: string;
};
export type Stage = {
  node: string;
  title: string;
  detail: string;
  code?: string;
  error?: boolean;
};
export type Operation =
  | { kind: 'request'; path: string; debug?: boolean }
  | { kind: 'query'; query: Query }
  | { kind: 'generate' | 'apply' }
  | { kind: 'create' | 'update'; book: Omit<Book, 'id'>; id?: number }
  | { kind: 'delete' | 'read'; id: number };
export type Journey = {
  stages: Stage[];
  index: number;
  playing: boolean;
  operation: Operation;
  committed: boolean;
  status: number;
  path: string;
  method: string;
  result: Book[];
  before: Book[];
  view: string;
  template: string;
  done: boolean;
  error?: string;
  modelSnapshot?: FieldId[];
  schemaBefore?: FieldId[];
};
export type VisualState = {
  version: 3;
  step: number;
  model: FieldId[];
  schema: FieldId[];
  books: Book[];
  nextId: number;
  migrations: { name: string; fields: FieldId[]; applied: boolean }[];
  links: { author: boolean; categories: boolean };
  relationshipLabels?: { author: string; categories: string };
  memberships: { bookId: number; categoryId: number }[];
  query: Query;
  queryIds: number[] | null;
  sql: string;
  orm: string;
  flow: Journey | null;
  evidence: string[];
  observations: string[];
  debug: { scenario: 'route' | 'template'; route: string; template: string };
  selectedAuthor: number | null;
  selectedBook: number | null;
  notice: string;
};
export const steps = [
  {
    title: 'Request journey',
    short: 'Request',
    task: 'Send GET /books/. Follow the packet through Django.',
    hint: [
      'Run the request, or use Step through to advance one stage at a time.',
      'Click a component to inspect its job. Try /books/999/ to locate a missing object.',
    ],
  },
  {
    title: 'Build the Book model',
    short: 'Model',
    task: 'The library needs a price. Add it to the Book model.',
    hint: [
      'Click a field card to add it. The matching Django type is shown on the card.',
      'Adding price changes the model, not the database. Compare the two cards.',
    ],
  },
  {
    title: 'Bring the database up to date',
    short: 'Migration',
    task: 'Turn your model change into a migration, then apply it.',
    hint: [
      'Generate records the difference between the model and migration history.',
      'Apply updates the database. Existing books receive the field default of 0.',
    ],
  },
  {
    title: 'Find books with the ORM',
    short: 'ORM',
    task: 'Find books under ₹700. Watch which rows match.',
    hint: [
      'Import the example price catalogue to put different prices in the new column.',
      'Choose price, less than, and 700. The ORM expression and conceptual SQL update together.',
    ],
  },
  {
    title: 'Run your library',
    short: 'Library',
    task: 'Add a book, open it, change its price, then delete it.',
    hint: [
      'Use the miniature Library website. Changes appear in the database only at the database stage.',
      'After saving, the 302 response leads to a GET list. Open a book title to read its detail.',
    ],
  },
  {
    title: 'Connect the records',
    short: 'Relations',
    task: 'Connect Author to Book and Book to Category. Explore the linked records.',
    hint: [
      'Select an endpoint, then choose the other entity. The existing author_id belongs to a many-to-one relation.',
      'Use 1 → many for Author–Book and many ↔ many for Book–Category. Then select an author and tag a book.',
    ],
  },
  {
    title: 'Find the broken connection',
    short: 'Debug',
    task: 'Send the failing request. Repair the red component and try again.',
    hint: [
      'The requested URL is /books/ but the configured route is /book/.',
      'For the second challenge, compare the template name to catalog/book_list.html.',
    ],
  },
  {
    title: 'Your Django journey',
    short: 'Finish',
    task: 'Review the system you explored, then continue to the Posttest.',
    hint: [
      'Incomplete steps remain available in the journey rail.',
      'Completion is based on observed operations, not opening pages.',
    ],
  },
];
export function initialState(): VisualState {
  return {
    version: 3,
    step: 0,
    model: ['title', 'author'],
    schema: ['title', 'author'],
    books: [
      { id: 1, title: 'Django Basics', author_id: 1 },
      { id: 2, title: 'Web Development', author_id: 2 },
      { id: 3, title: 'Django Models', author_id: 1 },
    ],
    nextId: 4,
    migrations: [
      { name: '0001_initial', fields: ['title', 'author'], applied: true },
    ],
    links: { author: false, categories: false },
    memberships: [],
    query: { field: 'price', operator: 'lt', value: '700' },
    queryIds: null,
    sql: '',
    orm: '',
    flow: null,
    evidence: [],
    observations: [],
    debug: {
      scenario: 'route',
      route: '/book/',
      template: 'catalog/missing.html',
    },
    selectedAuthor: null,
    selectedBook: null,
    notice: 'Ready. Send a request to see Django in motion.',
  };
}
const stage = (
  node: string,
  title: string,
  detail: string,
  code?: string,
  error = false,
): Stage => ({ node, title, detail, code, error });
const mark = (s: VisualState, evidence: string, observation?: string) => {
  if (!s.evidence.includes(evidence)) s.evidence.push(evidence);
  if (observation && !s.observations.includes(observation))
    s.observations.push(observation);
};
export function queryBooks(s: VisualState, q: Query) {
  const operators: Record<Query['field'], string[]> = {
    all: ['exact'],
    price: ['lt', 'gt', 'exact'],
    title: ['exact', 'contains'],
    available: ['exact'],
  };
  if (!operators[q.field]?.includes(q.operator))
    throw new Error('Choose a condition supported by this field.');
  if (q.field !== 'all' && !s.schema.includes(q.field))
    throw new Error(
      `The database has no ${q.field} column. Apply the model migration first.`,
    );
  if (
    q.field === 'price' &&
    (!q.value.trim() || !Number.isFinite(Number(q.value)))
  )
    throw new Error('Enter a finite price, such as 700.');
  if (
    q.field === 'available' &&
    !['true', 'false'].includes(q.value.toLowerCase())
  )
    throw new Error('Use true or false for availability.');
  const result = s.books.filter((b) => {
    if (q.field === 'all') return true;
    const v = b[q.field];
    if (q.field === 'price')
      return q.operator === 'lt'
        ? Number(v) < Number(q.value)
        : q.operator === 'gt'
          ? Number(v) > Number(q.value)
          : Number(v) === Number(q.value);
    if (q.field === 'available')
      return v === (q.value.toLowerCase() === 'true');
    return q.operator === 'contains'
      ? String(v).toLowerCase().includes(q.value.toLowerCase())
      : v === q.value;
  });
  const val =
    q.field === 'price'
      ? q.value
      : q.field === 'available'
        ? q.value.toLowerCase() === 'true'
          ? 'True'
          : 'False'
        : JSON.stringify(q.value);
  const lookup =
    q.operator === 'exact'
      ? q.field
      : `${q.field}__${q.operator === 'contains' ? 'icontains' : q.operator}`;
  const orm =
    q.field === 'all'
      ? 'Book.objects.all()'
      : `Book.objects.filter(${lookup}=${val})`;
  const escaped = q.value.replaceAll("'", "''");
  const escapedLike = escaped
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
  const predicate =
    q.field === 'all'
      ? ''
      : q.field === 'price'
        ? ` WHERE price ${q.operator === 'lt' ? '<' : q.operator === 'gt' ? '>' : '='} ${Number(q.value)}`
        : q.field === 'available'
          ? ` WHERE available = ${q.value.toLowerCase() === 'true' ? 1 : 0}`
          : ` WHERE title ${q.operator === 'contains' ? `LIKE '%${escapedLike}%' ESCAPE '\\'` : `= '${escaped}'`}`;
  return { result, orm, sql: `SELECT * FROM catalog_book${predicate};` };
}
export function plan(s: VisualState, operation: Operation): Journey {
  let stages: Stage[] = [];
  let status = 200;
  let result: Book[] = [];
  let path = '/books/';
  let method = 'GET';
  let view = 'book_list';
  let template = 'catalog/book_list.html';
  let error: string | undefined;
  if (operation.kind === 'generate' || operation.kind === 'apply') {
    stages =
      operation.kind === 'generate'
        ? [
            stage(
              'Model',
              'Compare definitions',
              'The saved model is compared with the latest migration snapshot.',
            ),
            stage(
              'Migration',
              'Write migration',
              'Added and removed fields enter the new migration.',
              'python manage.py makemigrations',
            ),
          ]
        : [
            stage(
              'Migration',
              'Read pending operations',
              'Django reads the recorded schema changes.',
            ),
            stage(
              'Database',
              'Apply schema',
              'Columns are added or removed; existing rows receive defaults for new fields.',
              'python manage.py migrate',
            ),
            stage(
              'Response',
              'Schema synchronized',
              'The migration is now applied.',
            ),
          ];
  } else if (operation.kind === 'query') {
    const q = queryBooks(s, operation.query);
    result = q.result;
    stages = [
      stage(
        'Model',
        'Build lazy QuerySet',
        'The ORM builds a query description. Creating this QuerySet does not read the database.',
        `books = ${q.orm}`,
      ),
      stage(
        'SQL',
        'Evaluate QuerySet',
        'Reading the results, for example by iterating books, evaluates the QuerySet and compiles a parameterized SQL query. SQL shown here is conceptual.',
        q.sql,
      ),
      stage(
        'Database',
        'Match records',
        `${result.length} of ${s.books.length} books match.`,
      ),
      stage(
        'QuerySet',
        'Return results',
        `${result.length} model instance${result.length === 1 ? '' : 's'} in the result.`,
      ),
    ];
  } else {
    const write = ['create', 'update', 'delete'].includes(operation.kind);
    if (operation.kind === 'request') path = operation.path;
    else if (operation.kind === 'create') path = '/books/create/';
    else if ('id' in operation)
      path = `/books/${operation.id}/${operation.kind === 'update' ? 'edit/' : operation.kind === 'delete' ? 'delete/' : ''}`;
    method = write ? 'POST' : 'GET';
    stages = [
      stage(
        'Browser',
        'Request sent',
        `${method} ${path}`,
        `${method} ${path} HTTP/1.1`,
      ),
    ];
    const debug = operation.kind === 'request' && operation.debug;
    const detail = /^\/books\/(\d+)\/$/.exec(path);
    const writeRoute = write
      ? /^\/books\/(\d+)\/(edit|delete)\/$/.exec(path)
      : null;
    const pk = detail?.[1] ?? writeRoute?.[1];
    const matched =
      path === '/books/' ||
      path === '/books/create/' ||
      !!detail ||
      !!writeRoute;
    if (
      !matched ||
      (debug && s.debug.scenario === 'route' && s.debug.route !== path)
    ) {
      status = 404;
      error = 'URL pattern not found';
      stages.push(
        stage(
          'URLconf',
          'No matching route',
          `The request ${path} does not match ${debug ? s.debug.route : 'a configured path'}.`,
          'urlpatterns = [path("books/", views.book_list, name="book_list")]',
          true,
        ),
      );
    } else {
      view = write
        ? `book_${operation.kind}`
        : detail
          ? 'book_detail'
          : path.endsWith('create/')
            ? 'book_create'
            : 'book_list';
      template = detail
        ? 'catalog/book_detail.html'
        : path.endsWith('create/')
          ? 'catalog/book_form.html'
          : 'catalog/book_list.html';
      const route = pk
        ? `books/<int:pk>/${writeRoute ? `${writeRoute[2]}/` : ''}`
        : path.slice(1);
      stages.push(
        stage(
          'URLconf',
          'URL matched',
          `${path} → ${view}`,
          `path("${route}", views.${view}, name="${view}")`,
        ),
      );
      if (write)
        stages.push(
          stage(
            'Middleware',
            'CSRF protection',
            'In a standard Django app, CsrfViewMiddleware checks the POST token before the view runs. This journey assumes the check succeeds.',
            'django.middleware.csrf.CsrfViewMiddleware',
          ),
        );
      stages.push(
        stage(
          'View',
          'View called',
          `${view}(request${pk ? `, pk=${pk}` : ''})`,
          `def ${view}(request${pk ? ', pk' : ''}):`,
        ),
      );
      if (write) {
        stages.push(
          stage(
            'Model',
            'Validate and prepare',
            operation.kind === 'delete'
              ? 'The view retrieves the selected record before deleting it.'
              : 'The view validates a BookForm for the book fields and author; category links are managed separately. Invalid forms return errors. This valid branch prepares an instance without writing it.',
            operation.kind === 'delete'
              ? 'book = get_object_or_404(Book, pk=pk)'
              : `# BookForm excludes categories, which are managed separately.\n${operation.kind === 'update' ? 'book = get_object_or_404(Book, pk=pk)\nform = BookForm(request.POST, instance=book)' : 'form = BookForm(request.POST)'}\nif form.is_valid():\n    book = form.save(commit=False)`,
          ),
          stage(
            'Database',
            `${operation.kind === 'create' ? 'INSERT' : operation.kind === 'update' ? 'UPDATE' : 'DELETE'} record`,
            'The database changes at this stage.',
            operation.kind === 'delete' ? 'book.delete()' : 'book.save()',
          ),
          stage(
            'Response',
            '302 Found',
            'Redirect to /books/. Refresh will not resubmit the POST.',
            'return redirect("book_list")',
          ),
          stage(
            'Browser',
            'Follow redirect',
            'GET /books/ starts a new request.',
          ),
          stage('URLconf', 'List URL matched', '/books/ → book_list'),
          stage('View', 'Read updated collection', 'book_list(request)'),
          stage(
            'Model',
            'Build lazy QuerySet',
            'Book.objects.all() describes the query without executing it.',
            'books = Book.objects.all()',
          ),
          stage(
            'View',
            'Build context',
            'The view passes the lazy QuerySet to the template.',
            'return render(request, "catalog/book_list.html", {"books": books})',
          ),
          stage(
            'Template',
            'Iterate books',
            'The template loop requests the records and triggers QuerySet evaluation.',
            '{% for book in books %}\n  <li>{{ book.title }}</li>\n{% endfor %}',
          ),
          stage(
            'Database',
            'Read current rows',
            'The evaluated QuerySet reads the updated records for the template.',
            'SELECT * FROM catalog_book;',
          ),
          stage('Response', '200 OK', 'text/html'),
          stage(
            'Browser',
            'Display updated library',
            'The browser shows the saved state.',
          ),
        );
      } else if (path === '/books/create/') {
        stages.push(
          stage(
            'Template',
            'Render unbound form',
            'The unbound form does not read or write a Book record. This simplified preview omits loading database-backed author choices.',
            'return render(request, "catalog/book_form.html", {"form": BookForm()})',
          ),
          stage('Response', '200 OK', 'text/html'),
          stage(
            'Browser',
            'Display form',
            'A POST will submit the form. Open the Library step to create a book.',
          ),
        );
      } else {
        result = detail
          ? s.books.filter((b) => b.id === Number(detail[1]))
          : s.books;
        stages.push(
          stage(
            'Model',
            detail ? 'Retrieve one object' : 'Build lazy QuerySet',
            detail
              ? `get_object_or_404(Book, pk=${detail[1]}) retrieves one object immediately or raises Http404.`
              : 'Book.objects.all() builds a lazy QuerySet. No database read happens until its results are needed.',
            detail
              ? `book = get_object_or_404(Book, pk=${detail[1]})`
              : 'books = Book.objects.all()',
          ),
        );
        if (detail && !result.length) {
          status = 404;
          error = 'Book does not exist';
          stages.push(
            stage(
              'Database',
              'No record found',
              `There is no Book with id ${detail[1]}. get_object_or_404 converts the missing object to HTTP 404.`,
              `SELECT * FROM catalog_book WHERE id = ${detail[1]};`,
              true,
            ),
          );
        } else {
          if (detail)
            stages.push(
              stage(
                'Database',
                'Read records',
                'The object lookup reads the selected book before rendering.',
                `SELECT * FROM catalog_book WHERE id = ${detail[1]};`,
              ),
            );
          stages.push(
            stage(
              'View',
              'Build context',
              detail
                ? '{"book": book}'
                : 'The context {"books": books} contains the lazy QuerySet, ready for the template.',
              detail
                ? 'return render(request, "catalog/book_detail.html", {"book": book})'
                : 'return render(request, "catalog/book_list.html", {"books": books})',
            ),
          );
          if (
            debug &&
            s.debug.scenario === 'template' &&
            s.debug.template !== 'catalog/book_list.html'
          ) {
            status = 500;
            error = 'TemplateDoesNotExist';
            stages.push(
              stage(
                'Template',
                'Template missing',
                s.debug.template,
                `render(request, "${s.debug.template}", context)`,
                true,
              ),
            );
          } else {
            stages.push(
              stage(
                'Template',
                detail ? 'Render HTML' : 'Iterate books',
                detail
                  ? template
                  : 'The template loop requests the books. Iterating the QuerySet triggers the database read during rendering.',
                detail
                  ? '<h1>{{ book.title }}</h1>'
                  : '{% for book in books %}\n  <li>{{ book.title }}</li>\n{% endfor %}',
              ),
            );
            if (!detail)
              stages.push(
                stage(
                  'Database',
                  'Evaluate QuerySet and read records',
                  `${result.length} books are returned to the template loop. Rendering then completes the HTML response.`,
                  'SELECT * FROM catalog_book;',
                ),
              );
            stages.push(
              stage('Response', '200 OK', 'Content-Type: text/html'),
              stage(
                'Browser',
                'Display response',
                'The returned HTML becomes the library page.',
              ),
            );
          }
        }
      }
    }
  }
  return {
    stages,
    index: -1,
    playing: false,
    operation,
    committed: false,
    status,
    path,
    method,
    result,
    before: structuredClone(s.books),
    view,
    template,
    done: false,
    error,
    modelSnapshot: [...s.model],
    schemaBefore: [...s.schema],
  };
}
export type Action =
  | { type: 'step'; step: number }
  | { type: 'field'; field: FieldId }
  | { type: 'removeField'; field: FieldId }
  | { type: 'perform'; operation: Operation }
  | { type: 'unlink'; relation: 'author' | 'categories' }
  | {
      type: 'relationshipLabel';
      relation: 'author' | 'categories';
      label: string;
    }
  | { type: 'start'; operation: Operation; play?: boolean }
  | { type: 'advance' }
  | { type: 'pause' | 'resume' }
  | { type: 'prices' }
  | { type: 'link'; from: string; to: string; cardinality: string }
  | { type: 'author'; id: number }
  | { type: 'selectBook'; id: number }
  | { type: 'tag'; bookId: number; categoryId: number }
  | { type: 'debug'; scenario: 'route' | 'template' }
  | { type: 'fix'; value: string }
  | { type: 'reset' }
  | { type: 'notice'; text: string };
function commit(s: VisualState, op: Operation) {
  if (op.kind === 'generate') {
    const snapshot = s.flow?.modelSnapshot ?? s.model;
    const added = snapshot.filter(
      (f) => !s.migrations.at(-1)!.fields.includes(f),
    );
    const removed = s.migrations
      .at(-1)!
      .fields.filter((f) => !snapshot.includes(f));
    if (!added.length && !removed.length) return;
    const name = `${String(s.migrations.length + 1).padStart(4, '0')}_book_${added.length ? added.join('_') : `remove_${removed.join('_')}`}`;
    s.migrations.push({ name, fields: [...snapshot], applied: false });
    mark(
      s,
      'generated',
      `${name} records ${[...added.map((f) => `add ${f}`), ...removed.map((f) => `remove ${f}`)].join(', ')}; the database remains unchanged.`,
    );
  } else if (op.kind === 'apply') {
    for (const m of s.migrations.filter((m) => !m.applied)) {
      s.schema = [...m.fields];
      m.applied = true;
      s.books = s.books.map((b) => ({
        ...b,
        ...(s.schema.includes('price') && b.price === undefined
          ? { price: 0 }
          : {}),
        ...(s.schema.includes('available') && b.available === undefined
          ? { available: true }
          : {}),
        ...(s.schema.includes('published') && b.published === undefined
          ? { published: null }
          : {}),
      }));
      for (const book of s.books) {
        if (!s.schema.includes('price')) delete book.price;
        if (!s.schema.includes('available')) delete book.available;
        if (!s.schema.includes('published')) delete book.published;
      }
    }
    s.queryIds = null;
    if (s.schema.includes('price'))
      mark(
        s,
        'migrated',
        'The recorded model changes were applied to the database. New price columns start at 0.',
      );
  } else if (op.kind === 'query') {
    const q = queryBooks(s, op.query);
    s.query = op.query;
    s.queryIds = q.result.map((b) => b.id);
    s.sql = q.sql;
    s.orm = q.orm;
    mark(
      s,
      'queried',
      `${q.orm} returned ${q.result.length} of ${s.books.length} books.`,
    );
    if (
      op.query.field === 'price' &&
      op.query.operator === 'lt' &&
      Number(op.query.value) === 700
    )
      mark(s, 'filtered');
  } else if (op.kind === 'create') {
    const book = {
      ...op.book,
      id: s.nextId++,
      ...(s.schema.includes('available')
        ? { available: op.book.available ?? true }
        : {}),
      ...(s.schema.includes('published')
        ? { published: op.book.published ?? null }
        : {}),
    };
    s.books.push(book);
    s.selectedBook = book.id;
    mark(s, 'created', `INSERT added “${book.title}” (id ${book.id}).`);
  } else if (op.kind === 'update') {
    s.books = s.books.map((b) => (b.id === op.id ? { ...b, ...op.book } : b));
    s.selectedBook = op.id ?? null;
    mark(s, 'updated', `UPDATE persisted the edits to book ${op.id}.`);
  } else if (op.kind === 'delete') {
    s.books = s.books.filter((b) => b.id !== op.id);
    s.memberships = s.memberships.filter((m) => m.bookId !== op.id);
    s.selectedBook = null;
    mark(s, 'deleted', `DELETE removed book ${op.id} and its category links.`);
  } else if (op.kind === 'read') {
    s.selectedBook = op.id;
    mark(s, 'read', `SELECT retrieved book ${op.id} without changing any row.`);
  }
  if (['create', 'update', 'delete'].includes(op.kind)) s.queryIds = null;
}
export function reduce(state: VisualState, action: Action): VisualState {
  if (action.type === 'reset') return initialState();
  if (action.type === 'perform') {
    let next = reduce(state, { type: 'start', operation: action.operation });
    // Invalid operations leave the existing flow in place; do not advance it.
    if (next.flow?.operation !== action.operation) return next;
    for (let i = 0; i < 30 && next.flow && !next.flow.done; i++)
      next = reduce(next, { type: 'advance' });
    return next;
  }
  const s: VisualState = structuredClone(state);
  if (action.type === 'step') {
    s.step = Math.max(0, Math.min(7, action.step));
    if (s.flow) s.flow.playing = false;
    s.notice = steps[s.step].task;
    return s;
  }
  if (action.type === 'notice') {
    s.notice = action.text;
    return s;
  }
  if (action.type === 'removeField') {
    if (action.field === 'title' || action.field === 'author') {
      s.notice = 'Title and Author are required for this library exercise.';
      return s;
    }
    s.model = s.model.filter((f) => f !== action.field);
    s.notice = `${fields[action.field].label} removed from the model. Apply a new migration to remove its database column.`;
    return s;
  }
  if (action.type === 'unlink') {
    s.links[action.relation] = false;
    if (action.relation === 'categories') s.memberships = [];
    s.notice =
      'Relationship removed. Draw the diagram again to see the change.';
    return s;
  }
  if (action.type === 'relationshipLabel') {
    s.relationshipLabels ??= { author: 'writes', categories: 'belongs to' };
    s.relationshipLabels[action.relation] = action.label.trim().slice(0, 40);
    return s;
  }
  if (action.type === 'field') {
    if (!s.model.includes(action.field)) {
      s.model.push(action.field);
      s.notice = `${fields[action.field].label} entered the model. The database is unchanged.`;
      if (action.field === 'price')
        mark(
          s,
          'model',
          'The model gained DecimalField price; no database column appeared yet.',
        );
    }
    return s;
  }
  if (action.type === 'pause') {
    if (s.flow) s.flow.playing = false;
    return s;
  }
  if (action.type === 'resume') {
    if (s.flow && !s.flow.done) s.flow.playing = true;
    return s;
  }
  if (action.type === 'start') {
    const op = action.operation;
    if (
      s.flow &&
      !s.flow.done &&
      s.flow.committed &&
      ['create', 'update', 'delete'].includes(s.flow.operation.kind)
    ) {
      s.notice =
        'Finish the current response before starting another operation.';
      return s;
    }
    try {
      if (
        op.kind === 'generate' &&
        !s.model.some((f) => !s.migrations.at(-1)!.fields.includes(f)) &&
        !s.migrations.at(-1)!.fields.some((f) => !s.model.includes(f))
      )
        throw new Error(
          'No model changes to record. Add Price in the Model step.',
        );
      if (op.kind === 'apply' && !s.migrations.some((m) => !m.applied))
        throw new Error(
          'There are no pending migrations. Generate one from your model change first.',
        );
      if (op.kind === 'create' || op.kind === 'update') {
        if (!s.schema.includes('price'))
          throw new Error(
            'Price is missing from the database. Apply the migration first.',
          );
        if (!op.book.title.trim() || op.book.title.length > 200)
          throw new Error(
            'Title must contain 1–200 characters. No row was changed.',
          );
        if (
          op.book.price === undefined ||
          !Number.isFinite(op.book.price) ||
          op.book.price < 0 ||
          op.book.price > 999999.99
        )
          throw new Error(
            'Price must be between 0 and 999999.99. No row was changed.',
          );
        if (!authors.some((a) => a.id === op.book.author_id))
          throw new Error('Select an existing author.');
        op.book.price = Math.round(op.book.price * 100) / 100;
      }
      if (
        ['update', 'delete', 'read'].includes(op.kind) &&
        'id' in op &&
        !s.books.some((b) => b.id === op.id)
      )
        throw new Error(
          'That book no longer exists. Refresh the Library list.',
        );
      s.flow = plan(s, op);
      s.flow.index = 0;
      s.flow.playing = action.play ?? true;
      s.notice = s.flow.stages[0].detail;
    } catch (e) {
      s.notice =
        e instanceof Error ? e.message : 'The action could not be performed.';
    }
    return s;
  }
  if (action.type === 'advance' && s.flow && !s.flow.done) {
    const f = s.flow;
    f.index = Math.min(f.index + 1, f.stages.length - 1);
    const current = f.stages[f.index];
    s.notice = current.detail;
    const commitNode =
      f.operation.kind === 'generate' ? 'Migration' : 'Database';
    if (!f.committed && current.node === commitNode && !current.error) {
      commit(s, f.operation);
      f.committed = true;
    }
    if (current.error || f.index === f.stages.length - 1) {
      f.done = true;
      f.playing = false;
      if (f.operation.kind === 'request') {
        if (f.status === 200 && f.path === '/books/')
          mark(
            s,
            'request',
            'GET /books/ passed through URLconf and a view. The template evaluated the lazy QuerySet, read the database and produced a 200 response.',
          );
        if (f.operation.debug) {
          const scenario = s.debug.scenario;
          if (f.error) mark(s, `saw-${scenario}`);
          else if (s.evidence.includes(`saw-${scenario}`))
            mark(
              s,
              `fixed-${scenario}`,
              `The ${scenario} failure was repaired and the request returned 200.`,
            );
        }
      }
    }
    return s;
  }
  if (action.type === 'prices') {
    if (!s.schema.includes('price')) {
      s.notice = 'Apply the price migration first.';
      return s;
    }
    s.books = s.books.map((b) => ({
      ...b,
      price: b.id === 1 ? 500 : b.id === 2 ? 750 : b.id === 3 ? 650 : b.price,
    }));
    s.queryIds = null;
    mark(
      s,
      'prices',
      'A separate data import assigned example prices 500, 750 and 650; migration defaults and business data are different.',
    );
    s.notice =
      'Price catalogue imported: ₹500, ₹750 and ₹650. Existing custom books were preserved.';
    return s;
  }
  if (action.type === 'link') {
    if (
      action.from === 'Author' &&
      action.to === 'Book' &&
      action.cardinality === '1:*'
    ) {
      s.links.author = true;
      mark(
        s,
        'authorLink',
        'Author 1 → many Book is represented by Book.author_id.',
      );
      s.notice = 'Connected. Many books can reference the same author.';
    } else if (
      action.from === 'Book' &&
      action.to === 'Category' &&
      action.cardinality === '*:*'
    ) {
      s.links.categories = true;
      mark(
        s,
        'categoryLink',
        'Book ↔ Category uses an intermediate table of record pairs.',
      );
      s.notice =
        'Connected. Tag a book to see the intermediate table populate.';
    } else
      s.notice = `${action.from} → ${action.to}: that cardinality does not match this library. One author writes many books; books can have many categories.`;
    return s;
  }
  if (action.type === 'author') {
    s.selectedAuthor = action.id;
    s.notice = `${authors.find((a) => a.id === action.id)?.name ?? 'Author'} is referenced by ${s.books.filter((b) => b.author_id === action.id).length} books. The book rows store author_id, not a copy of the author.`;
    if (s.links.author && authors.some((a) => a.id === action.id))
      mark(s, 'authorExplored');
    return s;
  }
  if (action.type === 'selectBook') {
    s.selectedBook = action.id;
    return s;
  }
  if (
    action.type === 'tag' &&
    s.links.categories &&
    s.books.some((b) => b.id === action.bookId) &&
    categories.some((c) => c.id === action.categoryId)
  ) {
    const present = s.memberships.some(
      (m) => m.bookId === action.bookId && m.categoryId === action.categoryId,
    );
    s.memberships = present
      ? s.memberships.filter(
          (m) =>
            !(m.bookId === action.bookId && m.categoryId === action.categoryId),
        )
      : [
          ...s.memberships,
          { bookId: action.bookId, categoryId: action.categoryId },
        ];
    if (!present)
      mark(
        s,
        'tagged',
        'Adding a category inserted a (book_id, category_id) pair into the join table.',
      );
    s.notice = `${present ? 'Removed' : 'Added'} pair (${action.bookId}, ${action.categoryId}) in book_categories. The Book and Category records themselves are unchanged.`;
    return s;
  }
  if (action.type === 'debug') {
    s.debug.scenario = action.scenario;
    s.flow = null;
    return s;
  }
  if (action.type === 'fix') {
    s.debug[s.debug.scenario] = action.value.trim();
    s.notice =
      'Configuration changed. Send the request again to verify the repair.';
    return s;
  }
  return s;
}
export function completed(s: VisualState): boolean[] {
  const has = (...es: string[]) => es.every((e) => s.evidence.includes(e));
  return [
    has('request'),
    s.model.includes('price'),
    has('migrated') &&
      s.model.length === s.schema.length &&
      s.model.every((f) => s.schema.includes(f)) &&
      s.migrations.every((m) => m.applied),
    has('filtered'),
    has('created', 'read', 'updated', 'deleted'),
    has('authorLink', 'categoryLink', 'authorExplored', 'tagged'),
    has('fixed-route', 'fixed-template'),
  ];
}
export const storageKey = 'django-visual-journey-v3';
export function serialize(s: VisualState) {
  return JSON.stringify({
    ...s,
    flow: s.flow ? { ...s.flow, playing: false } : null,
  });
}
export function restore(raw: string | null): VisualState {
  try {
    const s = JSON.parse(raw || 'null') as VisualState;
    if (
      !s ||
      s.version !== 3 ||
      !Array.isArray(s.books) ||
      !Array.isArray(s.model) ||
      !Array.isArray(s.schema) ||
      !Array.isArray(s.migrations) ||
      !s.migrations.length ||
      !Array.isArray(s.evidence) ||
      !Array.isArray(s.observations) ||
      !Array.isArray(s.memberships) ||
      !s.links ||
      !s.debug ||
      !s.query
    )
      return initialState();
    if (
      ![
        ...s.model,
        ...s.schema,
        ...s.migrations.flatMap((m) => m.fields),
      ].every((f) => f in fields) ||
      !s.books.every(
        (b) =>
          typeof b.title === 'string' &&
          Number.isInteger(b.id) &&
          Number.isInteger(b.author_id),
      ) ||
      !Number.isInteger(s.step) ||
      s.step < 0 ||
      s.step > 7 ||
      !Number.isInteger(s.nextId)
    )
      return initialState();
    if (
      s.flow &&
      (!Array.isArray(s.flow.stages) ||
        !s.flow.stages.length ||
        !Number.isInteger(s.flow.index))
    )
      s.flow = null;
    if (s.flow) s.flow.playing = false;
    return s;
  } catch {
    return initialState();
  }
}
export function generatedCode(s: VisualState) {
  return (
    'class Book(models.Model):\n' +
    s.model.map((f) => `    ${f} = ${fields[f].code}`).join('\n') +
    (s.links.categories
      ? '\n    categories = models.ManyToManyField(Category)'
      : '')
  );
}
