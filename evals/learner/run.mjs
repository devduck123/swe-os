#!/usr/bin/env node
// The learner test: does each track stop teach its target reader what it means to?
// Claude reads every stop in character as that reader (see reader.md), with the collapsed
// "Going deeper" blocks removed, and reports its takeaway, where it got lost, and scores.
// Each reader runs in an empty folder with an empty home folder, like the other evals, and logs
// in with CLAUDE_CODE_OAUTH_TOKEN. Start it from a normal terminal.
//
//   node evals/learner/run.mjs                     every stop, 2 readers each
//   node evals/learner/run.mjs --only 5,6 --readers 3
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { frontmatter } from '../../src/lib/routes.mjs';
import {
  ISOLATION,
  checkReady,
  claude,
  repo,
  stopReasonFor,
} from '../harness/common.mjs';
import { mainPath } from './main-path.mjs';

const { values: opts } = parseArgs({
  options: {
    only: { type: 'string' },
    readers: { type: 'string', default: '2' },
    budget: { type: 'string', default: '10' },
    parallel: { type: 'string', default: '4' },
  },
});
checkReady();

// The track, in order: every guide or recipe with a `track` number.
const stops = ['core/guides', 'core/recipes']
  .flatMap((dir) =>
    readdirSync(join(repo, dir))
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => `${dir}/${f}`),
  )
  .map((file) => ({
    file,
    ...frontmatter(readFileSync(join(repo, file), 'utf8')),
  }))
  .filter((s) => s.track)
  .filter(
    (s) => !opts.only || opts.only.split(',').map(Number).includes(s.track),
  )
  .sort((a, b) => a.track - b.track);

const reader = readFileSync(join(import.meta.dirname, 'reader.md'), 'utf8');
let spent = 0;

async function read(stop) {
  const prompt = `${reader}\n\n## The stop: ${stop.title}\n\n${mainPath(readFileSync(join(repo, stop.file), 'utf8'))}`;
  // An empty folder: run from the repo, the reader also got this repo's CLAUDE.md.
  const room = mkdtempSync(join(tmpdir(), 'reader-'));
  const r = await claude(
    [
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      '--tools',
      '',
      ...ISOLATION,
      '--',
      prompt,
    ],
    room,
  );
  rmSync(room, { recursive: true, force: true });
  spent += r.cost;
  if (r.error || !r.reply)
    return { error: (r.error || 'no reply').slice(0, 300) };
  const text = r.reply.replace(/```(?:json)?/g, '');
  try {
    return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch {
    return { error: `unparseable: ${text.slice(0, 200)}` };
  }
}

const started = new Date().toISOString().slice(0, 19).replaceAll(':', '');
const root = join(repo, 'evals/learner/results', started);
mkdirSync(root, { recursive: true });
const jobs = stops.flatMap((s) =>
  Array.from({ length: Number(opts.readers) }, () => s),
);
const results = new Map(stops.map((s) => [s.track, []]));
const queue = [...jobs];
await Promise.all(
  Array.from({ length: Number(opts.parallel) }, async () => {
    while (queue.length && spent < Number(opts.budget)) {
      const stop = queue.shift();
      const r = await read(stop);
      if (stopReasonFor(r.error)) {
        queue.length = 0;
        console.error(`Stopped: ${r.error}`);
        break;
      }
      results.get(stop.track).push(r);
      console.log(
        `${stop.track}. ${stop.title}: ${r.error ? 'ERROR ' + r.error.slice(0, 80) : `clarity ${r.clarity}, usefulness ${r.usefulness}, match ${r.match}`}`,
      );
    }
  }),
);

const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const fmt = (n) => (n == null ? '–' : n.toFixed(1));
const rows = [];
const all = { clarity: [], usefulness: [], matched: 0, read: 0 };
for (const s of stops) {
  const rs = results.get(s.track).filter((r) => !r.error);
  writeFileSync(
    join(root, `${String(s.track).padStart(2, '0')}.json`),
    JSON.stringify(rs, null, 2),
  );
  if (!rs.length) continue;
  const c = mean(rs.map((r) => r.clarity));
  const u = mean(rs.map((r) => r.usefulness));
  all.clarity.push(c);
  all.usefulness.push(u);
  all.read++;
  if (rs.every((r) => r.match === 'yes')) all.matched++;
  const lost = rs
    .flatMap((r) => r.lost_at ?? [])
    .map((l) => `"${l.quote}"`)
    .slice(0, 3)
    .join('; ');
  rows.push(
    `| ${s.track} | ${s.title} | ${fmt(c)} | ${fmt(u)} | ${rs.map((r) => r.match).join(', ')} | ${lost} |`,
  );
}
writeFileSync(
  join(root, 'summary.md'),
  [
    `# Learner test ${started}`,
    '',
    `${opts.readers} reader(s) per stop, graded by Claude in character as the reader in \`reader.md\`. Spent $${spent.toFixed(2)} API-equivalent.`,
    '',
    `**Clarity ${fmt(mean(all.clarity))}, usefulness ${fmt(mean(all.usefulness))}** (1–5). Every reader's takeaway matched the intended lesson on ${all.matched} of ${all.read} stops.`,
    '',
    '| # | Stop | Clarity | Usefulness | Match | Lost at |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n'),
);
console.log(`\nSummary: ${join(root, 'summary.md')}`);
