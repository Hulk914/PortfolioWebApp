import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('loads the public page and its assets without browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(response.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ayush Thakur');
  await expect(page.locator('.profile-pic')).toBeVisible();
  await expect
    .poll(() =>
      page.locator('.profile-pic').evaluate((image) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('marks the reading section and clears it when returning to the hero', async ({ page }) => {
  await page.goto('/');
  const projects = page
    .getByRole('navigation')
    .getByRole('link', { name: 'Projects', exact: true });
  await projects.click();
  await expect(projects).toHaveAttribute('aria-current', 'location');
  await page.getByRole('link', { name: 'at. Ayush Thakur, home' }).click();
  await expect(page.locator('.nav-links [aria-current]')).toHaveCount(0);
});

test('keyboard users can skip directly to the main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('project overviews lead with RAG and keep links visible when collapsed', async ({ page }) => {
  await page.goto('/');
  const projects = page.locator('#projects .project-entry');
  await expect(projects).toHaveCount(6);
  await expect(projects.getByRole('heading', { level: 4 })).toHaveText([
    'RAG Deep Dive Gemini, Pinecone & LangChain',
    'AI Agents Under the Hood',
    'Restaurant Review Reply Automation',
    'Core Python Field Guide',
    'FastAPI Complete Guide',
    'System Design & Architecture Field Guide',
  ]);
  await expect(page.locator('.project-details[open]')).toHaveCount(0);
  for (const project of await projects.all()) {
    await expect(project.getByRole('heading', { level: 4 })).toBeVisible();
    await expect(project.locator('.project-preview')).toBeVisible();
    await expect(project.locator('.card-tags')).toBeVisible();
    for (const link of await project.getByRole('link').all()) await expect(link).toBeVisible();
  }

  const agents = page.getByRole('article', { name: 'AI Agents Under the Hood' });
  const link = agents.getByRole('link', { name: 'Explore the Agent Implementations' });
  await expect(link).toHaveAttribute('href', 'https://github.com/Hulk914/langchain_job_search');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await link.focus();
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS('outline-style', 'solid');

  await agents.locator('summary').click();
  await expect(agents.getByRole('heading', { level: 5 })).toHaveText([
    'LangChain-Powered Job Search Agent',
    'Custom ReAct-Style Agent Loop',
  ]);
  await expect(agents.getByRole('list', { name: 'Framework-managed agent flow' })).toBeVisible();
  await expect(agents.getByRole('list', { name: 'Explicit agent loop flow' })).toBeVisible();
  await expect(agents).toContainText('Both examples use LangChain interfaces with Gemini');
});

test('groups projects by their primary subject with working category jump links', async ({
  page,
}) => {
  await page.goto('/');
  const groups = page.locator('#projects > .project-group');
  await expect(groups.getByRole('heading', { level: 3 })).toHaveText([
    'AI',
    'Python',
    'Miscellaneous',
  ]);
  const categories = page.getByRole('navigation', { name: 'Project categories' });
  for (const [index, id, name, count] of [
    [0, 'ai-projects', 'AI', 3],
    [1, 'python-projects', 'Python', 2],
    [2, 'misc-projects', 'Miscellaneous', 1],
  ]) {
    const group = groups.nth(index);
    await expect(group).toHaveAccessibleName(name);
    await expect(group.locator('.project-entry')).toHaveCount(count);
    const link = categories.getByRole('link', { name: `${name} ${count}`, exact: true });
    await expect(link).toHaveAttribute('href', '#' + id);
    await link.scrollIntoViewIfNeeded();
    await link.focus();
    await expect(link).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp('#' + id + '$'));
    await expect(group.getByRole('heading', { name, exact: true })).toBeInViewport();
  }
});

test('RAG details compare three workflows and accurately describe their scope', async ({
  page,
}) => {
  await page.goto('/');
  const rag = page.getByRole('article', { name: 'RAG Deep Dive Gemini, Pinecone & LangChain' });
  const link = rag.getByRole('link', { name: 'Explore RAG Implementation' });
  await expect(link).toHaveAttribute('href', 'https://github.com/Hulk914/RAG-DEEPDIVE');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAccessibleDescription('Opens in a new tab');
  await expect(rag.locator('.card-tags li')).toHaveText([
    'Python',
    'LangChain',
    'Gemini',
    'Pinecone',
    'RAG',
    'LCEL',
  ]);
  await rag.locator('summary').click();
  await expect(rag.getByRole('heading', { level: 6 })).toHaveText([
    'Direct Gemini — Without Retrieval',
    'RAG with Explicit Python Orchestration',
    'RAG with LangChain Expression Language',
  ]);
  for (const [name, steps] of [
    ['Direct Gemini workflow', ['Question', 'Gemini', 'Answer']],
    [
      'Explicit Python RAG workflow',
      ['Question', 'Retrieve relevant chunks', 'Build context-aware prompt', 'Gemini', 'Answer'],
    ],
    ['LCEL RAG workflow', ['Question', 'Retriever', 'Prompt', 'Model', 'Output parser']],
  ]) {
    await expect(rag.getByRole('list', { name }).getByRole('listitem')).toHaveText(steps);
  }
  await expect(rag).toContainText('without retraining the model');
  await expect(rag).toContainText('does not inherently improve answer quality or execution speed');
  await expect(rag).toContainText('RunnablePassthrough.assign');
  await expect(rag).toContainText('StrOutputParser');
  await expect(rag).toContainText('Eight offline tests');
  await expect(rag).toContainText('live API smoke test of the cleaned-up version is still pending');
  await expect(rag.locator('.agent-takeaway')).toHaveText(
    'RAG changes the context available to the model. LCEL changes how the workflow is composed.',
  );
});

test('RAG ingestion stays readable with connected steps at every viewport', async ({ page }) => {
  await page.goto('/');
  const rag = page.getByRole('article', { name: 'RAG Deep Dive Gemini, Pinecone & LangChain' });
  await rag.locator('summary').click();
  const pipeline = rag.getByRole('list', { name: 'Document ingestion pipeline' });
  const steps = pipeline.getByRole('listitem');
  await expect(steps).toHaveCount(4);
  await expect(steps.nth(0)).toContainText('Original text / notes');
  await expect(steps.nth(1)).toContainText('1,000-character target · zero overlap');
  await expect(steps.nth(2)).toContainText('gemini-embedding-001 · 1,536 dimensions');
  await expect(steps.nth(3)).toContainText('Dense · cosine similarity · AWS us-east-1');
  for (const step of await steps.all()) await expect(step).toBeVisible();
  const layout = await pipeline.evaluate((element) => ({
    width: innerWidth,
    boxes: [...element.children].map((step) => {
      const { x, y, right } = step.getBoundingClientRect();
      return { x, y, right, fits: step.scrollWidth <= step.clientWidth };
    }),
  }));
  expect(layout.boxes.every((box) => box.x >= 0 && box.right <= layout.width && box.fits)).toBe(
    true,
  );
  if (layout.width <= 800) {
    expect(layout.boxes.every((box) => box.x === layout.boxes[0].x)).toBe(true);
    expect(
      layout.boxes.every((box, index) => index === 0 || box.y > layout.boxes[index - 1].y),
    ).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('project details support keyboard toggling and comparing multiple projects', async ({
  page,
}) => {
  await page.goto('/');
  const disclosures = page.locator('.project-details');
  for (const disclosure of await disclosures.all()) {
    const summary = disclosure.locator('summary');
    await summary.focus();
    await expect(summary).toHaveCSS('outline-style', 'solid');
    await expect(summary).toHaveAccessibleName('View details');
    await page.keyboard.press('Enter');
    await expect(disclosure).toHaveJSProperty('open', true);
    await expect(summary).toHaveAccessibleName('Hide details');
    await expect(disclosure.locator('.project-card')).toBeVisible();
  }
  await expect(page.locator('.project-details[open]')).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const firstSummary = disclosures.first().locator('summary');
  await firstSummary.focus();
  await page.keyboard.press('Space');
  await expect(firstSummary).toBeFocused();
  await expect(disclosures.first()).toHaveJSProperty('open', false);
  await expect(disclosures.first().locator('.project-card')).toBeHidden();
  await expect(page.locator('.project-details[open]')).toHaveCount(5);
});

test('resume links resolve to a real PDF and new tabs are announced', async ({ page, request }) => {
  await page.goto('/');
  const resume = page.getByRole('link', { name: 'View my resume' });
  const response = await request.get(await resume.getAttribute('href'));
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toBe('application/pdf');
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  for (const link of await page.locator('a[target="_blank"]').all()) {
    await expect(link).toHaveAccessibleDescription('Opens in a new tab');
    expect((await link.getAttribute('rel')).split(/\s+/)).toContain('noopener');
  }
});

for (const [guide, filename, title] of [
  ['FastAPI guide', 'FastAPI-Guide.pdf', 'FastAPI Complete Guide'],
  [
    'System Design Guide',
    'System-Design-Architecture-Study-Guide.pdf',
    'System Design & Architecture Field Guide',
  ],
]) {
  for (const mode of ['http', 'file']) {
    test(`${guide} PDF downloads without leaving the portfolio (${mode})`, async ({ page }) => {
      await page.goto(mode === 'file' ? new URL('../index.html', import.meta.url).href : '/');
      const portfolioURL = page.url();
      const link = page.getByRole('link', { name: `Download ${guide} (PDF)` });
      if (mode === 'file') await expect(link).toHaveAttribute('href', /^blob:/);
      else await expect(link).toHaveAttribute('href', 'assets/' + filename);

      const pending = page.waitForEvent('download');
      await link.click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe(filename);
      expect(await download.failure()).toBeNull();
      expect(await readFile(await download.path())).toEqual(
        await readFile(new URL('../assets/' + filename, import.meta.url)),
      );
      await expect(page).toHaveURL(portfolioURL);
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    });
  }
}

test('has no automatically detectable WCAG A/AA violations', async ({ page }) => {
  await page.goto('/');
  for (const expanded of [false, true]) {
    if (expanded) {
      for (const summary of await page.locator('.project-toggle').all()) await summary.click();
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, expanded ? 'Expanded projects' : 'Collapsed projects').toEqual([]);
  }
});

test('content and anchors remain usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/');
    for (const card of await page.locator('.content').all())
      await expect(card).toHaveCSS('opacity', '1');
    await page.getByRole('navigation').getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/#projects$/);
    // Use the anchor destination so heading copy can change independently.
    await expect(page.locator('#projects').getByRole('heading', { level: 2 })).toBeInViewport();
    const agents = page.getByRole('article', { name: 'AI Agents Under the Hood' });
    await expect(agents.getByRole('heading', { level: 4 })).toBeVisible();
    await expect(
      agents.getByRole('link', { name: 'Explore the Agent Implementations' }),
    ).toHaveAttribute('href', 'https://github.com/Hulk914/langchain_job_search');
    const disclosure = agents.locator('details');
    await expect(disclosure).toHaveJSProperty('open', false);
    await agents.locator('summary').click();
    await expect(agents.getByRole('list', { name: 'Explicit agent loop flow' })).toBeVisible();
    await agents.locator('summary').click();
    await expect(disclosure).toHaveJSProperty('open', false);
    await page
      .getByRole('navigation', { name: 'Project categories' })
      .getByRole('link', { name: 'AI 3', exact: true })
      .click();
    await expect(page).toHaveURL(/#ai-projects$/);
    const rag = page.getByRole('article', { name: 'RAG Deep Dive Gemini, Pinecone & LangChain' });
    await rag.locator('summary').click();
    await expect(rag.getByRole('list', { name: 'Document ingestion pipeline' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('respects reduced motion, including when the preference changes', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await expect(page.locator('.reveal').first()).toHaveCSS('animation-name', 'none');
});

test('missing enhancement APIs do not break the page', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.IntersectionObserver = undefined;
    window.matchMedia = undefined;
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.timeline-item.hit')).toHaveCount(5);
  expect(errors).toEqual([]);
});

test('direct file preview still loads its styles, portrait, and script', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await expect(page.locator('.profile-pic')).toBeVisible();
  await expect
    .poll(() =>
      page.locator('.profile-pic').evaluate((image) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(11, 16, 19)');
  await expect(page.locator('#current-year')).toHaveText(String(new Date().getFullYear()));
  expect(errors).toEqual([]);
});

test('also fits narrow phones and intermediate breakpoints', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The extra widths supplement the three projects.');
  for (const width of [320, 600, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Overflow at ' + width,
    ).toBe(true);
    for (const summary of await page.locator('.project-toggle').all()) await summary.click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Expanded overflow at ' + width,
    ).toBe(true);
  }
});
