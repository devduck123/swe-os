// Screenshots a static result and measures the design rules, for scenarios a grader can't judge
// from a diff. Nothing here costs tokens. Facts are reported, not scored: the graders weigh them.
import {
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

function serve(root) {
  const base = resolve(root);
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(base, path));
    if (file !== base && !file.startsWith(base + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory())
      file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((done) =>
    server.listen(0, '127.0.0.1', () => done(server)),
  );
}

const PHONE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };
const SETTLE_MS = 6000;

// What moves on its own, read right after load.
const readMotion = (page) =>
  page.evaluate(() => {
    const moving = /transform|translate|rotate|scale|left|top|offset/i;
    // A 1ms animation is the usual way to switch motion off, so it doesn't count as moving.
    const all = document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().endTime > 50);
    const ends = all
      .map((a) => a.effect?.getComputedTiming().endTime)
      .filter((end) => Number.isFinite(end));
    return {
      looping: all.filter(
        (a) => a.effect?.getComputedTiming().iterations === Infinity,
      ).length,
      longestMs: ends.length ? Math.max(...ends) : 0,
      moving: all.filter((a) =>
        (a.effect?.getKeyframes?.() ?? []).some((frame) =>
          Object.keys(frame).some((key) => moving.test(key)),
        ),
      ).length,
    };
  });

/**
 * @param {string} work
 * @param {string} out
 * @param {{ filled?: () => Record<string, string>, empty?: Record<string, string>, expectText?: string, root?: string, scroll?: boolean }} [options]
 */
export async function capture(
  work,
  out,
  { filled, empty = {}, expectText, root = '', scroll = false } = {},
) {
  // Fresh for each capture, since saved dates are relative to now. An agent may drop the demo
  // data, so the main screenshots load saved data instead of relying on it.
  const saved = filled?.();
  mkdirSync(out, { recursive: true });
  // The agent may not have used the folder it was asked to. Then there's no site to see there.
  const server = await serve(
    existsSync(join(work, root, 'index.html')) ? join(work, root) : work,
  );
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const facts = { accessibility: {}, shots: [] };
  const errors = new Set();
  const outside = new Set();
  let pageBytes = 0;

  const open = async ({ viewport, colorScheme, reducedMotion, storage }) => {
    const context = await browser.newContext({
      viewport,
      colorScheme,
      reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    });
    if (storage)
      await context.addInitScript((items) => {
        for (const [key, value] of Object.entries(items))
          localStorage.setItem(key, value);
      }, storage);
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.add(error.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.add(m.text());
    });
    page.on('request', (r) => {
      const { protocol, host } = new URL(r.url());
      if (protocol.startsWith('http') && !r.url().startsWith(url))
        outside.add(host);
    });
    return { context, page };
  };
  const shot = async (name, options) => {
    const { context, page } = await open(options);
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(SETTLE_MS);
    if (scroll) {
      await page.screenshot({ path: join(out, `${name}-fold.png`) });
      facts.shots.push(`${name}-fold.png`);
      // Art that appears on scroll stays hidden in a full-page shot until it's been on screen.
      await page.evaluate(async () => {
        const end = document.documentElement.scrollHeight;
        for (let y = 0; y < end; y += window.innerHeight / 2) {
          window.scrollTo(0, y);
          await new Promise((done) => setTimeout(done, 250));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
    facts.shots.push(`${name}.png`);
    await context.close();
  };

  try {
    await shot('phone-light', {
      viewport: PHONE,
      colorScheme: 'light',
      storage: saved,
    });
    await shot('phone-dark', {
      viewport: PHONE,
      colorScheme: 'dark',
      storage: saved,
    });
    await shot('desktop-light', {
      viewport: DESKTOP,
      colorScheme: 'light',
      storage: saved,
    });
    await shot('desktop-dark', {
      viewport: DESKTOP,
      colorScheme: 'dark',
      storage: saved,
    });
    // Only a page with saved data has a separate empty state to show.
    if (filled)
      await shot('phone-empty', {
        viewport: PHONE,
        colorScheme: 'light',
        storage: empty,
      });

    for (const colorScheme of ['light', 'dark']) {
      const { context, page } = await open({
        viewport: PHONE,
        colorScheme,
        reducedMotion: true,
        storage: saved,
      });
      await page.goto(url, { waitUntil: 'load' });
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      facts.accessibility[colorScheme] = violations.map(
        (v) => `${v.id} (${v.nodes.length})`,
      );
      await context.close();
    }

    const motion = await open({
      viewport: PHONE,
      colorScheme: 'light',
      storage: saved,
    });
    motion.page.on('response', async (response) => {
      try {
        pageBytes += (await response.body()).length;
      } catch {
        // A redirect or a failed request has no body to count.
      }
    });
    await motion.page.goto(url, { waitUntil: 'load' });
    const filledMotion = await readMotion(motion.page);
    if (expectText)
      facts.savedDataShows = (await motion.page.textContent('body')).includes(
        expectText,
      );
    // How many interactive things are smaller than a thumb on a phone.
    facts.smallTouchTargets = await motion.page.evaluate(() =>
      [...document.querySelectorAll('a, button, input, select, textarea')]
        .filter((el) => {
          const box = el.getBoundingClientRect();
          return box.width > 0 && (box.height < 44 || box.width < 24);
        })
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}: ${(el.textContent || el.name || '').trim().slice(0, 30)}`,
        ),
    );
    await motion.context.close();

    // Motion can differ by screen, so read the empty state too and report the worst.
    const bare = await open({
      viewport: PHONE,
      colorScheme: 'light',
      storage: empty,
    });
    await bare.page.goto(url, { waitUntil: 'load' });
    const emptyMotion = await readMotion(bare.page);
    await bare.context.close();
    facts.motion = {
      looping: Math.max(filledMotion.looping, emptyMotion.looping),
      longestMs: Math.max(filledMotion.longestMs, emptyMotion.longestMs),
      longestMsWithPlants: filledMotion.longestMs,
      longestMsEmpty: emptyMotion.longestMs,
    };

    let movingStill = 0;
    for (const storage of [saved, empty]) {
      const still = await open({
        viewport: PHONE,
        colorScheme: 'light',
        reducedMotion: true,
        storage,
      });
      await still.page.goto(url, { waitUntil: 'load' });
      movingStill = Math.max(
        movingStill,
        (await readMotion(still.page)).moving,
      );
      await still.context.close();
    }
    facts.movingUnderReducedMotion = movingStill;

    const narrow = await open({
      viewport: { width: 320, height: 700 },
      colorScheme: 'light',
    });
    await narrow.page.goto(url, { waitUntil: 'load' });
    facts.sidewaysScrollAt320 = await narrow.page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    await narrow.context.close();

    // Whether dark mode changes anything at all.
    const backgrounds = [];
    for (const colorScheme of ['light', 'dark']) {
      const { context, page } = await open({ viewport: PHONE, colorScheme });
      await page.goto(url, { waitUntil: 'load' });
      backgrounds.push(
        await page.evaluate(
          () => getComputedStyle(document.body).backgroundColor,
        ),
      );
      await context.close();
    }
    facts.followsSystemDarkMode = backgrounds[0] !== backgrounds[1];
    facts.pageBytes = pageBytes;
  } catch (error) {
    facts.captureError = String(error.message ?? error).slice(0, 400);
  } finally {
    await browser.close();
    server.close();
  }
  facts.pageErrors = [...errors].slice(0, 10);
  facts.outsideHosts = [...outside];
  writeFileSync(join(out, 'facts.json'), JSON.stringify(facts, null, 2));
  return facts;
}
