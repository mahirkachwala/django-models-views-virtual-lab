import type { Question } from './types';

// Each tuple supplies one correct and three plausible alternatives. Position is
// rotated deterministically, so the bank is stable without an all-A answer key.
type Fact = [string, string, string, string, string, string];
const banks: Fact[][] = [
  [
    ['Which file runs project management commands?', 'manage.py', 'models.py', 'base.html', 'style.css', 'manage.py delegates command handling with project settings.'],
    ['Where is an app registered?', 'INSTALLED_APPS', 'STATIC_URL', 'ROOT_URLCONF alone', 'A template block', 'App registration lets Django discover application models and configuration.'],
    ['What is a Django project?', 'Configuration for a web application', 'Exactly one database row', 'A CSS library', 'An HTTP response only', 'A project combines configuration and one or more apps.'],
    ['What does runserver start?', 'A development HTTP server', 'A production deployment', 'An automatic migration', 'A Python installation', 'runserver is for development and does not replace a production server.'],
    ['What does check primarily do?', 'Run system checks', 'Apply schema changes', 'Create an administrator', 'Style templates', 'check reports configuration/model issues without applying migrations.'],
    ['An app exists but its models are undiscovered. Inspect:', 'INSTALLED_APPS', 'The browser favicon', 'Only STATIC_URL', 'The footer', 'The app must be installed in project settings.'],
  ],
  [
    ['A URLconf maps a path to:', 'A view callable', 'A database column', 'A CSS declaration', 'A migration number', 'Django resolves patterns in order and invokes the matching view.'],
    ['A function view receives which first argument?', 'request', 'response', 'cursor', 'template', 'HttpRequest contains method, path and request data.'],
    ['What does <int:pk> accept?', 'An integer path segment', 'Any arbitrary string', 'Only a query string', 'An HTML element', 'The converter matches integer segments and passes an int to the view.'],
    ['No URL pattern matches. What is returned?', '404', '200', '302', '201', 'Django returns Not Found when resolution fails.'],
    ['What does HttpResponse contain?', 'Response content and metadata', 'Only database rows', 'Only settings', 'Only URL patterns', 'A view can return plain content without a model or template.'],
    ['Why name URL patterns?', 'To reverse URLs without hardcoding paths', 'To create a database index', 'To encrypt HTTP', 'To apply migrations', 'reverse and redirect can resolve route names.'],
  ],
  [
    ['A Django template is mainly responsible for:', 'Presentation', 'Database schema changes', 'Installing Python', 'Session encryption', 'Templates present context supplied by views.'],
    ['Which tag inherits a parent template?', 'extends', 'include_app', 'migrate', 'return', 'extends selects a base; blocks supply replaceable content.'],
    ['How is a context variable displayed?', '{{ book.title }}', '<book.title>', 'print(book.title)', 'models.title()', 'Double braces resolve a context variable.'],
    ['What renders each item in a collection?', 'A for template tag', 'A migration', 'A URL converter', 'A CSRF token', 'Template loops iterate over the supplied iterable.'],
    ['Where does a template get books?', 'The context passed by its view', 'CSS automatically', 'The route name automatically', 'The database without a view', 'The view chooses data and passes it to render.'],
    ['Why use the static tag?', 'Resolve a static asset URL', 'Query all books', 'Validate forms', 'Create migrations', 'Static assets are served separately from dynamic HTML.'],
  ],
  [
    ['A Django model usually represents:', 'A database table', 'A CSS rule', 'An HTTP header', 'A template block', 'Model instances represent rows and fields represent data attributes.'],
    ['Which type suits fixed precision prices?', 'DecimalField', 'BooleanField', 'ForeignKey alone', 'DateTimeField', 'DecimalField defines max_digits and decimal_places.'],
    ['What does makemigrations compare?', 'Models with migration state', 'Models with CSS', 'Only live database rows', 'Only request headers', 'The migration autodetector compares model definitions with historical migration state.'],
    ['Does saving models.py change the database?', 'No; migrations must be applied', 'Yes immediately', 'Only after refreshing HTML', 'Only when logging in', 'Code and database schemas are separate states.'],
    ['What applies a pending migration?', 'migrate', 'runserver', 'shell alone', 'check', 'migrate applies migration operations to the database.'],
    ['A new non-null field on existing rows needs:', 'A value for existing rows or a safe migration strategy', 'A CSS class', 'A route name', 'A template title', 'Existing records cannot satisfy a new required column without a value.'],
  ],
  [
    ['What does filter return?', 'A QuerySet', 'Always one object', 'Always an HTTP response', 'A migration', 'filter can return zero, one or many objects.'],
    ['What does get do with no matching row?', 'Raise DoesNotExist', 'Return an empty QuerySet', 'Create a row', 'Return HTTP 200', 'get expects exactly one row; multiple rows raise MultipleObjectsReturned.'],
    ['What does price__lt=500 mean?', 'Price less than 500', 'Price equal to 500', 'Price is a string', 'Price greater than 500', 'The lt lookup expresses a strict less-than predicate.'],
    ['Changing book.price in Python persists when:', 'save is called', 'The editor is closed', 'The template is styled', 'A GET is sent automatically', 'Assigning an instance attribute alone does not issue an UPDATE.'],
    ['Which operation inserts a row?', 'objects.create', 'objects.all', 'objects.filter', 'objects.get', 'create constructs and saves a model instance.'],
    ['What can delete affect besides the target row?', 'Related rows depending on on_delete', 'All source files', 'All HTTP headers', 'Every table unconditionally', 'CASCADE may delete dependent records, whereas PROTECT prevents deletion.'],
  ],
  [
    ['Which method should submit a state-changing form?', 'POST', 'GET', 'HEAD', 'OPTIONS only', 'GET should be safe; POST carries submitted data for a change.'],
    ['Where is submitted form data available?', 'request.POST', 'request.CSS', 'response.GET', 'models.POST', 'Django exposes form-encoded POST data in request.POST.'],
    ['Before accessing cleaned_data, call:', 'is_valid()', 'makemigrations()', 'runserver()', 'render_static()', 'Validation converts and checks incoming values.'],
    ['What is CSRF protection designed to mitigate?', 'Cross-site request forgery', 'Every SQL error', 'Missing CSS', 'All authorization failures', 'The token helps reject forged unsafe requests; it is not authorization.'],
    ['Why redirect after a successful POST?', 'Avoid accidental resubmission on refresh', 'Hide all server errors', 'Apply a migration', 'Bypass validation', 'POST-redirect-GET returns a new page with a safe GET.'],
    ['An invalid bound form is commonly returned with:', '200 and field errors', 'Always 500', 'Always 201', 'An automatic insert', 'Invalid user input is a normal form response; no row should be inserted.'],
  ],
  [
    ['Many books belong to one author. Use:', 'ForeignKey', 'OneToOneField', 'BooleanField', 'A template block', 'A ForeignKey encodes many-to-one ownership.'],
    ['One profile per author can use:', 'OneToOneField', 'ManyToManyField', 'TextField only', 'DecimalField', 'The relation enforces uniqueness of the related record.'],
    ['Books with multiple categories need:', 'ManyToManyField', 'OneToOneField', 'A unique Boolean', 'No intermediate table', 'A many-to-many relation uses an intermediate table.'],
    ['related_name="books" enables:', 'author.books.all()', 'Book.books.login()', 'author.migrate()', 'books.author.css()', 'related_name defines the reverse relation accessor.'],
    ['on_delete=PROTECT will:', 'Prevent deletion while references exist', 'Always cascade', 'Set every title to null', 'Remove the field definition', 'ProtectedError prevents removing a referenced object.'],
    ['author__name in a query traverses:', 'A model relationship', 'A CSS namespace', 'An HTTP header', 'A migration filename', 'Double underscores can follow relations as well as lookups.'],
  ],
  [
    ['Authentication establishes:', 'Who a user is', 'What every user may do', 'A table schema', 'A CSS theme', 'Authorization separately decides which actions are permitted.'],
    ['login_required restricts a view to:', 'Authenticated users', 'Only administrators automatically', 'Every anonymous visitor', 'Only database models', 'The decorator checks authentication, not staff role.'],
    ['An anonymous request to a protected page commonly gets:', 'A redirect to login', 'A new administrator account', 'Automatic 201', 'A database migration', 'LOGIN_URL and a next parameter guide the login flow.'],
    ['A session connects requests using:', 'A session identifier', 'A template heading', 'A CSS selector', 'A model class name', 'Session state allows authentication to persist across requests.'],
    ['After logout a protected view should:', 'Require authentication again', 'Keep granting access indefinitely', 'Delete all books', 'Disable CSRF', 'Logout removes the current authentication session.'],
    ['Why must passwords not be stored as plain text?', 'A database leak would reveal them directly', 'They cannot contain letters', 'CSS cannot display them', 'URLs require them', 'Real Django authentication uses password hashing; this lab uses demo identities only.'],
  ],
  [
    ['NoReverseMatch usually points to:', 'An unresolved URL name or arguments', 'A missing database column only', 'A CSS syntax error', 'A successful redirect', 'Inspect the named URL and required parameters.'],
    ['TemplateDoesNotExist suggests checking:', 'Template name and configured location', 'Only row counts', 'Only the CSRF token', 'Only the price', 'The requested template must be discoverable.'],
    ['FieldError for writer suggests:', 'An unknown model field or lookup', 'A successful query', 'An expired cookie only', 'A valid template block', 'Inspect the field names and supported lookup path.'],
    ['An IntegrityError may result from:', 'Violating a database constraint', 'A missing heading', 'Every empty QuerySet', 'Every GET request', 'Foreign keys, uniqueness and NOT NULL can enforce integrity.'],
    ['What should you do first with a traceback?', 'Locate the failing operation and relevant source', 'Delete all source files', 'Disable all checks', 'Assume the browser is wrong', 'Use the error type, file, line and request to form a testable diagnosis.'],
    ['A missing migrated column is repaired by:', 'Creating and applying the needed migration', 'Renaming the footer', 'Retrying the same query forever', 'Changing the viewport', 'Verify migration history and schema instead of suppressing the error.'],
  ],
  [
    ['The library list page spans:', 'URL, view, ORM and template', 'CSS alone', 'Migrations alone', 'Authentication only', 'Full stack behavior combines routing, data access and presentation.'],
    ['A reliable CRUD verification includes:', 'Checking persisted state after each operation', 'Only clicking navigation tabs', 'Only reading the aim', 'Only changing a heading', 'Observe insertion, reads, updates and deletion in the database inspector.'],
    ['A detail URL with a nonexistent primary key should:', 'Return 404', 'Create a row silently', 'Always return 200', 'Apply all migrations', 'get_object_or_404 converts a missing object to Not Found.'],
    ['A form should choose fields explicitly to:', 'Limit which model data users can modify', 'Make validation unnecessary', 'Avoid HTTP entirely', 'Disable escaping', 'Explicit fields reduce accidental exposure of sensitive model fields.'],
    ['Before deploying a Django application:', 'Review security, configuration and production serving', 'Use DEBUG=True permanently', 'Expose arbitrary shell execution', 'Publish the secret key', 'A teaching development environment is not a production security configuration.'],
    ['What demonstrates a completed experiment?', 'Verified behavior plus recorded observations', 'Opening every tab', 'Only pressing reset', 'Changing the title alone', 'Evidence should connect code changes to observed system behavior.'],
  ],
];
export function questionBank(id: number, post = false): Question[] {
  const facts = banks[id - 1];
  return facts.map((f, i) => { const answers = f.slice(1, 5); const rotate = (i + (post ? 2 : 0)) % 4; return { prompt: post ? `Apply your observations: ${f[0]}` : f[0], options: [...answers.slice(rotate), ...answers.slice(0, rotate)], answer: (4 - rotate) % 4, explanation: f[5] }; });
}
export function grade(questions: Question[], answers: Record<number, number>) { return { score: questions.reduce((n, q, i) => n + Number(answers[i] === q.answer), 0), total: questions.length, answered: questions.filter((_, i) => Number.isInteger(answers[i])).length }; }
