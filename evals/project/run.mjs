#!/usr/bin/env node
// The project eval: a person builds a whole app with Claude Code, once without SWE OS (A) and
// once with it (B). Each scripted turn starts a fresh session by default, the way SWE OS says to
// work. Then each final repo is installed, tested, built, and reviewed blind. Runs on whatever
// Claude account the `claude` CLI is logged into. Start it from a normal terminal, not inside a
// Claude Code session. See README.md.
//
//   node evals/project/run.mjs                        both arms, $120 budget, $12 per message
//   node evals/project/run.mjs --sessions one         every turn in one long session per arm
//   node evals/project/run.mjs --dry-run              print the plan, spend nothing
//   node evals/project/run.mjs --fixed-answers        answer questions with the fixed facts
//   node evals/project/run.mjs --grade <results dir>  redo the checks and reviews of a finished run
import { execFileSync, spawn } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import {
  ALLOWED,
  DENIED,
  ISOLATION,
  asksQuestion,
  claude,
  pointer,
  refuseNested,
  repo,
  snapshotSweos,
  stopReasonFor,
} from '../harness/common.mjs';
import { parseGrade } from '../harness/parse-grade.mjs';
import {
  CHECKS,
  NO_REPLY,
  PREAMBLE,
  blindRepo,
  completeReviewPrompt,
  loadProject,
  renderSummary,
  reviewGaps,
  reviewPrompt,
  userPrompt,
} from './project.mjs';

const { values: opts } = parseArgs({
  options: {
    budget: { type: 'string', default: '120' },
    'per-turn': { type: 'string', default: '12' },
    'review-budget': { type: 'string', default: '3' },
    'fixed-answers': { type: 'boolean', default: false },
    sessions: { type: 'string', default: 'fresh' },
    'dry-run': { type: 'boolean', default: false },
    grade: { type: 'string' },
    out: { type: 'string' },
  },
});
const PROJECT = 'book-club';
const project = loadProject(
  readFileSync(join(import.meta.dirname, `${PROJECT}.md`), 'utf8'),
);
if (!['fresh', 'one'].includes(opts.sessions))
  throw new Error(`--sessions is fresh or one, not "${opts.sessions}"`);
// Fresh: every scripted turn starts a new session in the same folder, and only the simulated
// user's answers resume it. One: the whole build is one long session.
const fresh = opts.sessions === 'fresh';
const budget = Number(opts.budget);
const reviewReserve = 2 * Number(opts['review-budget']);
const TURN_TIMEOUT = 45 * 60_000;
// The simulated user answers at most this many questions per scripted turn, for this much each.
const ANSWERS_PER_TURN = 2;
const USER_BUDGET = '1';
const CHECK_TIMEOUT = 10 * 60_000;
let spent = 0;
// Set when a message fails in a way every later one would too, like a login or usage limit.
let stopReason = null;

const started = new Date().toISOString().slice(0, 19).replaceAll(':', '');
const newRoot = (name, n = 1) => {
  const dir = join(
    import.meta.dirname,
    'results',
    n === 1 ? name : `${name}-${n}`,
  );
  return existsSync(dir) ? newRoot(name, n + 1) : dir;
};
const root = opts.grade
  ? resolve(opts.grade)
  : opts.out
    ? resolve(opts.out)
    : newRoot(started);

const agentArgs = (arm, sweos) => [
  '-p',
  '--output-format',
  'stream-json',
  '--verbose',
  ...ISOLATION,
  '--permission-mode',
  'acceptEdits',
  '--max-budget-usd',
  opts['per-turn'],
  '--allowedTools',
  ...ALLOWED,
  '--disallowedTools',
  ...DENIED,
  ...(arm === 'B' ? ['--add-dir', sweos] : []),
];

// The simulated user: no tools, the same isolation as the agents, and an empty folder, so no
// project's CLAUDE.md or AGENTS.md reaches it. Identical for both arms.
const userArgs = (prompt) => [
  '-p',
  '--output-format',
  'stream-json',
  '--verbose',
  ...ISOLATION,
  '--tools',
  '',
  '--max-budget-usd',
  USER_BUDGET,
  '--',
  prompt,
];

// The reviewer can read the repo and run its tests and build, nothing else.
const reviewerArgs = (prompt, resume) => [
  '-p',
  '--output-format',
  'stream-json',
  '--verbose',
  ...ISOLATION,
  '--tools',
  'Read,Grep,Glob,Bash',
  '--allowedTools',
  'Read',
  'Grep',
  'Glob',
  'Bash(npm test:*)',
  'Bash(npm run test:*)',
  'Bash(npm run build:*)',
  'Bash(ls:*)',
  '--max-budget-usd',
  opts['review-budget'],
  ...(resume ? ['--resume', resume] : []),
  '--',
  prompt,
];

// npm install, npm test, npm run build. Each gets its own process group, so a timeout or a
// database a test left running gets killed with it.
function runCheck(args, cwd) {
  return new Promise((done) => {
    const t0 = Date.now();
    const child = spawn('npm', args, {
      cwd,
      detached: true,
      env: { ...process.env, CI: '1', NEXT_TELEMETRY_DISABLED: '1' },
    });
    let out = '';
    const keep = (chunk) => (out = (out + chunk).slice(-20_000));
    child.stdout.on('data', keep);
    child.stderr.on('data', keep);
    let timedOut = false;
    const killGroup = (signal) => {
      try {
        process.kill(-child.pid, signal);
      } catch {}
    };
    const timer = setTimeout(() => {
      timedOut = true;
      killGroup('SIGKILL');
    }, CHECK_TIMEOUT);
    let finished = false;
    const finish = (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      killGroup('SIGTERM');
      done({
        command: ['npm', ...args].join(' '),
        ok: code === 0 && !timedOut,
        code,
        timedOut,
        seconds: Math.round((Date.now() - t0) / 1000),
        tail: out.slice(-3000),
      });
    };
    child.on('error', (e) => {
      keep(String(e));
      finish(-1);
    });
    child.on('close', finish);
  });
}

function gitInfo(work) {
  const git = (...args) => {
    try {
      return execFileSync('git', args, {
        cwd: work,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return null;
    }
  };
  const top = git('rev-parse', '--show-toplevel');
  if (!top || realpathSync(top) !== realpathSync(work))
    return { repo: false, commits: 0, ignored: [], uncommitted: [] };
  const lines = (text) => (text ? text.split('\n').filter(Boolean) : []);
  return {
    repo: true,
    commits: Number(git('rev-list', '--count', 'HEAD') ?? 0),
    ignored: lines(
      git(
        'ls-files',
        '--others',
        '--ignored',
        '--exclude-standard',
        '--directory',
      ),
    )
      .filter((p) => !/^(node_modules|\.next)\/?$/.test(p))
      .slice(0, 40),
    uncommitted: lines(git('status', '--porcelain')).slice(0, 40),
  };
}

const notCopied = (src) => {
  if (/[\\/](node_modules|\.git|\.next)([\\/]|$)/.test(src)) return false;
  const stat = lstatSync(src, { throwIfNoEntry: false });
  return !!stat && !stat.isSocket() && !stat.isFIFO();
};

function transcript(arm, turns) {
  return [
    `# Arm ${arm}`,
    '',
    ...turns.flatMap((t) => [
      `## Message ${t.n} (turn ${t.scripted}${t.kind === 'answer' ? ', an answer to its question' : ''}${t.newSession ? ', a new session' : ''})`,
      '',
      `**Sent:** ${t.sent}`,
      '',
      `$${t.cost.toFixed(2)}, ${t.seconds}s, ${t.agentTurns} agent turns${t.error ? `. Error: ${t.error.slice(0, 300)}` : ''}`,
      '',
      '**Commands**',
      '',
      ...(t.commands.length
        ? t.commands.map((c) => `- ${c.replace(/\n/g, ' ').slice(0, 300)}`)
        : ['- none']),
      '',
      '**Reply**',
      '',
      t.reply,
      '',
      ...(t.user && !t.user.answer
        ? [
            `_The simulated user didn't answer${t.user.error ? `: ${t.user.error.slice(0, 200)}` : ' (it only asked whether to keep going)'}._`,
            '',
          ]
        : []),
    ]),
  ].join('\n');
}

const sumOf = (turns, key) => turns.reduce((n, t) => n + t[key], 0);

// Saves an arm's final repo (without node_modules, .next, or .git), transcripts, and JSON.
function saveArm(a) {
  const dir = join(root, 'runs', a.arm);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(a.work, join(dir, 'repo'), {
    recursive: true,
    verbatimSymlinks: true,
    filter: notCopied,
  });
  for (const file of readdirSync(a.home).filter((f) => f.endsWith('.jsonl')))
    cpSync(join(a.home, file), join(dir, file));
  writeFileSync(join(dir, 'transcript.md'), transcript(a.arm, a.turns));
  const data = {
    arm: a.arm,
    sweos: a.arm === 'B',
    sessions: opts.sessions,
    model: a.model ?? null,
    cost: sumOf(a.turns, 'cost'),
    seconds: sumOf(a.turns, 'seconds'),
    turns: a.turns,
    git: gitInfo(a.work),
  };
  writeFileSync(join(root, `${a.arm}.json`), JSON.stringify(data, null, 2));
  return data;
}

async function gradeArm(arm, data, sweos) {
  const dir = join(root, 'runs', arm);
  // A neutral folder name: the reviewer sees its working directory, which shouldn't say A or B.
  const copy = join(mkdtempSync(join(tmpdir(), 'review-')), PROJECT);
  cpSync(join(dir, 'repo'), copy, {
    recursive: true,
    verbatimSymlinks: true,
  });
  data.blindedLines = blindRepo(copy, sweos);
  data.checks = {};
  for (const [name, args] of Object.entries(CHECKS)) {
    data.checks[name] = await runCheck(args, copy);
    console.log(
      `${arm} ${data.checks[name].command}: ${data.checks[name].ok ? 'pass' : 'FAIL'}, ${data.checks[name].seconds}s`,
    );
  }
  const prompt = reviewPrompt({
    project,
    turns: data.turns,
    checks: data.checks,
    git: data.git,
    sweos,
  });
  writeFileSync(join(dir, 'review-prompt.md'), prompt);
  const r = await claude(
    reviewerArgs(prompt),
    copy,
    join(dir, 'review-transcript.jsonl'),
    {
      timeoutMs: 30 * 60_000,
    },
  );
  spent += r.cost;
  stopReason = stopReasonFor(r.error) ?? stopReason;
  let review = r.error ? { error: r.error } : parseGrade(r.reply);
  let cost = r.cost;
  // A review missing scores or reasons gets one request to finish it, in the same session.
  const gaps = reviewGaps(review);
  if (gaps.length && r.sessionId && !stopReason) {
    const more = await claude(
      reviewerArgs(completeReviewPrompt(gaps), r.sessionId),
      copy,
      join(dir, 'review-transcript-2.jsonl'),
      { timeoutMs: 10 * 60_000 },
    );
    spent += more.cost;
    cost += more.cost;
    stopReason = stopReasonFor(more.error) ?? stopReason;
    const fuller = more.error ? null : parseGrade(more.reply);
    if (fuller?.scores && reviewGaps(fuller).length < gaps.length)
      review = fuller;
  }
  data.review = { ...review, cost };
  console.log(
    `${arm} review: $${cost.toFixed(2)}${data.review.error ? `, ERROR ${data.review.error.slice(0, 120)}` : ''}`,
  );
  rmSync(dirname(copy), { recursive: true, force: true });
  writeFileSync(join(root, `${arm}.json`), JSON.stringify(data, null, 2));
}

async function gradeAndSummarize(info, arms) {
  console.log('\nChecking and reviewing...');
  for (const arm of ['A', 'B']) {
    if (stopReason) break;
    await gradeArm(arm, arms[arm], info.sweos);
  }
  info.spent = (info.spent ?? 0) + spent;
  writeFileSync(join(root, 'round.json'), JSON.stringify(info, null, 2));
  if (stopReason)
    throw new Error(`${stopReason}, then finish grading: --grade ${root}`);
  writeFileSync(join(root, 'summary.md'), renderSummary(info, arms));
  console.log(`\nSummary: ${join(root, 'summary.md')}`);
}

// ---- main

if (opts['dry-run']) {
  const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: repo,
    encoding: 'utf8',
  }).trim();
  console.log(
    [
      `Project eval "${PROJECT}": ${project.turns.length} turns, sent in order${fresh ? ', each in a new session in the same folder' : ' to one session per arm'}. Turns alternate A, B, A, B so a budget stop leaves both at the same point.`,
      `A runs without SWE OS. B gets a snapshot of SWE OS at ${commit} (--add-dir) and ${fresh ? 'each turn' : 'its first message'} starts with: ${pointer('<snapshot>').trim()}`,
      ...(fresh
        ? [
            `Every turn after the first, in both arms, also starts with: ${PREAMBLE.trim()}`,
          ]
        : []),
      `Budget $${budget} overall, $${opts['per-turn']} per message, $${opts['review-budget']} per review. Results in ${root}.`,
      '',
      ...project.turns.map(
        (t, i) => `${i + 1}. ${t.length > 110 ? `${t.slice(0, 110)}...` : t}`,
      ),
      '',
      opts['fixed-answers']
        ? `If a turn ends with a question, the agent gets one answer: "Answers to your questions: ${project.facts.slice(0, 90)}..."`
        : `If a message ends with a question, a separate Claude playing the owner answers it from the facts, at most ${ANSWERS_PER_TURN} times per turn ($${USER_BUDGET} each). It never says "go ahead".`,
      'Then, on a blinded copy of each final repo: npm install, npm test, npm run build (10 minutes each), and one blind reviewer.',
    ].join('\n'),
  );
  process.exit(0);
}

refuseNested();

if (opts.grade) {
  const info = JSON.parse(readFileSync(join(root, 'round.json'), 'utf8'));
  const arms = Object.fromEntries(
    ['A', 'B'].map((arm) => [
      arm,
      JSON.parse(readFileSync(join(root, `${arm}.json`), 'utf8')),
    ]),
  );
  await gradeAndSummarize(info, arms);
  process.exit(0);
}

mkdirSync(root, { recursive: true });
// The real path: on macOS the temp folder is a symlink, and blinding has to match the path the
// agent sees and repeats.
const sweos = join(
  realpathSync(mkdtempSync(join(tmpdir(), 'swe-os-'))),
  'swe-os',
);
const commit = snapshotSweos(sweos);
const info = {
  project: PROJECT,
  started,
  commit,
  budget,
  perTurn: Number(opts['per-turn']),
  answers: opts['fixed-answers'] ? 'fixed' : 'simulated',
  sessions: opts.sessions,
  turns: project.turns.length,
  sweos,
};
writeFileSync(join(root, 'round.json'), JSON.stringify(info, null, 2));
console.log(
  `Project eval ${started}: ${PROJECT} on SWE OS ${commit}, budget $${budget}.`,
);

// Each arm builds in its own empty folder, named like a real project, never "A" or "B".
const arms = ['A', 'B'].map((arm) => {
  const home = mkdtempSync(join(tmpdir(), 'project-'));
  const work = join(home, PROJECT);
  mkdirSync(work);
  return {
    arm,
    home,
    work,
    session: null,
    turns: [],
    model: null,
    dead: false,
  };
});

// What a scripted turn's message starts with. In a fresh session, B's pointer comes first on
// every turn, and both arms get the same preamble after turn 1, since the chat is gone. In one
// long session, only B's first message gets the pointer.
function opening(a, scripted) {
  if (!fresh && scripted > 1) return '';
  return (
    (a.arm === 'B' ? pointer(sweos) : '') +
    (fresh && scripted > 1 ? PREAMBLE : '')
  );
}

async function send(a, text, kind, scripted) {
  const n = a.turns.length + 1;
  const newSession = kind === 'scripted' && (fresh || !a.session);
  const prompt = kind === 'scripted' ? opening(a, scripted) + text : text;
  const t0 = Date.now();
  const r = await claude(
    [
      ...agentArgs(a.arm, sweos),
      ...(newSession ? [] : ['--resume', a.session]),
      '--',
      prompt,
    ],
    a.work,
    join(a.home, `transcript-${n}.jsonl`),
    { timeoutMs: TURN_TIMEOUT },
  );
  a.session = r.sessionId ?? (newSession ? null : a.session);
  a.model ??= r.model;
  spent += r.cost;
  const turn = {
    n,
    scripted,
    kind,
    newSession,
    sent: text,
    reply: r.reply,
    commands: r.commands,
    cost: r.cost,
    seconds: Math.round((Date.now() - t0) / 1000),
    agentTurns: r.turns,
    error: r.error,
  };
  a.turns.push(turn);
  stopReason = stopReasonFor(r.error) ?? stopReason;
  console.log(
    `${a.arm} turn ${scripted}${kind === 'answer' ? ' (answer)' : ''}: $${r.cost.toFixed(2)}, ${turn.seconds}s${r.error ? `, ERROR ${r.error.slice(0, 120)}` : ''}  (spent $${spent.toFixed(2)})`,
  );
  return turn;
}

// The simulated user's reply to the question that ends message t, recorded on t. Null when it
// declines (the agent only asked whether to keep going) or fails.
async function userAnswer(a, t) {
  const prompt = userPrompt({
    facts: project.facts,
    messages: a.turns.map((m) => m.sent),
    reply: t.reply,
    sweos,
  });
  const dir = mkdtempSync(join(tmpdir(), 'owner-'));
  const r = await claude(
    userArgs(prompt),
    dir,
    join(a.home, `user-${t.n}.jsonl`),
    { timeoutMs: 5 * 60_000 },
  );
  rmSync(dir, { recursive: true, force: true });
  spent += r.cost;
  stopReason = stopReasonFor(r.error) ?? stopReason;
  const said = r.reply.trim();
  t.user = {
    answer: r.error || !said || said.includes(NO_REPLY) ? null : said,
    cost: r.cost,
    ...(r.error ? { error: r.error } : {}),
  };
  console.log(
    `${a.arm} simulated user: ${t.user.answer ? JSON.stringify(t.user.answer.slice(0, 160)) : r.error ? `ERROR ${r.error.slice(0, 120)}` : 'no answer'}`,
  );
  return t.user.answer;
}

// One scripted turn for one arm. A message that errors (its per-message budget ran out, a
// timeout) doesn't end the build: like a real person, the next turn carries on. Without a
// session to resume, its questions go unanswered, and in one long session the arm stops.
async function turn(a, text, scripted) {
  if (a.dead) return;
  const r = await send(a, text, 'scripted', scripted);
  if (stopReason) return;
  if (!a.session) {
    a.dead = !fresh;
    return;
  }
  // Answer questions at most twice per turn, the same way for both arms. Never a "go ahead".
  // With --fixed-answers, one answer per turn: the facts, whatever was asked.
  const fixed = opts['fixed-answers'];
  let last = r;
  for (
    let i = 0;
    i < (fixed ? 1 : ANSWERS_PER_TURN) &&
    !last.error &&
    asksQuestion(last.reply);
    i++
  ) {
    const answer = fixed
      ? `Answers to your questions: ${project.facts}`
      : await userAnswer(a, last);
    if (stopReason || !answer) return;
    last = await send(a, answer, 'answer', scripted);
    if (stopReason) return;
  }
}

let lastRound = 0;
for (const [i, text] of project.turns.entries()) {
  if (stopReason) break;
  // Stop before a round of turns that probably won't fit, judged by the last round's cost.
  if (spent + lastRound + reviewReserve > budget) {
    info.stopped = `Stopped before turn ${i + 1} of ${project.turns.length}: $${spent.toFixed(2)} spent, and the last turn cost $${lastRound.toFixed(2)} for both arms.`;
    console.log(info.stopped);
    break;
  }
  const before = spent;
  for (const a of arms) {
    if (stopReason) break;
    await turn(a, text, i + 1);
  }
  lastRound = spent - before;
}

const saved = Object.fromEntries(arms.map((a) => [a.arm, saveArm(a)]));
// The saved copies are enough. The temp folders hold installed packages, often over 500 MB.
for (const a of arms) rmSync(a.home, { recursive: true, force: true });
rmSync(dirname(sweos), { recursive: true, force: true });
info.spent = spent;
spent = 0;
writeFileSync(join(root, 'round.json'), JSON.stringify(info, null, 2));
if (stopReason)
  throw new Error(
    `${stopReason}. What finished is in ${join(root, 'runs')}. A half-built project isn't worth grading, so rerun the whole eval once it resets.`,
  );
await gradeAndSummarize(info, saved);
