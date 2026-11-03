export type Question = {
  difficulty: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};
export const questions: Record<'pre' | 'post', Question[]> = {
  pre: [
    {
      difficulty: 'Beginner',
      question: 'What is a Django model?',
      options: [
        'A page style sheet',
        'A representation of stored application data',
        'A browser extension',
        'An HTTP status code',
      ],
      answer: 1,
      explanation:
        'A Django model defines the structure and behavior of application data stored in a database.',
    },
    {
      difficulty: 'Beginner',
      question:
        'Which Django component receives an HTTP request and returns a response?',
      options: ['View', 'Model field', 'Migration file', 'Database column'],
      answer: 0,
      explanation:
        'A view receives the request, performs the required processing, and returns an HTTP response.',
    },
    {
      difficulty: 'Intermediate',
      question: 'What does ORM stand for?',
      options: [
        'Object Request Method',
        'Online Record Manager',
        'Object-Relational Mapper',
        'Ordered Response Model',
      ],
      answer: 2,
      explanation:
        'Django uses an Object-Relational Mapper to translate model operations into database queries.',
    },
    {
      difficulty: 'Intermediate',
      question:
        'A Django model generally corresponds to which database structure?',
      options: ['A network port', 'A table', 'A stylesheet', 'A browser tab'],
      answer: 1,
      explanation:
        'A model generally maps to a table, with model fields represented by columns.',
    },
    {
      difficulty: 'Advanced',
      question: 'What is the purpose of a Django view?',
      options: [
        'To process a request and prepare a response',
        'To replace the database engine',
        'To assign CSS colors',
        'To install Python',
      ],
      answer: 0,
      explanation:
        'The view coordinates request handling, data access, template rendering and the response.',
    },
    {
      difficulty: 'Advanced',
      question: 'What is a Django template used for?',
      options: [
        'Applying database migrations',
        'Choosing a URL pattern',
        'Presenting context data as rendered content',
        'Creating primary keys',
      ],
      answer: 2,
      explanation:
        'A template presents data supplied by the view, commonly as HTML returned to the browser.',
    },
  ],
  post: [
    {
      difficulty: 'Applied',
      question:
        'Which Book field type best represents a price with two decimal places?',
      options: ['Boolean', 'Date', 'Decimal', 'Foreign Key'],
      answer: 2,
      explanation:
        'A decimal field represents fixed-precision numeric values such as prices.',
    },
    {
      difficulty: 'Applied',
      question:
        'A visual ORM filter selects Price < ₹700. What should the database return?',
      options: [
        'Every record',
        'Only records whose stored price is below 700',
        'Only the newest record',
        'A template name',
      ],
      answer: 1,
      explanation:
        'The ORM translates the selected condition into a database query and returns matching Book records.',
    },
    {
      difficulty: 'Applied',
      question: 'Why is a migration needed after adding the price field?',
      options: [
        'To update the database schema in a controlled, recorded sequence',
        'To change the browser URL',
        'To calculate quiz marks',
        'To choose a template color',
      ],
      answer: 0,
      explanation:
        'A migration records the schema change and applies it to the database in a reproducible way.',
    },
    {
      difficulty: 'Applied',
      question:
        'When the all-books template iterates a lazy QuerySet, what is the request flow?',
      options: [
        'Browser → Database only',
        'URL → View builds QuerySet/context → Template iterates → Database query → HTML response',
        'Template → URL → Browser only',
        'Model → CSS → Database',
      ],
      answer: 1,
      explanation:
        'The view builds a lazy QuerySet and passes it as context. Iteration in this template evaluates the query; render() returns the resulting HTML response. A detail view using get_object_or_404() queries earlier in the view.',
    },
    {
      difficulty: 'Applied',
      question: 'What does a function-based view represent?',
      options: [
        'A Python function that receives a request and returns a response',
        'A database column',
        'A browser cookie only',
        'A migration file',
      ],
      answer: 0,
      explanation:
        'A function-based view expresses request handling directly in a Python callable.',
    },
    {
      difficulty: 'Applied',
      question: 'What does dispatch do in a class-based view?',
      options: [
        'Deletes the model',
        'Selects the handler for the HTTP method',
        'Builds a database table',
        'Styles the response',
      ],
      answer: 1,
      explanation:
        'The class-based view dispatch process selects a method handler such as get() or post().',
    },
    {
      difficulty: 'Applied',
      question: 'Which operation changes an existing book’s price?',
      options: ['Create', 'Read', 'Update', 'Delete'],
      answer: 2,
      explanation:
        'Update changes one or more stored fields on an existing record.',
    },
    {
      difficulty: 'Applied',
      question:
        'Book has a Foreign Key to Author. What relationship does this commonly represent?',
      options: [
        'One author can relate to many books',
        'Every book has many databases',
        'One URL has one browser',
        'A price has many authors',
      ],
      answer: 0,
      explanation:
        'Many Book records can reference one Author record, forming a one-to-many relationship.',
    },
    {
      difficulty: 'Applied',
      question: 'What does the template receive from the view?',
      options: [
        'A context containing prepared data',
        'A migration command',
        'The raw browser installation',
        'A new programming language',
      ],
      answer: 0,
      explanation:
        'The view supplies context data that the template formats into the response body.',
    },
    {
      difficulty: 'Applied',
      question:
        'A request asks for Book ID 999, which does not exist. Which status is appropriate?',
      options: [
        '201 Created',
        '200 OK with invented data',
        '404 Not Found',
        '301 Permanent Redirect',
      ],
      answer: 2,
      explanation:
        'A missing requested resource should produce a 404 response.',
    },
    {
      difficulty: 'Applied',
      question: 'A POST omits a required title. What should happen?',
      options: [
        'The server invents a title',
        'Validation rejects the record with a clear error',
        'The database is reset',
        'The request becomes GET',
      ],
      answer: 1,
      explanation:
        'Server-side validation must reject incomplete required data and preserve database integrity.',
    },
  ],
};
