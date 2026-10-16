#!/usr/bin/env node
// The learner test: does each track stop teach its target reader what it means to?
// Claude reads every stop in character as that reader (see reader.md), with the collapsed
// "Going deeper" blocks removed, and reports its takeaway, where it got lost, and scores.
// Runs on whatever account the `claude` CLI is logged into, from a normal terminal.
//
//   node evals/learner/run.mjs                     every stop, 2 readers each
//   node evals/learner/run.mjs --only 5,6 --readers 3
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { frontmatter } from '../../src/lib/routes.mjs';
import { mainPath } from './main-path.mjs';

const repo = resolve(import.meta.dirname, '../..');
const { values: opts } = parseArgs({
  options: {
    only: { type: 'string' },
    readers: { type: 'string', default: '2' },
    budget: { type: 'string', default: '10' },
    parallel: { type: 'string', default: '4' },
  },
});
if (process.env.CLAUDECODE)
  throw new Error(
    'Run this from a normal terminal, not inside a Claude Code session.',
  );

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

function read(stop) {
  const prompt = `${reader}\n\n## The stop: ${stop.title}\n\n${mainPath(readFileSync(join(repo, stop.file), 'utf8'))}`;
  return new Promise((done) => {
    const args = [
      '-p',
      '--output-format',
      'json',
      '--tools',
      '',
      '--setting-sources',
      'project,local',
      '--disable-slash-commands',
      '--strict-mcp-config',
      '--',
      prompt,
    ];
    const child = spawn('claude', args, { cwd: repo });
    let out = '';
    child.stdout.on('data', (c) => (out += c));
    child.on('close', () => {
      let result = {};
      try {
        result = JSON.parse(out);
      } catch {}
      spent += result.total_cost_usd ?? 0;
      if (result.is_error || !result.result)
        return done({ error: (result.result ?? out).slice(0, 300) });
      const text = result.result.replace(/```(?:json)?/g, '');
      try {
        done(
          JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)),
        );
      } catch {
        done({ error: `unparseable: ${text.slice(0, 200)}` });
      }
    });
  });
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
      if (
        r.error &&
        /authenticat|OAuth|rate.?limit|usage limit/i.test(r.error)
      ) {
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
