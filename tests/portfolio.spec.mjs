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
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
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
  }
});
