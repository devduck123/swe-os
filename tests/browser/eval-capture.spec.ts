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
      body { background: #fff; color: #eee; }
      @media (prefers-color-scheme: dark) { body { background: #000; } }
      .wide { width: 900px; animation: spin 2s infinite; }
    </style></head><body><main><h1>Bad</h1><button>x</button>
    <div class="wide">wide</div></main>
    <script>throw new Error('boom');</script></body></html>`,
  );
  const out = join(room, 'shots');
  const facts = (await capture(work, out)) as Record<string, any>;
  expect(facts.captureError).toBeUndefined();
  expect(facts.motion.looping).toBe(1);
  expect(facts.movingUnderReducedMotion).toBe(1);
  expect(facts.sidewaysScrollAt320).toBe(true);
  expect(facts.followsSystemDarkMode).toBe(true);
  expect(facts.accessibility.light.join()).toContain('color-contrast');
  expect(facts.smallTouchTargets.join()).toContain('button: x');
  expect(facts.pageErrors.join()).toContain('boom');
  for (const shot of facts.shots)
    expect(existsSync(join(out, shot))).toBe(true);
  expect(facts.shots).toHaveLength(5);
});
