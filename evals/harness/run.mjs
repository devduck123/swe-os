#!/usr/bin/env node
// Runs the evals headless with Claude Code: each scenario once without SWE OS (A) and once with
// it (B), then grades every run blind and writes a summary. Runs on whatever Claude account the
// `claude` CLI is logged into. Start it from a normal terminal, not inside a Claude Code session.
//
//   node evals/harness/run.mjs                      every scenario, 1 rep, $50 budget
//   node evals/harness/run.mjs --only overhead,secrets --reps 3 --budget 20
//   node evals/harness/run.mjs --dry-run            print what would run, spend nothing
//   node evals/harness/run.mjs --grade <results dir> grade what's ungraded in a past round, re-summarize
//   node evals/harness/run.mjs --round <results dir> --only receipt-gallery
//                                                   rerun scenarios into a past round, at its SWE OS commit
//   node evals/harness/run.mjs --round <results dir> --only receipt-gallery --resume
//                                                   same, but keep the runs that already finished
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { scenarios } from './scenarios.mjs';
import { hideRunFolder, hideSweos, neutralize } from './neutralize.mjs';
import { combineGrades, parseGrade } from './parse-grade.mjs';
import {
  ALLOWED,
  DENIED,
  ISOLATION,
  asksQuestion,
  claude,
  pointer,
  refuseNested,
  repo,
  section,
  snapshotSweos,
  stopReasonFor,
} from './common.mjs';

const { values: opts } = parseArgs({
  options: {
    only: { type: 'string' },
    reps: { type: 'string' },
    budget: { type: 'string', default: '50' },
    parallel: { type: 'string', default: '2' },
    'per-run': { type: 'string', default: '5' },
    graders: { type: 'string', default: '2' },
    'dry-run': { type: 'boolean', default: false },
    grade: { type: 'string' },
    round: { type: 'string' },
    resume: { type: 'boolean', default: false },
  },
});
const budget = Number(opts.budget);
const reps = Number(opts.reps ?? 1);
let spent = 0;
// Set when a run fails in a way every later run would too, so the round stops early.
let stopReason = null;

const scenarioText = (s) =>
  readFileSync(
    resolve(repo, 'evals/scenarios', `${s.file ?? s.id}.md`),
    'utf8',
  );

function setUp(s, dir) {
  const work = join(dir, 'work');
  mkdirSync(work, { recursive: true });
  if (s.fixture)
    cpSync(resolve(repo, 'evals/fixtures', s.fixture), work, {
      recursive: true,
    });
  restoreDotfiles(work);
  if (s.git) {
    const git = (...args) =>
      execFileSync('git', args, { cwd: work, stdio: 'ignore' });
    git('init', '-q', '-b', 'main');
    git('add', '-A');
    git(
      '-c',
      'user.name=dev',
      '-c',
      'user.email=dev@example.com',
      'commit',
      '-qm',
      'Initial commit',
    );
    if (s.pr) {
      git('checkout', '-q', '-b', s.pr.branch);
      cpSync(join(repo, 'evals/fixtures', s.pr.fixture), work, {
        recursive: true,
      });
      restoreDotfiles(work);
      git('add', '-A');
      git(
        '-c',
        'user.name=dev',
        '-c',
        'user.email=dev@example.com',
        'commit',
        '-qm',
        s.pr.message,
      );
    }
  }
  // The diff the grader sees starts here, so a PR waiting for review isn't counted as the agent's work.
  cpSync(work, join(dir, 'before'), {
    recursive: true,
    filter: (src) => !src.split(/[\\/]/).includes('.git'),
  });
  return work;
}

// Dotfiles are stored as name.fixture so they don't affect this repo: env.fixture -> .env.
function restoreDotfiles(work) {
  for (const file of readdirSync(work, { recursive: true }))
    if (String(file).endsWith('.fixture'))
      renameSync(
        join(work, file),
        join(work, String(file).replace(/([^/]+)\.fixture$/, '.$1')),
      );
}

async function runOne(s, arm, rep, root, sweos) {
  const dir = join(root, 'runs', `${s.id}-${arm}-${rep}`);
  const work = setUp(s, dir);
  const base = [
    '-p',
    '--output-format',
    'stream-json',
    '--verbose',
    ...ISOLATION,
    '--permission-mode',
    'acceptEdits',
    '--max-budget-usd',
    opts['per-run'],
    '--allowedTools',
    ...ALLOWED,
    '--disallowedTools',
    ...DENIED,
    ...(arm === 'B' ? ['--add-dir', sweos] : []),
  ];
  const turns = [];
  let session;
  const send = async (text, i) => {
    const prompt = i === 0 && arm === 'B' ? pointer(sweos) + text : text;
    const args = [
      ...base,
      ...(session ? ['--resume', session] : []),
      '--',
      prompt,
    ];
    const r = await claude(args, work, join(dir, `transcript-${i + 1}.jsonl`));
    session = r.sessionId ?? session;
    spent += r.cost;
    turns.push({ sent: text, ...r });
    return r;
  };
  for (const [i, text] of s.turns.entries()) {
    const r = await send(text, i);
    if (r.error) break;
    // Answer a clarifying question once, with the scenario's facts, the same way for both arms.
    if (i === 0 && s.ifAsked && asksQuestion(r.reply))
      await send(`Answers to your questions: ${s.ifAsked}`, turns.length);
  }
  let diff = '';
  try {
    execFileSync(
      'diff',
      [
        '-ruN',
        '-x',
        'node_modules',
        '-x',
        '.git',
        '-x',
        '.next',
        'before',
        'work',
      ],
      { cwd: dir, encoding: 'utf8', maxBuffer: 50e6 },
    );
  } catch (e) {
    diff = String(e.stdout ?? '');
  }
  writeFileSync(join(dir, 'diff.patch'), diff);
  // Imported here so only scenarios with screenshots need a browser installed.
  if (s.capture) {
    const { capture } = await import('./capture.mjs');
    await capture(work, join(dir, 'shots'), s.capture);
  }
  const meta = {
    scenario: s.id,
    arm,
    rep,
    cost: turns.reduce((n, t) => n + t.cost, 0),
    seconds: Math.round(turns.reduce((n, t) => n + t.ms, 0) / 1000),
    model: turns[0]?.model,
    skillsAvailable: turns[0]?.skills,
    error: turns.find((t) => t.error)?.error ?? null,
    // Commands the permission settings blocked. A run that couldn't open its own page because a
    // check was blocked isn't the same as one that never tried.
    denied: turns.flatMap((t) => t.denied ?? []),
    turns: turns.map(({ sent, reply, commands, cost, turns: n }) => ({
      sent,
      reply,
      commands,
      cost,
      agentTurns: n,
    })),
  };
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  stopReason = stopReasonFor(meta.error) ?? stopReason;
  console.log(
    `${s.id} ${arm}${rep}: $${meta.cost.toFixed(2)}, ${meta.seconds}s${meta.error ? `, ERROR ${meta.error.slice(0, 120)}` : ''}  (spent $${spent.toFixed(2)})`,
  );
}

async function gradeOne(dir, sweos) {
  const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
  const s = scenarios.find((x) => x.id === meta.scenario);
  const md = scenarioText(s);
  const rubric = readFileSync(join(repo, 'evals/README.md'), 'utf8');
  const conversation = meta.turns
    .map(
      (t, i) =>
        `### Turn ${i + 1}\n\nUser: ${t.sent}\n\nCommands and files the agent touched:\n${
          t.commands
            .map((c) => hideSweos(c, sweos))
            .filter(Boolean)
            .map((c) => `- ${hideRunFolder(c)}`)
            .join('\n') || '- none'
        }\n\nAgent's final reply:\n\n${hideRunFolder(neutralize(t.reply, sweos))}`,
    )
    .join('\n\n');
  const blocked = (meta.denied ?? [])
    .map((c) => hideSweos(c, sweos))
    .filter(Boolean)
    .map((c) => `- ${hideRunFolder(c)}`);
  const harnessLimits = blocked.length
    ? `\n\n## Commands the harness blocked\n\nThe test setup refused these, so the agent couldn't run them. Don't count a blocked check against the agent. Do count it if the agent claimed a result it couldn't have seen, or didn't say what it couldn't check.\n\n${blocked.join('\n')}`
    : '';
  const diff = readFileSync(join(dir, 'diff.patch'), 'utf8').slice(0, 60_000);
  const shots = join(dir, 'shots');
  const seen = existsSync(shots);
  const page = seen
    ? `\n\n## What the page looks like\n\nThe harness opened the result in a browser after the run. These screenshots are in your working folder. Read every one before you score: ${readdirSync(
        shots,
      )
        .filter((f) => f.endsWith('.png'))
        .join(
          ', ',
        )}. Judge what you see, not what the agent says about it.\n\nWhat the harness measured:\n\n\`\`\`json\n${readFileSync(join(shots, 'facts.json'), 'utf8')}\n\`\`\``
    : '';
  const prompt = `You are grading one AI coding agent's work. You don't know how the agent was set up. Judge only the work.

## Scenario

${section(md, 'Task')}

${section(md, 'Starting state')}

## What a strong run does (reviewer-only notes)

${section(md, 'Reviewer-only notes')}

## Rubric

${section(rubric, 'Rubric')}

## The run

${conversation}${harnessLimits}

## Changes to the project (unified diff)

${diff || '(no file changes)'}${page}

Score each rubric dimension 0 to 3, or null if it doesn't apply. Don't reward length. List serious flaws (data loss, a leaked secret, an auth bypass, a fake verification claim) separately.
Reply with only this JSON:
{"scores":{"product_judgment":n,"completeness":n,"simplicity":n,"risk":n,"verification":n,"communication":n${seen ? ',"design":n' : ''}},"serious_flaws":["..."],"reasons":{"product_judgment":"one sentence","completeness":"...","simplicity":"...","risk":"...","verification":"...","communication":"..."${seen ? ',"design":"what looks designed and what looks generated, in one sentence"' : ''}}}`;
  writeFileSync(join(dir, 'grade-prompt.md'), prompt);
  // A neutral folder: a run's own folder is named after its arm, which would unblind the grader.
  const room = mkdtempSync(join(tmpdir(), 'swe-os-grade-'));
  if (seen)
    cpSync(shots, room, {
      recursive: true,
      filter: (src) => !src.endsWith('facts.json'),
    });
  const grade1 = (i) =>
    claude(
      [
        '-p',
        '--output-format',
        'stream-json',
        '--verbose',
        '--tools',
        seen ? 'Read' : '',
        ...(seen ? ['--allowedTools', 'Read'] : []),
        ...ISOLATION,
        '--',
        prompt,
      ],
      room,
      join(dir, `grade-transcript-${i + 1}.jsonl`),
    );
  const results = await Promise.all(
    Array.from({ length: Number(opts.graders) }, (_, i) => grade1(i)),
  );
  rmSync(room, { recursive: true, force: true });
  const cost = results.reduce((n, r) => n + r.cost, 0);
  spent += cost;
  // A grader cut off by a usage limit isn't a grade. Stop, and leave the run ungraded for --grade.
  const stop = results.map((r) => stopReasonFor(r.error)).find(Boolean);
  if (stop)
    throw new Error(
      `${stop}, then grade the rest: --grade ${resolve(dir, '..', '..')}`,
    );
  const grade = combineGrades(results.map((r) => parseGrade(r.reply)));
  // How many screenshots each grader opened, so a grade that never saw the page shows up.
  const looked = seen
    ? results.map((r) => r.commands.filter((c) => c.startsWith('Read')).length)
    : undefined;
  writeFileSync(
    join(dir, 'grade.json'),
    JSON.stringify({ ...grade, cost, looked }, null, 2),
  );
}

// True when a run still needs grading. A grade that failed to parse is re-read from the
// saved grader transcript first, which costs nothing.
const needsGrade = (dir) => {
  if (!existsSync(join(dir, 'grade.json'))) return true;
  const old = JSON.parse(readFileSync(join(dir, 'grade.json'), 'utf8'));
  if (!old.error) return false;
  // Rounds before double grading saved one transcript under this name.
  if (!existsSync(join(dir, 'grade-transcript.jsonl'))) return true;
  const reply = readFileSync(join(dir, 'grade-transcript.jsonl'), 'utf8')
    .split('\n')
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line))
    .findLast((e) => e.type === 'result')?.result;
  const grade = reply ? parseGrade(reply) : old;
  if (grade.error) return true;
  writeFileSync(
    join(dir, 'grade.json'),
    JSON.stringify({ ...grade, cost: old.cost }, null, 2),
  );
  return false;
};

function summarize(root) {
  const runs = readdirSync(join(root, 'runs')).map((name) => {
    const dir = join(root, 'runs', name);
    const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
    const grade = existsSync(join(dir, 'grade.json'))
      ? JSON.parse(readFileSync(join(dir, 'grade.json'), 'utf8'))
      : {};
    const values = Object.values(grade.scores ?? {}).filter(
      (v) => typeof v === 'number',
    );
    return {
      ...meta,
      grade,
      avg: values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null,
    };
  });
  const mean = (xs) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  const fmt = (n, d = 2) => (n == null ? '–' : n.toFixed(d));
  const info = JSON.parse(readFileSync(join(root, 'round.json'), 'utf8'));
  const rows = [];
  const deltas = [];
  for (const s of scenarios) {
    const arm = (a) => runs.filter((r) => r.scenario === s.id && r.arm === a);
    const [A, B] = [arm('A'), arm('B')];
    if (!A.length && !B.length) continue;
    const [a, b] = [
      mean(A.map((r) => r.avg).filter((v) => v != null)),
      mean(B.map((r) => r.avg).filter((v) => v != null)),
    ];
    if (a != null && b != null) deltas.push(b - a);
    const flaws = (rs) => rs.flatMap((r) => r.grade.serious_flaws ?? []).length;
    const blocked = (rs) =>
      fmt(mean(rs.map((r) => (r.denied ?? []).length)), 1);
    rows.push(
      `| ${s.id} | ${fmt(a)} | ${fmt(b)} | ${a != null && b != null ? (b - a >= 0 ? '+' : '') + fmt(b - a) : '–'} | ${flaws(A)} / ${flaws(B)} | ${blocked(A)} / ${blocked(B)} | $${fmt(mean(A.map((r) => r.cost)))} / $${fmt(mean(B.map((r) => r.cost)))} | ${fmt(mean(A.map((r) => r.seconds)), 0)}s / ${fmt(mean(B.map((r) => r.seconds)), 0)}s |`,
    );
  }
  const flawLines = runs.flatMap((r) =>
    (r.grade.serious_flaws ?? []).map(
      (f) => `- ${r.scenario} ${r.arm}${r.rep}: ${f}`,
    ),
  );
  const disputed = runs.flatMap((r) =>
    (r.grade.disputedFlaws ?? []).map(
      (f) => `- ${r.scenario} ${r.arm}${r.rep}: ${f}`,
    ),
  );
  const blind = runs.filter((r) => r.grade.looked?.includes(0));
  const lines = [
    `# Eval round ${info.started}`,
    '',
    `SWE OS at \`${info.commit}\`${info.reruns?.length ? ` (rerun: ${info.reruns.flatMap((r) => r.only).join(', ')})` : ''}, model \`${runs[0]?.model ?? 'unknown'}\`, ${info.reps} rep(s). Spent $${fmt(info.spent ?? spent)} API-equivalent (budget $${info.budget}).`,
    '',
    'Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.',
    '',
    '| Scenario | A | B | B − A | Serious flaws A / B | Blocked commands A / B | Cost A / B | Time A / B |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
    `**Average B − A:** ${fmt(mean(deltas))} across ${deltas.length} scenario${deltas.length === 1 ? '' : 's'}. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.`,
    '',
    '## Serious flaws',
    '',
    ...(flawLines.length ? flawLines : ['None.']),
    '',
    ...(disputed.length
      ? ['Flagged by only one grader, so not counted:', '', ...disputed, '']
      : []),
    ...(blind.length
      ? [
          `**Not trustworthy:** a grader opened no screenshots for ${blind.map((r) => `${r.scenario} ${r.arm}${r.rep}`).join(', ')}.`,
          '',
        ]
      : []),
    'Blocked commands are what the harness refused, averaged per run. When one arm has many more, its Verification score may be about the harness, not the agent.',
    '',
    'Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.',
  ];
  writeFileSync(join(root, 'summary.md'), lines.join('\n') + '\n');
  console.log(`\nSummary: ${join(root, 'summary.md')}`);
}

// ---- main
// Regrade: grade every run in a past round that has no grade yet, or whose grade failed.
if (opts.grade) {
  refuseNested();
  const root = resolve(opts.grade);
  const info = JSON.parse(readFileSync(join(root, 'round.json'), 'utf8'));
  for (const name of readdirSync(join(root, 'runs'))) {
    const dir = join(root, 'runs', name);
    if (needsGrade(dir)) await gradeOne(dir, info.sweos);
  }
  writeFileSync(
    join(root, 'round.json'),
    JSON.stringify({ ...info, spent: (info.spent ?? 0) + spent }, null, 2),
  );
  summarize(root);
  process.exit(0);
}

const picked = opts.only
  ? scenarios.filter((s) => opts.only.split(',').includes(s.id))
  : scenarios;
// --round adds or replaces runs in a past round, against that round's SWE OS commit.
const past = opts.round ? resolve(opts.round) : null;
const pastInfo = past
  ? JSON.parse(readFileSync(join(past, 'round.json'), 'utf8'))
  : null;
const started =
  pastInfo?.started ??
  new Date().toISOString().slice(0, 19).replaceAll(':', '');
// A private round's results have to outlive the run and stay out of this public repo.
function privateResults(folder) {
  const path = resolve(folder);
  const temporary = [tmpdir(), '/tmp', '/private/tmp', '/var/folders'].map(
    (t) => resolve(t),
  );
  if (temporary.some((t) => path === t || path.startsWith(t + sep)))
    throw new Error(
      `EVAL_PRIVATE is ${path}, a temp folder the system clears, so the round's results would be lost. Use a folder you keep, outside this repo.`,
    );
  if (path === repo || path.startsWith(repo + sep))
    throw new Error(
      `EVAL_PRIVATE is ${path}, inside this public repo. Use a folder outside it.`,
    );
  return join(path, 'results');
}
// Two rounds started in the same second get separate folders.
const newRoot = (name, n = 1) => {
  const results = process.env.EVAL_PRIVATE
    ? privateResults(process.env.EVAL_PRIVATE)
    : join(repo, 'evals/results');
  const dir = join(results, n === 1 ? name : `${name}-${n}`);
  return existsSync(dir) ? newRoot(name, n + 1) : dir;
};
const root = past ?? newRoot(started);
const finished = (s, arm, rep) => {
  const meta = join(root, 'runs', `${s.id}-${arm}-${rep}`, 'meta.json');
  return existsSync(meta) && !JSON.parse(readFileSync(meta, 'utf8')).error;
};
// Adding to a round reruns it at its own rep count unless --reps says otherwise.
const jobReps = opts.reps ? reps : (pastInfo?.reps ?? reps);
const jobs = picked
  .flatMap((s) =>
    Array.from({ length: jobReps }, (_, i) =>
      ['A', 'B'].map((arm) => [s, arm, i + 1]),
    ).flat(),
  )
  .filter(([s, arm, rep]) => !(opts.resume && finished(s, arm, rep)));

if (opts['dry-run']) {
  console.log(
    `${jobs.length} runs, then ${jobs.length} grades. Budget $${budget}. Results in ${root}${past ? ` (SWE OS ${pastInfo.commit})` : ''}.`,
  );
  for (const [s, arm, rep] of jobs)
    console.log(
      `- ${s.id} ${arm}${rep}: ${s.turns.length} turn(s)${s.ifAsked ? ' + answers if asked' : ''}, fixture ${s.fixture ?? '(empty folder)'}`,
    );
  process.exit(0);
}

refuseNested();
// A fresh temp folder per round, so a rerun never finds an earlier round's files.
const scratch = mkdtempSync(join(tmpdir(), `swe-os-evals-${started}-`));
mkdirSync(join(root, 'runs'), { recursive: true });
// A resumed round keeps the old path, since grading hides that path from the finished runs' output.
const sweos = opts.resume ? pastInfo.sweos : join(scratch, 'swe-os');
const commit = snapshotSweos(sweos, pastInfo?.commit ?? 'HEAD');
const info = pastInfo
  ? {
      ...pastInfo,
      sweos,
      reruns: [
        ...(pastInfo.reruns ?? []),
        { at: new Date().toISOString(), only: picked.map((s) => s.id) },
      ],
    }
  : { started, commit, reps, budget, sweos };
writeFileSync(join(root, 'round.json'), JSON.stringify(info, null, 2));
console.log(
  `${past ? 'Adding to round' : 'Eval round'} ${started}: ${jobs.length} runs on SWE OS ${commit}, budget $${budget}.`,
);

const queue = [...jobs];
await Promise.all(
  Array.from({ length: Number(opts.parallel) }, async () => {
    while (queue.length) {
      // Leave room for grading, about $0.05 a run, with margin.
      if (spent + jobs.length * 0.1 >= budget) {
        console.log(
          `Stopping: $${spent.toFixed(2)} spent, budget $${budget}. ${queue.length} runs skipped.`,
        );
        queue.length = 0;
        break;
      }
      if (stopReason) break;
      const [s, arm, rep] = queue.shift();
      const name = `${s.id}-${arm}-${rep}`;
      await runOne(s, arm, rep, scratch, sweos);
      // Only meta, replies, diffs, and grades come back to the repo, never installed packages.
      rmSync(join(root, 'runs', name), { recursive: true, force: true });
      cpSync(join(scratch, 'runs', name), join(root, 'runs', name), {
        recursive: true,
        filter: (src) => !/[\\/](node_modules|\.git|\.next)([\\/]|$)/.test(src),
      });
    }
  }),
);

if (stopReason) {
  // Keep the runs that finished. Drop the ones that failed, so a later --round redoes them.
  for (const name of readdirSync(join(root, 'runs'))) {
    const meta = JSON.parse(
      readFileSync(join(root, 'runs', name, 'meta.json'), 'utf8'),
    );
    if (meta.error)
      rmSync(join(root, 'runs', name), { recursive: true, force: true });
  }
  writeFileSync(
    join(root, 'round.json'),
    JSON.stringify({ ...info, spent: (pastInfo?.spent ?? 0) + spent }, null, 2),
  );
  if (!past && readdirSync(join(root, 'runs')).length === 0)
    rmSync(root, { recursive: true, force: true });
  throw new Error(
    `${stopReason}, then finish the round: --round ${root} --only <the scenarios that didn't run>, or --grade ${root} to grade what finished.`,
  );
}
console.log('\nGrading...');
for (const name of readdirSync(join(root, 'runs'))) {
  const dir = join(root, 'runs', name);
  if (needsGrade(dir)) await gradeOne(dir, sweos);
}
writeFileSync(
  join(root, 'round.json'),
  JSON.stringify({ ...info, spent: (pastInfo?.spent ?? 0) + spent }, null, 2),
);
summarize(root);
