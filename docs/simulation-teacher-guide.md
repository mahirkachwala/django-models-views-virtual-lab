# Django Virtual Lab — simple teacher demonstration

Current interface: three-panel guided lessons, 3 November 2026. Open http://127.0.0.1:3000/#simulation.

The Simulation uses the restored coral/gray three-panel design. No design selection is needed; the shared site navigation remains unchanged.

Use **Start over → Yes, start a fresh experiment** before rehearsing if you want the original three books. This clears the experiment only after confirmation. Quiz scores remain.

Allow about 10–15 minutes. Follow the lesson tabs; the **Next** button names the next topic. Start by saying: “We choose an input on the left, follow Django's execution in the middle, and inspect the result on the right.” Every lesson includes a short **What you learned** sentence you can read aloud. The shared sidebar, breadcrumbs and footer match the other academic pages. Code and history stay collapsed to keep the demonstration short.

| Lesson                 | Clicks and inputs                                                                                                                                                                                                                   | What to explain                                                                                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Open a page         | Keep All books selected → Open page → let animation finish. Optionally pause and use Next step.                                                                                                                                     | A URL selects a view. The view builds a lazy QuerySet and passes it to the template; its loop retrieves the books. The rendered page returns HTTP 200.                                                                                             |
| 2. Add a field         | Next: Add a field → keep Price and DecimalField → Add field to model. Answer No — a migration is needed.                                                                                                                            | Price enters the Python model, while the database remains unchanged. Optional: add Availability with BooleanField.                                                                                                                                 |
| 3. Update the database | Create migration file → wait → Update database → wait.                                                                                                                                                                              | The first command records the change; the second applies it. Existing prices receive the default zero.                                                                                                                                             |
| 4. Find books          | Load example prices → budget 700 → optionally tick Django Basics and Django Models → Find books.                                                                                                                                    | The results have prices 500 and 650; the 750 book stays in the database. Try budget 0 to show an empty QuerySet.                                                                                                                                   |
| 5. Manage books        | Add a book → title Practical Django, author A. Sharma, price 825, method POST → Save book → wait. Read it → wait. Edit price to 900 → Save book → wait. Delete → Yes, delete this book → wait.                                      | Demonstrate Create, Read, Update and Delete in that order. CSRF middleware checks the POST before the view validates the form. The write occurs before the redirect and the browser's updated list. GET reads; this example uses POST for changes. |
| 6. Connect records     | Keep A. Sharma and One author → many books → Show linked books. Point to the highlighted 1:N link in the middle diagram. Enable book–category links → Django Basics → tick Python and Django. Select Web Development → tick Python. | Rectangles represent entities, diamonds name relationships, PK identifies a record and FK points to another record. The M:N relationship uses the join pairs visible in Result. Removing a category tick removes only that pair.                   |
| 7. Fix a problem       | Problem 1 → URL matching → replace /book/ with /books/ → Test my fix. Problem 2 → Page template → enter catalog/book_list.html → Test my fix.                                                                                       | The first failure stops before a view is called. The second cannot load the list template, so its lazy book query has not run. A successful retest returns 200 OK. Show hint provides the repair if needed.                                        |

After lesson 7, choose **Review my experiment**, **Save my observations**, then **Go to Posttest**. Completion is based on actual operations, not merely opening a lesson.

## Controls worth knowing

- **Pause animation / Continue animation:** stop or resume automatic playback.
- **Next step:** advance once while paused. Complete the operation before switching lessons.
- **Lesson tabs:** revisit a topic. Shared records are kept.
- **Go to lesson 2/3:** appears if a prerequisite is missing; it does not change data for you.
- **Keep this book / Keep my work:** cancel deletion/reset.
- **My observations:** recorded actions, including the final model/schema and book count in the export.
- Detailed code and traces are optional; a first demonstration can leave them closed.

## If the teacher asks about execution

The visual lessons are a deterministic browser teaching model; they do not execute arbitrary Python or SQL. The optional real Django/SQLite backend is a separate runnable reference. Its records are independent. The query display explains filtering, not an actual database optimizer's execution plan. Category setup abstracts that field's migration, which is taught separately in lesson 3.

For **One book — /books/2/**, explain that the URL captures `pk=2` and calls a view accepting `(request, pk)`. `get_object_or_404()` queries immediately, so this lookup happens before rendering. For **All books**, `Book.objects.all()` is lazy and the template loop triggers the read. Django views can also return responses without using either a model or a template; these activities demonstrate one common HTML application pattern.

For a POST, the illustrated form has already passed CSRF middleware. The view validates a `ModelForm`; `save(commit=False)` does not write to the database, while the following `book.save()` does. This illustrated form excludes categories; those links are managed separately. An empty form can query related tables when its author choices are rendered in real Django; this simplified form preview omits that work.

These distinctions follow the official [Django QuerySet documentation](https://docs.djangoproject.com/en/5.2/topics/db/queries/#querysets-are-lazy), [URL dispatching documentation](https://docs.djangoproject.com/en/5.2/topics/http/urls/), [CSRF documentation](https://docs.djangoproject.com/en/5.2/ref/csrf/), and [ModelForm save documentation](https://docs.djangoproject.com/en/5.2/topics/forms/modelforms/#the-save-method).

Default example result: fresh IDs 1 and 3 match price < 700 after loading sample prices. Custom/deleted books change the actual results. The sample data loader updates only the original books still present and preserves custom books.
