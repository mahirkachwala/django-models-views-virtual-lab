'use client';

import { useEffect } from 'react';
import { completeSection } from '@/lib/lab-progress';

export function Theory() {
  useEffect(() => completeSection('Theory'), []);
  return (
    <div className="lesson theory-page">
      <h2>Introduction</h2>
      <p>
        Django is a Python web framework that follows the Model–Template–View
        pattern. This pattern separates data, request-processing logic and
        presentation so that each part of a web application has a clear
        responsibility.
      </p>
      <ul>
        <li>
          <strong>Model:</strong> defines the structure and behavior of stored
          data.
        </li>
        <li>
          <strong>View:</strong> receives a request, performs the required
          processing and returns a response.
        </li>
        <li>
          <strong>Template:</strong> presents data supplied by the view as an
          HTML page.
        </li>
      </ul>

      <h2>Django Models</h2>
      <p>
        A Django model is a Python representation of information stored in a
        database. A model generally corresponds to a database table. Each saved
        object corresponds to a row, while the model fields correspond to
        columns.
      </p>
      <h3>Model fields</h3>
      <p>
        Fields describe what values a model may contain. A book catalogue may
        contain a title, author, category, price and availability value. The
        field type is chosen according to the meaning of the data.
      </p>
      <ul>
        <li>
          A character field stores short text such as a title or category.
        </li>
        <li>A decimal field stores fixed-precision values such as prices.</li>
        <li>
          A Boolean field stores a true or false condition such as availability.
        </li>
        <li>A foreign key stores a reference to another model.</li>
      </ul>
      <h3>Primary key and database mapping</h3>
      <p>
        Every stored record needs a unique identity. Django normally creates an
        automatically numbered primary key named <strong>id</strong>. This value
        allows one record to be retrieved, updated, deleted or referenced by
        another record.
      </p>
      <p>
        Changes such as adding a stored field require a database schema change.
        Django records model changes with makemigrations; migrate applies the
        recorded operations in order.
      </p>

      <h2>Django ORM and QuerySets</h2>
      <p>
        The Object–Relational Mapper allows Django to work with model objects
        instead of requiring application code to handle database-specific
        operations directly. Django translates the requested model operation
        into a database query.
      </p>
      <p>
        A QuerySet describes a query for a collection of model objects.
        Constructing it with all() or filter() does not immediately read the
        database. It is lazy: evaluation, such as iterating over it, retrieves
        the matching records. A filter can select available books or books below
        a chosen price.
      </p>
      <ul>
        <li>
          <strong>Create</strong> stores a new record.
        </li>
        <li>
          <strong>Read</strong> retrieves one or more records.
        </li>
        <li>
          <strong>Update</strong> changes an existing record.
        </li>
        <li>
          <strong>Delete</strong> removes an existing record.
        </li>
      </ul>

      <h2>Model Relationships</h2>
      <p>
        Relationships connect records that belong together. A one-to-one
        relationship associates one record with one other record. A one-to-many
        relationship allows many records to refer to one parent record. A
        many-to-many relationship allows records on both sides to have several
        connections.
      </p>
      <p>
        In the experiment, many Book records may refer to one Author. This is a
        one-to-many relationship represented on Book by a foreign key. Books and
        categories have a many-to-many relationship, stored as pairs in a
        separate join table.
      </p>

      <h2>Django Views</h2>
      <p>
        A view is responsible for processing an HTTP request. The URL dispatcher
        examines the requested path and selects the matching view. The view may
        validate input, retrieve or change model records, prepare template data
        and then return an HTTP response. A captured URL value such as pk is
        passed to the view alongside the request. A view does not have to use a
        model or a template.
      </p>
      <h3>Function-based and class-based views</h3>
      <p>
        A function-based view expresses the processing steps in a Python
        function. A class-based view groups related behavior in a class and
        dispatches the request to a handler based on the HTTP method. Both forms
        receive a request and must return a response.
      </p>

      <h2>Templates and the Request–Response Cycle</h2>
      <p>
        A template determines how data is presented. The view supplies a context
        containing the required values, and the template produces the HTML
        returned to the browser.
      </p>
      <p>In the All books example, the flow is:</p>
      <ol>
        <li>The browser sends an HTTP request for a URL.</li>
        <li>Django matches the URL to a view.</li>
        <li>
          The view builds a lazy Book QuerySet and passes it in the context.
        </li>
        <li>The template loop evaluates the QuerySet through the ORM.</li>
        <li>The database returns the records and the template renders HTML.</li>
        <li>Django returns an HTTP response to the browser.</li>
      </ol>
      <p>
        A successful page commonly returns status 200; a missing route or record
        returns 404. On POST, CSRF middleware checks the request before the view
        validates its form. An invalid HTML form can be rendered again with its
        errors; a successful save redirects to a fresh GET.
      </p>
    </div>
  );
}

const procedures = [
  {
    title: '1. Request and Response',
    items: [
      'Open Simulation and choose lesson 1, Open a page. Select All books and click Open page.',
      'Watch the request travel through Django. Pause animation and Next step let you inspect each component at your own pace.',
      'Read the returned books, then try Unknown page or Missing book to compare two causes of a 404. Read What you learned before moving on.',
    ],
  },
  {
    title: '2. Model Creation',
    items: [
      'Choose lesson 2, Add a field. Start with Price and DecimalField, then click Add field to model.',
      'Compare the model and database: only the model gains the new field. Availability with BooleanField is an optional extra.',
      'Answer the short question about whether the database changed, then click Next: Update the database.',
    ],
  },
  {
    title: '3. Migration',
    items: [
      'In lesson 3, click Create migration file to record your model change. The database is still unchanged.',
      'When that animation finishes, click Update database. The new column appears when the schema change is applied.',
      'Compare the model and database and inspect the default price of zero. Open the optional migration history for more detail.',
    ],
  },
  {
    title: '4. ORM Queries',
    items: [
      'In lesson 4, click Load example prices. The original books receive prices of 500, 750 and 650.',
      'Enter a budget of 700. Optionally tick the books you predict will match, then click Find books.',
      'Compare the result with the unchanged source records. Try 600 for a smaller result or 0 for an empty QuerySet. Inspect the displayed Django query in Execution.',
    ],
  },
  {
    title: '5. CRUD Operations',
    items: [
      'In lesson 5, click Add a book. Enter Practical Django, A. Sharma and 825, leave POST selected, then click Save book.',
      'Let the animation finish or pause it to inspect the database write and the later browser response. Perform Add, Read, Edit and Delete to complete this activity.',
      'Click Read for the new book. After the request finishes, click Edit, change its price to 900 and save.',
      'Click Delete, try Keep this book, then delete again and confirm Yes, delete this book. Compare database records before and after using the optional detail panel.',
    ],
  },
  {
    title: '6. Relationships',
    items: [
      'In lesson 6, select an author, choose One author → many books, then click Show linked books. Match the displayed author ID with each book’s author_id.',
      'Click Enable book–category links. Choose Django Basics and tick Python and Django.',
      'Choose Web Development and tick Python. Read the stored pairs: one book has multiple categories, and Python is shared by multiple books. Untick a category to remove only that connection.',
    ],
  },
  {
    title: '7. Error Handling',
    items: [
      'In lesson 7, open Problem 1: page not found (404). Read the clue, choose URL matching, and change /book/ to /books/. Click Test my fix.',
      'Open Problem 2: missing template (500). Choose Page template and enter catalog/book_list.html, then click Test my fix.',
      'Use Show hint if needed. A repair succeeds only when the repeated request returns 200 OK. Complete both problems.',
    ],
  },
  {
    title: '8. Complete Experiment',
    items: [
      'Complete every simulation activity.',
      'Click Review my experiment after lesson 7. Completion is based on operations actually performed. Use My observations or Save my observations for your lab record.',
      'Revisit any lesson tab, or continue to the Posttest. Start over asks for confirmation before restoring the original records; quiz answers are kept.',
    ],
  },
];

export function Procedure() {
  useEffect(() => completeSection('Procedure'), []);
  return (
    <div className="lesson procedure-page">
      <p>
        Follow the seven lessons in Simulation. Each lesson explains what to do
        in three panels: Input, Execution and Result. Enter your choices on the
        left, follow Django in the middle, and read the output on the right. Use
        Next to continue after completing its task, or select a lesson tab to
        revisit it. The same library data is shared across lessons.
      </p>
      <p>
        Animations run automatically. Use Pause animation and Next step when you
        want to explain a stage. Let an operation finish before switching
        lessons. Code and detailed records are available in optional panels.
        This teaching model demonstrates Django behaviour in your browser.
      </p>
      {procedures.map((section) => (
        <section className="procedure-section" key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const references = [
  [
    'Django Software Foundation. Django Documentation (version 5.2).',
    'https://docs.djangoproject.com/en/5.2/',
  ],
  [
    'Django Software Foundation. “Models.”',
    'https://docs.djangoproject.com/en/5.2/topics/db/models/',
  ],
  [
    'Django Software Foundation. “Making queries.”',
    'https://docs.djangoproject.com/en/5.2/topics/db/queries/',
  ],
  [
    'Django Software Foundation. “Migrations.”',
    'https://docs.djangoproject.com/en/5.2/topics/migrations/',
  ],
  [
    'Django Software Foundation. “Writing views.”',
    'https://docs.djangoproject.com/en/5.2/topics/http/views/',
  ],
  [
    'Django Software Foundation. “URL dispatcher.”',
    'https://docs.djangoproject.com/en/5.2/topics/http/urls/',
  ],
  [
    'Django Software Foundation. “Introduction to class-based views.”',
    'https://docs.djangoproject.com/en/5.2/topics/class-based-views/intro/',
  ],
  [
    'Vincent, W. S. Django for Beginners, 5th ed.',
    'https://learndjango.com/courses/django-for-beginners/',
  ],
];

export function References() {
  useEffect(() => completeSection('References'), []);
  return (
    <div className="lesson references-page">
      <h2>References</h2>
      <ol>
        {references.map(([label, url]) => (
          <li key={url}>
            <a href={url} target="_blank" rel="noreferrer">
              {label}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
