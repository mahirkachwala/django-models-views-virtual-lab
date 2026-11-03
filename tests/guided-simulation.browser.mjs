// Optional end-to-end UI check. Requires Playwright and installed Google Chrome.
// PLAYWRIGHT_MODULE can point to an existing Playwright index.mjs as a file URL.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const saved = () =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem('django-visual-journey-v3')),
  );
const waitSaved = (expression) => page.waitForFunction(expression);
const click = (name) =>
  page
    .getByRole('button', { name, exact: true })
    .and(page.locator('button:not(.guided-lessons button)'))
    .click();
async function capture(path) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path, fullPage: true });
}
async function checkPanels(target, stacked = false) {
  await target.locator('.guided-bench').waitFor({ state: 'visible' });
  const columns = target.locator('.guided-bench > .guided-column');
  assert.equal(await columns.count(), 3, 'Each activity exposes three panels');
  const headings = await columns
    .locator('.guided-column-title')
    .allTextContents();
  for (const [index, title] of ['Input', 'Execution', 'Result'].entries()) {
    assert.equal(headings[index].replace(/^\s*\d+\s*/, '').trim(), title);
  }
  const boxes = await Promise.all(
    [0, 1, 2].map((index) => columns.nth(index).boundingBox()),
  );
  assert.ok(boxes.every(Boolean), 'All three panels are visible');
  for (let index = 1; index < boxes.length; index++) {
    const previous = boxes[index - 1];
    const current = boxes[index];
    if (stacked) {
      assert.ok(
        current.y >= previous.y + previous.height - 1,
        'Phone panels follow Input, Execution, Result vertically',
      );
      assert.ok(
        Math.abs(current.x - previous.x) < 2,
        'Phone panels share the same left edge',
      );
    } else {
      assert.ok(
        current.x >= previous.x + previous.width - 1,
        'Desktop panels follow Input, Execution, Result horizontally',
      );
      assert.ok(
        Math.abs(current.y - previous.y) < 2,
        'Desktop panels share the same top edge',
      );
    }
  }
  assert.equal(
    await target.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    'The activity fits the viewport',
  );
}
async function finishAnimation() {
  const pause = page.getByRole('button', {
    name: 'Pause animation',
    exact: true,
  });
  if (await pause.isVisible()) await pause.click();
  for (let i = 0; i < 30; i++) {
    const next = page.getByRole('button', { name: 'Next step', exact: true });
    if (!(await next.isVisible())) break;
    const before = (await saved()).flow.index;
    await next.click();
    await page.waitForFunction(
      (index) =>
        JSON.parse(localStorage.getItem('django-visual-journey-v3')).flow
          .index > index,
      before,
    );
  }
  assert.equal((await saved()).flow.done, true);
}
try {
  await mkdir('docs/screenshots', { recursive: true });
  await page.goto(process.env.VLAB_URL || 'http://127.0.0.1:3000/#simulation');
  await page.addStyleTag({
    content: 'html { scroll-behavior: auto !important; }',
  });
  await page
    .getByRole('heading', { name: 'How does Django open a page?' })
    .waitFor();
  assert.equal(await page.locator('.sidebar').isVisible(), true);
  assert.equal(await page.locator('.breadcrumbs').isVisible(), true);
  assert.equal(await page.locator('.site-footer').count(), 1);
  assert.equal(await page.locator('.guided-lab progress').count(), 0);
  assert.equal(await page.locator('.guided-lessons button > span').count(), 0);
  await checkPanels(page);
  // A direct jump offers a prerequisite link instead of a broken form.
  await page
    .getByRole('navigation', { name: 'Simulation lessons' })
    .getByRole('button', { name: 'Find books', exact: true })
    .click();
  await click('Go to lesson 2: Add a field');
  assert.equal(
    await page
      .getByRole('heading', { name: 'Tell Django what a book contains' })
      .isVisible(),
    true,
  );
  await page
    .getByRole('navigation', { name: 'Simulation lessons' })
    .getByRole('button', { name: 'Open a page', exact: true })
    .click();
  await click('Open page');
  await finishAnimation();
  assert.equal((await saved()).evidence.includes('request'), true);
  await page.getByLabel('Page to open').selectOption('/unknown/');
  await click('Open page');
  await finishAnimation();
  assert.equal((await saved()).flow.status, 404);
  console.log('PASS request success, 404, pause and manual stepping');

  await click('Next: Add a field');
  await page.getByLabel('Django field type').selectOption('BooleanField');
  await click('Add field to model');
  assert.equal((await saved()).model.includes('price'), false);
  await page.getByText('Price needs DecimalField.', { exact: false }).waitFor();
  await page.getByLabel('Django field type').selectOption('DecimalField');
  await click('Add field to model');
  await waitSaved(() =>
    JSON.parse(localStorage.getItem('django-visual-journey-v3')).model.includes(
      'price',
    ),
  );
  assert.equal((await saved()).schema.includes('price'), false);
  await page
    .getByLabel('What should a book remember?')
    .selectOption('available');
  await click('Add field to model');
  await click('No — a migration is needed');
  await click('Next: Update the database');
  await click('Create migration file');
  await waitSaved(() => {
    const flow = JSON.parse(
      localStorage.getItem('django-visual-journey-v3'),
    ).flow;
    return flow?.operation.kind === 'generate' && flow.done;
  });
  assert.equal((await saved()).schema.includes('price'), false);
  await click('Update database');
  await waitSaved(() => {
    const flow = JSON.parse(
      localStorage.getItem('django-visual-journey-v3'),
    ).flow;
    return flow?.operation.kind === 'apply' && flow.done;
  });
  assert.equal((await saved()).schema.includes('price'), true);
  assert.equal(
    (await saved()).books.every((book) => book.price === 0),
    true,
  );
  console.log(
    'PASS model validation and separate migration generation/application',
  );

  await click('Next: Find books');
  await click('Load example prices');
  await page.getByLabel('Django Basics — ₹500.00', { exact: true }).check();
  await page.getByLabel('Django Models — ₹650.00', { exact: true }).check();
  await click('Find books');
  await waitSaved(
    () =>
      JSON.parse(localStorage.getItem('django-visual-journey-v3')).queryIds
        ?.length === 2,
  );
  assert.deepEqual((await saved()).queryIds, [1, 3]);
  await page.getByLabel('Find books costing less than (₹)').fill('0');
  await click('Find books');
  await page
    .getByText('No books match: an empty QuerySet.', { exact: false })
    .waitFor();
  assert.equal((await saved()).books.length, 3);
  console.log(
    'PASS budget filter, prediction and empty QuerySet without mutation',
  );

  await click('Next: Manage books');
  await click('Add a book');
  await page.getByLabel('Book title', { exact: true }).fill('Practical Django');
  await page.getByLabel('Request method').selectOption('GET');
  await click('Save book');
  await page.getByText('GET reads data.', { exact: false }).waitFor();
  assert.equal((await saved()).books.length, 3);
  await page.getByLabel('Request method').selectOption('POST');
  await click('Save book');
  await click('Pause animation');
  while (!(await saved()).flow.committed) {
    const index = (await saved()).flow.index;
    await click('Next step');
    await page.waitForFunction(
      (before) =>
        JSON.parse(localStorage.getItem('django-visual-journey-v3')).flow
          .index > before,
      index,
    );
  }
  assert.equal((await saved()).books.length, 4);
  assert.match(
    await page.locator('.guided-library-bar').innerText(),
    /3 books displayed/,
  );
  await finishAnimation();
  assert.match(
    await page.locator('.guided-library-bar').innerText(),
    /4 books displayed/,
  );
  await click('Read Practical Django');
  await finishAnimation();
  await page
    .locator('.guided-read-detail')
    .getByText('Practical Django', { exact: true })
    .waitFor();
  await click('Edit Practical Django');
  await page.getByLabel('Price (₹)', { exact: true }).fill('900');
  await click('Save book');
  await finishAnimation();
  assert.equal((await saved()).books.find((book) => book.id === 4).price, 900);
  await click('Delete Practical Django');
  await click('Keep this book');
  assert.equal((await saved()).books.length, 4);
  await click('Delete Practical Django');
  await click('Yes, delete this book');
  await finishAnimation();
  assert.equal((await saved()).books.length, 3);
  console.log(
    'PASS CRUD, GET rejection, database/browser separation and cancel delete',
  );

  await click('Next: Connect records');
  const diagram = page.locator('.guided-er-diagram');
  assert.equal(await diagram.isVisible(), true);
  for (const entity of ['Author', 'Book', 'Category']) {
    assert.equal(await diagram.locator(`[data-entity="${entity}"]`).count(), 1);
  }
  assert.match(await diagram.innerText(), /author_id/);
  await page.getByLabel('Author → Book relationship').selectOption('1:1');
  await click('Show linked books');
  await page
    .getByText('Choose One author → many books.', { exact: false })
    .waitFor();
  await page.getByLabel('Author → Book relationship').selectOption('1:*');
  await click('Show linked books');
  assert.equal(
    await diagram.locator('.guided-er-connector.is-active').count(),
    1,
  );
  assert.match(
    await page.locator('.guided-link-example').innerText(),
    /Django Models/,
  );
  await click('Enable book–category links');
  assert.equal(
    await diagram.locator('.guided-er-connector.is-active').count(),
    2,
  );
  await page.getByLabel('Python', { exact: true }).check();
  assert.equal(
    await page
      .getByRole('button', { name: 'Next: Fix a problem', exact: true })
      .isDisabled(),
    true,
  );
  await page.getByLabel('Django', { exact: true }).check();
  await page.getByLabel('Book to categorise').selectOption('2');
  await page.getByLabel('Python', { exact: true }).check();
  await waitSaved(
    () =>
      JSON.parse(localStorage.getItem('django-visual-journey-v3')).memberships
        .length === 3,
  );
  await page.getByLabel('Python', { exact: true }).uncheck();
  await waitSaved(
    () =>
      JSON.parse(localStorage.getItem('django-visual-journey-v3')).memberships
        .length === 2,
  );
  assert.equal(
    (await saved()).books.length,
    3,
    'Removing a link keeps the book',
  );
  await page.getByLabel('Python', { exact: true }).check();
  await waitSaved(
    () =>
      JSON.parse(localStorage.getItem('django-visual-journey-v3')).memberships
        .length === 3,
  );
  await capture('docs/screenshots/guided-relationships-desktop.png');
  console.log('PASS relationship validation and shared category join pairs');

  await click('Next: Fix a problem');
  await click('Problem 1: page not found (404)');
  await page.getByLabel('Where is the mistake?').selectOption('Database');
  await click('Test my fix');
  await page
    .getByText('The address failed before the view ran.', { exact: false })
    .waitFor();
  await page.getByLabel('Where is the mistake?').selectOption('URLconf');
  await page.getByLabel('Correct route').fill('/wrong/');
  await click('Test my fix');
  await page
    .getByText('404 — the page still fails.', { exact: false })
    .waitFor();
  await page.getByLabel('Correct route').fill('/books/');
  await click('Test my fix');
  await page
    .getByText('200 OK — your repair worked.', { exact: false })
    .waitFor();
  await click('Problem 2: missing template (500)');
  await page.getByLabel('Where is the mistake?').selectOption('Template');
  await page.getByLabel('Correct template path').fill('catalog/book_list.html');
  await click('Test my fix');
  await click('Review my experiment');
  await page
    .getByRole('heading', { name: 'You completed the Django experiment.' })
    .waitFor();
  const download = page.waitForEvent('download');
  await click('Save my observations');
  const observationsDownload = await download;
  assert.equal(
    observationsDownload.suggestedFilename(),
    'django-lab-observations.txt',
  );
  assert.match(
    await readFile(await observationsDownload.path(), 'utf8'),
    /7\/7 lessons completed/,
  );
  assert.match(
    await page
      .getByLabel('Observation text — you can also copy this')
      .inputValue(),
    /7\/7 lessons completed/,
  );
  console.log('PASS two verified repairs, completion and observation download');

  await page.reload();
  await page
    .getByRole('heading', { name: 'You completed the Django experiment.' })
    .waitFor();
  const baseline = await saved();
  for (let i = 0; i < 7; i++) {
    await page
      .getByRole('navigation', { name: 'Simulation lessons' })
      .getByRole('button')
      .nth(i)
      .click();
    await checkPanels(page);
  }
  console.log(
    'PASS all seven activities have aligned Input / Execution / Result panels',
  );
  // The phone layout must expose the actions without horizontal scrolling.
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  phone.setDefaultTimeout(15000);
  phone.on('pageerror', (error) => errors.push(error.message));
  await phone.addInitScript(
    (data) =>
      localStorage.setItem('django-visual-journey-v3', JSON.stringify(data)),
    { ...baseline, step: 4, flow: null },
  );
  await phone.goto(process.env.VLAB_URL || 'http://127.0.0.1:3000/#simulation');
  await phone.addStyleTag({
    content: 'html { scroll-behavior: auto !important; }',
  });
  await checkPanels(phone, true);
  const phoneRead = phone.getByRole('button', {
    name: 'Read Django Basics',
    exact: true,
  });
  await phoneRead.click();
  await phone.waitForFunction(() => {
    const flow = JSON.parse(
      localStorage.getItem('django-visual-journey-v3'),
    ).flow;
    return flow?.operation.kind === 'read' && flow.done;
  });
  await phone.getByRole('button', { name: 'Add a book', exact: true }).click();
  await phone
    .getByLabel('Book title', { exact: true })
    .fill('Mobile learner book');
  await phone.getByRole('button', { name: 'Save book', exact: true }).click();
  await phone.waitForFunction(() => {
    const flow = JSON.parse(
      localStorage.getItem('django-visual-journey-v3'),
    ).flow;
    return flow?.operation.kind === 'create' && flow.done;
  });
  await phone
    .getByRole('button', { name: 'Read Mobile learner book', exact: true })
    .waitFor({ state: 'visible' });
  assert.equal(
    await phone
      .getByRole('button', { name: 'Read Mobile learner book', exact: true })
      .isVisible(),
    true,
  );
  assert.equal(
    await phone.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await phone.close();
  console.log('PASS phone record cards and working Read/Add controls');
  await page.setViewportSize({ width: 390, height: 844 });
  const screenshots = [0, 4, 5];
  for (let i = 0; i < 7; i++) {
    await page
      .getByRole('navigation', { name: 'Simulation lessons' })
      .getByRole('button')
      .nth(i)
      .click();
    await checkPanels(page, true);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    assert.equal(overflow, false, `Horizontal overflow in lesson ${i + 1}`);
    if (screenshots.includes(i))
      await capture(`docs/screenshots/guided-lesson-${i + 1}-mobile.png`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole('navigation', { name: 'Simulation lessons' })
    .getByRole('button')
    .nth(0)
    .click();
  await capture('docs/screenshots/guided-simulation-desktop.png');
  await page
    .locator('.sidebar')
    .getByRole('link', { name: 'Theory', exact: true })
    .click();
  assert.equal(
    await page
      .getByRole('heading', { name: 'Simulation', exact: true })
      .count(),
    0,
  );
  await page
    .locator('.sidebar')
    .getByRole('link', { name: 'Simulation', exact: true })
    .click();
  await page
    .getByRole('heading', { name: 'How does Django open a page?' })
    .waitFor();
  assert.deepEqual((await saved()).books, baseline.books);
  await click('Start over');
  await click('Keep my work');
  assert.equal((await saved()).evidence.includes('deleted'), true);
  await click('Start over');
  await click('Yes, start a fresh experiment');
  await waitSaved(
    () =>
      JSON.parse(localStorage.getItem('django-visual-journey-v3')).evidence
        .length === 0,
  );
  assert.deepEqual((await saved()).model, ['title', 'author']);
  await click('Open page');
  await click('Pause animation');
  const pausedIndex = (await saved()).flow.index;
  await page.reload();
  await page
    .getByRole('button', { name: 'Continue animation', exact: true })
    .waitFor();
  assert.equal((await saved()).flow.index, pausedIndex);
  await finishAnimation();
  assert.deepEqual(errors, []);
  console.log(
    'PASS saved progress, all seven mobile layouts, shared navigation and reset',
  );
} catch (error) {
  try {
    await capture('docs/screenshots/guided-ui-check-failure.png');
  } catch (captureError) {
    console.warn('Could not capture the failed page:', captureError.message);
  }
  throw error;
} finally {
  await browser.close();
}
