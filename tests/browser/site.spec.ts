import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  '/',
  '/guides/',
  '/guides/timeouts-retries-idempotency/',
  '/concerns/',
  '/principles/',
  '/skills/',
  '/skills/build-feature/',
];

for (const scheme of ['light', 'dark'] as const) {
  test(`pages render accessibly without sideways scrolling (${scheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        path,
      ).toBe(true);
      const a11y = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(a11y.violations, path).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test('landing: skip link, the misses, and copy prompt work from the keyboard', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();

  // Each row is a real miss from a stop, linking to that stop.
  const row = page.getByRole('link', {
    name: /A timeout doesn.t mean it failed/,
  });
  await expect(row).toHaveAttribute(
    'href',
    '/guides/timeouts-retries-idempotency/',
  );

  await expect(page.locator('[data-origin]')).toContainText(
    '/skills/README.md',
  );

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy the clone command' }).click();
  await expect(page.locator('[data-copy-status]')).toHaveText(
    'Copied to your clipboard.',
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'git clone https://github.com/devduck123/swe-os ~/swe-os',
  );
});

test('every page offers its raw Markdown, and agents get an index', async ({
  page,
  request,
}) => {
  await page.goto('/concerns/security/');
  const raw = page.getByRole('link', { name: 'view as Markdown' });
  await expect(raw).toHaveAttribute('href', '/core/concerns/security.md');
  const markdown = await (
    await request.get('/core/concerns/security.md')
  ).text();
  expect(markdown).toContain('## Minimum bar');
  const skill = await (
    await request.get('/skills/build-feature/SKILL.md')
  ).text();
  expect(skill).toContain('name: build-feature');
  const index = await (await request.get('/llms.txt')).text();
  expect(index).toContain('/skills/README.md');
  expect(index).toContain('/core/guides/timeouts-retries-idempotency.md');
});

test('docs navigation and search work', async ({ page, isMobile }) => {
  await page.goto('/principles/');
  if (isMobile)
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Build a feature' }).first().click();
  await expect(page).toHaveURL(/\/skills\/build-feature\//);
  if (isMobile) {
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    if ((await menu.getAttribute('aria-expanded')) === 'true')
      await menu.click();
  }
  await page.getByRole('button', { name: 'Search' }).click();
  await page
    .getByRole('textbox', { name: 'Search', exact: true })
    .fill('idempotency');
  await expect(page.locator('.pagefind-ui__result-link').first()).toBeVisible();
});

test('landing reflows at 320px, and nothing loops', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  // The duck waves once and stops, so the page needs no pause control (WCAG 2.2.2).
  const looping = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations === Infinity).length,
  );
  expect(looping).toBe(0);
});

test('the track map remembers the stops you read, until you reset it', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/guides/simple-first/');
  await page.goto('/recipes/side-project-stack/');
  await page.goto('/guides/');

  const progress = page.locator('[data-track-progress]');
  await expect(progress.getByText('2 of 22 read')).toBeVisible();
  const read = page.locator('.track-stop[data-read]');
  await expect(read).toHaveCount(2);
  await expect(read.getByRole('link')).toHaveText([
    'Simple first',
    'The side-project stack',
  ]);
  // Screen readers hear it too.
  await expect(read.first()).toContainText('(read)');

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(read).toHaveCount(0);
  await expect(
    progress.getByRole('link', { name: 'Start at stop 1' }),
  ).toBeFocused();
  await page.reload();
  await expect(progress.getByText('of 22 read')).toBeHidden();
  await expect(
    progress.getByRole('link', { name: 'Start at stop 1' }),
  ).toBeVisible();
  await expect(read).toHaveCount(0);
});
