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

test('project overviews lead with AI agents and keep links visible when collapsed', async ({
  page,
}) => {
  await page.goto('/');
  const projects = page.locator('#projects > article');
  await expect(projects).toHaveCount(4);
  await expect(projects.getByRole('heading', { level: 3 })).toHaveText([
    'AI Agents Under the Hood',
    'Restaurant Review Reply Automation',
    'Core Python Field Guide',
    'FastAPI Complete Guide',
  ]);
  await expect(page.locator('.project-details[open]')).toHaveCount(0);
  for (const project of await projects.all()) {
    await expect(project.getByRole('heading', { level: 3 })).toBeVisible();
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
  await expect(agents.getByRole('heading', { level: 4 })).toHaveText([
    'LangChain-Powered Job Search Agent',
    'Custom ReAct-Style Agent Loop',
  ]);
  await expect(agents.getByRole('list', { name: 'Framework-managed agent flow' })).toBeVisible();
  await expect(agents.getByRole('list', { name: 'Explicit agent loop flow' })).toBeVisible();
  await expect(agents).toContainText('Both examples use LangChain interfaces with Gemini');
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
  await expect(page.locator('.project-details[open]')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const firstSummary = disclosures.first().locator('summary');
  await firstSummary.focus();
  await page.keyboard.press('Space');
  await expect(firstSummary).toBeFocused();
  await expect(disclosures.first()).toHaveJSProperty('open', false);
  await expect(disclosures.first().locator('.project-card')).toBeHidden();
  await expect(page.locator('.project-details[open]')).toHaveCount(3);
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

for (const mode of ['http', 'file']) {
  test(`FastAPI PDF downloads without leaving the portfolio (${mode})`, async ({ page }) => {
    await page.goto(mode === 'file' ? new URL('../index.html', import.meta.url).href : '/');
    const portfolioURL = page.url();
    const link = page.getByRole('link', { name: 'Download FastAPI guide (PDF)' });
    if (mode === 'file') await expect(link).toHaveAttribute('href', /^blob:/);
    else await expect(link).toHaveAttribute('href', 'assets/FastAPI-Guide.pdf');

    const pending = page.waitForEvent('download');
    await link.click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('FastAPI-Guide.pdf');
    expect(await download.failure()).toBeNull();
    expect(await readFile(await download.path())).toEqual(
      await readFile(new URL('../assets/FastAPI-Guide.pdf', import.meta.url)),
    );
    await expect(page).toHaveURL(portfolioURL);
    await expect(page.getByRole('heading', { name: 'FastAPI Complete Guide' })).toBeVisible();
  });
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
    await expect(agents.getByRole('heading', { level: 3 })).toBeVisible();
    await expect(
      agents.getByRole('link', { name: 'Explore the Agent Implementations' }),
    ).toHaveAttribute('href', 'https://github.com/Hulk914/langchain_job_search');
    const disclosure = agents.locator('details');
    await expect(disclosure).toHaveJSProperty('open', false);
    await agents.locator('summary').click();
    await expect(agents.getByRole('list', { name: 'Explicit agent loop flow' })).toBeVisible();
    await agents.locator('summary').click();
    await expect(disclosure).toHaveJSProperty('open', false);
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
