// Monthly upkeep: which fast-moving pages are due for a re-check, and which outside links broke.
// Prints a Markdown report. Prints nothing when everything is fine, so the workflow
// only opens an issue when there's work to do. Run it locally: `node scripts/freshness.mjs`.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { frontmatter, root } from '../src/lib/routes.mjs';

const MAX_AGE_DAYS = 90;
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;

const markdownIn = (dir) =>
  readdirSync(join(root, dir), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) =>
      join(entry.parentPath, entry.name)
        .slice(root.length + 1)
        .replaceAll('\\', '/'),
    );
const files = ['core', 'profile', 'skills', 'templates'].flatMap(markdownIn);

// 1. Fast-moving pages whose claims haven't been checked in a while.
const now = Date.now();
const stale = [];
for (const file of files) {
  const data = frontmatter(readFileSync(join(root, file), 'utf8'));
  if (data.freshness !== 'fast-moving') continue;
  const reviewed = data.reviewed ? new Date(data.reviewed) : null;
  const age = reviewed ? Math.floor((now - reviewed) / 86_400_000) : Infinity;
  if (age > MAX_AGE_DAYS)
    stale.push(`- \`${file}\`: last checked ${data.reviewed ?? 'never'}`);
}

// 2. Outside links that no longer resolve.
const links = new Map();
for (const file of files) {
  const text = readFileSync(join(root, file), 'utf8');
  for (const [, url] of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
    if (!links.has(url)) links.set(url, new Set());
    links.get(url).add(file);
  }
}
const check = async (url) => {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent':
          'swe-os-freshness/1.0 (+https://github.com/devduck123/swe-os)',
      },
    });
    await res.body?.cancel();
    return res.status;
  } catch (error) {
    return error.name === 'TimeoutError' ? 'timeout' : 'error';
  }
};
const queue = [...links.keys()];
const results = [];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const url = queue.shift();
      results.push([url, await check(url)]);
    }
  }),
);
// 404 and 410 mean the page is gone. Bot walls (401, 403, 429) and timeouts usually aren't
// the link's fault, so they're listed separately and don't open an issue on their own.
const gone = [];
const unchecked = [];
for (const [url, status] of results.sort()) {
  const where = [...links.get(url)].map((f) => `\`${f}\``).join(', ');
  if (status === 404 || status === 410 || status === 'error')
    gone.push(`- ${url} (${status}) in ${where}`);
  else if (typeof status !== 'number' || status >= 400)
    unchecked.push(`- ${url} (${status}) in ${where}`);
}

if (stale.length || gone.length) {
  const section = (title, items) =>
    items.length ? [`## ${title}`, '', ...items, ''] : [];
  console.log(
    [
      `Checked ${files.length} files and ${links.size} outside links.`,
      '',
      ...section(
        `Fast-moving pages not checked in ${MAX_AGE_DAYS} days`,
        stale,
      ),
      ...section('Links that are gone', gone),
      ...section("Links a bot couldn't check (open them by hand)", unchecked),
    ].join('\n'),
  );
} else {
  console.error(
    `All fresh: ${files.length} files, ${links.size} links, ${unchecked.length} couldn't be checked by a bot.`,
  );
}
