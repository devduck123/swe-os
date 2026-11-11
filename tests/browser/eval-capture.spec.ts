import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { capture } from '../../evals/harness/capture.mjs';

// The facts graders rely on have to catch a page that breaks the rules, not just pass a good one.
test('the eval capture catches a page that breaks the rules', async ({
  isMobile,
}) => {
  test.skip(isMobile, 'It opens its own browser, so one run is enough.');
  test.setTimeout(120_000);
  const room = mkdtempSync(join(tmpdir(), 'capture-'));
  const work = join(room, 'work');
  mkdirSync(work);
  writeFileSync(
    join(work, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Bad</title><style>
      @keyframes spin { to { transform: rotate(360deg); } }
      html { background: #fff; }
      body { color: #eee; }
      /* Painted on <html>, which an earlier check missed. */
      @media (prefers-color-scheme: dark) { html { background: #000; } }
      .wide { width: 900px; animation: spin 2s infinite; }
      .off { animation: spin 1ms; }
    </style></head><body><main><h1>Bad</h1><button>x</button>
    <div class="off">off</div><div class="wide">wide</div></main>
    <script>throw new Error('boom');</script></body></html>`,
  );
  const out = join(room, 'shots');
  const facts = (await capture(work, out, {
    filled: () => ({ saved: 'yes' }),
    expectText: 'Missing',
  })) as Record<string, any>;
  expect(facts.captureError).toBeUndefined();
  expect(facts.motion.looping).toBe(1);
  // The spin counts, and the 1ms animation that switches motion off doesn't.
  expect(facts.movingUnderReducedMotion).toBe(1);
  expect(facts.savedDataShows).toBe(false);
  expect(facts.sidewaysScrollAt320).toBe(true);
  expect(facts.followsSystemDarkMode).toBe(true);
  expect(facts.accessibility.light.join()).toContain('color-contrast');
  expect(facts.smallTouchTargets.join()).toContain('button: x');
  expect(facts.pageErrors.join()).toContain('boom');
  for (const shot of facts.shots)
    expect(existsSync(join(out, shot))).toBe(true);
  expect(facts.shots).toHaveLength(5);
});

test('the eval capture finds a site in its folder and shows the first screen', async ({
  isMobile,
}) => {
  test.skip(isMobile, 'It opens its own browser, so one run is enough.');
  test.setTimeout(120_000);
  const room = mkdtempSync(join(tmpdir(), 'capture-'));
  const site = join(room, 'work', 'site');
  mkdirSync(site, { recursive: true });
  writeFileSync(
    join(site, 'index.html'),
    '<!doctype html><html lang="en"><title>Site</title><main><h1>Site</h1></main></html>',
  );
  const out = join(room, 'shots');
  const facts = (await capture(join(room, 'work'), out, {
    root: 'site',
    scroll: true,
    expectText: 'Site',
  })) as Record<string, any>;
  expect(facts.captureError).toBeUndefined();
  expect(facts.savedDataShows).toBe(true);
  expect(facts.followsSystemDarkMode).toBe(false);
  expect(facts.shots).toContain('phone-light-fold.png');
  expect(facts.shots).not.toContain('phone-empty.png');
  expect(facts.shots).toHaveLength(8);
});
