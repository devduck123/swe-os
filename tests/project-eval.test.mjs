import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  DIMENSIONS,
  blindRepo,
  loadProject,
  renderSummary,
  reviewGaps,
  reviewPrompt,
  userPrompt,
} from '../evals/project/project.mjs';

const projectFile = readFileSync('evals/project/book-club.md', 'utf8');
const project = loadProject(projectFile);

test('the project file has seven turns, the facts, and reviewer notes', () => {
  assert.equal(project.turns.length, 7);
  assert.match(
    project.turns[0],
    /^I want to build a small web app for my book club/,
  );
  assert.match(project.turns[1], /I don't have Docker running/);
  assert.match(project.turns[6], /review everything you built/);
  for (const turn of project.turns) assert(projectFile.includes(turn));
  for (const fact of [
    /12 members/,
    /One person organizes/,
    /phone/,
    /Vercel/,
    /No payments/,
  ])
    assert.match(project.facts, fact);
  assert.match(project.notes, /unique constraint/);
});

test('blinding strips SWE OS lines from Markdown and leaves code alone', () => {
  const dir = mkdtempSync(join(tmpdir(), 'blind-'));
  const sweos = '/tmp/x/swe-os';
  writeFileSync(
    join(dir, 'README.md'),
    `# App\n\nBuilt with SWE OS.\nSee ${sweos}/core/concerns/auth.md.\nRun npm test.\n`,
  );
  mkdirSync(join(dir, 'lib'));
  writeFileSync(
    join(dir, 'lib/db.ts'),
    `// SWE OS says use a unique constraint\nexport const path = '${sweos}';\n`,
  );
  mkdirSync(join(dir, 'node_modules'));
  writeFileSync(join(dir, 'node_modules/x.md'), 'SWE OS\n');
  assert.equal(blindRepo(dir, sweos), 2);
  assert.equal(
    readFileSync(join(dir, 'README.md'), 'utf8'),
    '# App\n\nRun npm test.\n',
  );
  assert.equal(
    readFileSync(join(dir, 'lib/db.ts'), 'utf8'),
    "// SWE OS says use a unique constraint\nexport const path = '<docs>';\n",
  );
  assert.equal(
    readFileSync(join(dir, 'node_modules/x.md'), 'utf8'),
    'SWE OS\n',
  );
  rmSync(dir, { recursive: true });
});

test("the reviewer's prompt hides SWE OS and asks for every dimension", () => {
  const sweos = '/tmp/x/swe-os';
  const prompt = reviewPrompt({
    project,
    sweos,
    git: { repo: true, commits: 3, ignored: ['.env'], uncommitted: [] },
    checks: {
      install: {
        command: 'npm install',
        ok: true,
        code: 0,
        seconds: 20,
        tail: 'added 300 packages',
      },
      test: {
        command: 'npm test',
        ok: false,
        code: 1,
        seconds: 5,
        tail: '1 failing',
      },
    },
    turns: [
      {
        n: 1,
        kind: 'scripted',
        sent: project.turns[0],
        commands: [
          `Read ${sweos}/skills/README.md`,
          `Bash cat ${sweos}/core/x.md && npm test`,
          'Edit app/page.tsx',
        ],
        reply: `**Worth learning.** RSVPs need a unique key.\n\nI followed SWE OS at ${sweos}.`,
        error: null,
      },
    ],
  });
  for (const [id] of DIMENSIONS) assert(prompt.includes(`"${id}":n`));
  assert.match(prompt, /RSVPs need a unique key/);
  assert.match(prompt, /- Bash npm test/);
  assert.match(prompt, /failed \(exit 1\)/);
  assert.match(prompt, /`npm run build`: not run/);
  assert.doesNotMatch(prompt, /SWE ?OS|Worth learning|\/tmp\/x/);
});

test("the simulated user's prompt has the rules, the facts, and no SWE OS", () => {
  const sweos = '/tmp/x/swe-os';
  const prompt = userPrompt({
    facts: project.facts,
    messages: project.turns.slice(0, 3),
    reply: `Built it.\n\n**Worth learning.** Hash passwords slowly.\n\nI followed SWE OS at ${sweos}.\n\nOne vote each or several?`,
    sweos,
  });
  assert.match(prompt, /one to three plain sentences/);
  assert.match(prompt, /the option the agent recommended/);
  assert.match(prompt, /Never add scope/);
  assert.match(prompt, /Never tell it to go ahead/);
  assert.match(prompt, /exactly NO_REPLY/);
  assert(prompt.includes(project.facts));
  assert(prompt.includes(`3. ${project.turns[2]}`));
  assert(!prompt.includes(project.turns[3]));
  assert.match(prompt, /One vote each or several\?\n<\/reply>$/);
  assert.doesNotMatch(prompt, /SWE ?OS|Worth learning|\/tmp\/x/);
});

test('a review missing reasons is caught', () => {
  const scores = Object.fromEntries(DIMENSIONS.map(([id]) => [id, 2]));
  const reasons = Object.fromEntries(DIMENSIONS.map(([id]) => [id, 'Why.']));
  assert.deepEqual(reviewGaps({ scores, reasons }), []);
  assert.deepEqual(reviewGaps({ error: 'unparseable' }), []);
  // The first real run's A review: one reason, seven missing.
  assert.equal(
    reviewGaps({ scores, reasons: { works: 'It runs.' } }).length,
    7,
  );
  assert.deepEqual(
    reviewGaps({ scores: { ...scores, tests: null }, reasons }),
    ['tests'],
  );
});

test('the summary puts both arms side by side, serious problems first', () => {
  const arm = (scores, problems, extra = {}) => ({
    model: 'm',
    cost: 10,
    seconds: 3600,
    turns: [
      {
        kind: 'scripted',
        error: null,
        user: { answer: 'One vote each.', cost: 0.1 },
      },
      { kind: 'answer', error: null, user: { answer: null, cost: 0.05 } },
    ],
    checks: {
      install: { command: 'npm install', ok: true, seconds: 30 },
      test: { command: 'npm test', ok: false, seconds: 9 },
    },
    review: { scores, reasons: { works: 'It runs.' }, problems, cost: 1 },
    ...extra,
  });
  const scores = (n) => Object.fromEntries(DIMENSIONS.map(([id]) => [id, n]));
  const out = renderSummary(
    {
      project: 'book-club',
      started: 'now',
      commit: 'abc',
      spent: 22,
      budget: 40,
      perTurn: 6,
      answers: 'simulated',
      turns: 7,
    },
    {
      A: arm(scores(1), [
        { where: 'a.ts:1', problem: 'Minor thing.', serious: false },
        { where: 'b.ts:2', problem: 'Anyone can vote twice.', serious: true },
      ]),
      B: arm({ ...scores(2), simplicity: 0 }, [], { cost: 20 }),
    },
  );
  assert.match(out, /\| works \| 1 \| 2 \| \+1 \|/);
  assert.match(out, /\| simplicity \| 1 \| 0 \| -1 \|/);
  assert.match(out, /\| `npm test` \| fail \(9s\) \| fail \(9s\) \|/);
  assert.match(out, /\| `npm run build` \| not run/);
  assert.match(out, /Scripted turns sent \| 1 of 7/);
  assert(out.indexOf('Anyone can vote twice') < out.indexOf('Minor thing'));
  assert.match(out, /B scored higher on works/);
  assert.match(out, /A scored higher on simplicity/);
  assert.match(out, /B cost 2\.0x/);
  assert.match(out, /Answers from the simulated user \| 1, \$0\.15 \|/);
  assert.match(out, /only "keep going\?"\) \| 1 \| 1 \|/);
  assert.match(out, /A: It runs\. B: It runs\./);
  assert.match(out, /\*\*tests\.\*\* A: \(The reviewer gave no reason\.\)/);
});

// End to end, with tests/fake-claude/claude standing in for the CLI.
const runner = resolve('evals/project/run.mjs');
function runEval(args, env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'project-eval-test-'));
  const temp = join(dir, 'tmp');
  mkdirSync(temp);
  const log = join(dir, 'log.jsonl');
  const { CLAUDECODE, ...rest } = process.env;
  const fullEnv = {
    ...rest,
    ...env,
    TMPDIR: temp,
    FAKE_CLAUDE_LOG: log,
    PATH: `${resolve('tests/fake-claude')}:${process.env.PATH}`,
  };
  const result = spawnSync(
    process.execPath,
    [runner, '--out', join(dir, 'out'), ...args],
    {
      encoding: 'utf8',
      env: fullEnv,
    },
  );
  const calls = () =>
    existsSync(log)
      ? readFileSync(log, 'utf8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line))
      : [];
  return {
    dir,
    out: join(dir, 'out'),
    temp,
    env: fullEnv,
    calls: calls(),
    callsNow: calls,
    ...result,
  };
}
const isB = (call) => call.args.includes('--add-dir');
const prompt = (call) => call.args[call.args.indexOf('--') + 1];

test('a full run: both arms, every turn, checks, blind reviews, summary', () => {
  const run = runEval([]);
  assert.equal(run.status, 0, run.stderr);
  const agents = run.calls.filter((c) => c.role === 'agent');
  const reviewers = run.calls.filter((c) => c.role === 'reviewer');
  const users = run.calls.filter((c) => c.role === 'user');
  // 7 turns plus one answer to the question at the end of turn 1, in each arm.
  assert.equal(agents.filter((c) => !isB(c)).length, 8);
  assert.equal(agents.filter(isB).length, 8);
  // The simulated user answered that question, once per arm, with no tools.
  assert.equal(users.length, 2);
  for (const u of users) {
    assert.equal(u.args[u.args.indexOf('--tools') + 1], '');
    assert(!u.args.includes('--add-dir') && !u.args.includes('--resume'));
    assert.match(u.prompt, /Who organizes the club\?/);
  }
  // A and B get the same template: only the agent's reply differs, and B's has no SWE OS.
  const template = (p) => p.replace(/<reply>[\s\S]*<\/reply>/, '');
  assert.equal(template(users[0].prompt), template(users[1].prompt));
  assert.doesNotMatch(users[1].prompt, /SWE ?OS|Worth learning|swe-os-/);
  assert.notEqual(users[0].cwd, agents[0].cwd);
  const [firstA, firstB] = [agents.find((c) => !isB(c)), agents.find(isB)];
  assert.equal(prompt(firstA), project.turns[0]);
  assert.match(
    prompt(firstB),
    /^Use Tommy's SWE OS at \S+ for this task\. Start at skills\/README\.md/,
  );
  assert(prompt(firstB).endsWith(project.turns[0]));
  assert(!firstA.args.includes('--resume'));
  for (const c of agents.filter((c) => c !== firstA && c !== firstB)) {
    assert(c.args.includes('--resume'));
    assert.doesNotMatch(prompt(c), /SWE OS/);
  }
  const answers = agents.filter((c) => prompt(c).startsWith('Fake owner:'));
  assert.equal(answers.length, 2);
  assert.match(prompt(answers[0]), /Who organizes the club\?/);
  assert(
    agents.every(
      (c) =>
        c.args.includes('Bash(npx:*)') && c.args.includes('Bash(docker:*)'),
    ),
  );
  assert.notEqual(firstA.cwd, firstB.cwd);
  // Reviewers work in neutrally named copies with the tells stripped.
  assert.equal(reviewers.length, 2);
  for (const r of reviewers) {
    assert.match(r.cwd, /review-\w+\/book-club$/);
    assert.equal(r.readmeSaysSweos, false);
    assert.equal(r.promptSaysSweos, false);
    assert(!r.args.includes('Edit'));
  }
  const summary = readFileSync(join(run.out, 'summary.md'), 'utf8');
  assert.match(summary, /\| works \| 2 \| 2 \| \+0 \|/);
  assert.match(summary, /\| `npm test` \| pass/);
  assert.match(
    summary,
    /Answers from the simulated user \| 1, \$0\.05 \| 1, \$0\.05 \|/,
  );
  const A = JSON.parse(readFileSync(join(run.out, 'A.json'), 'utf8'));
  assert.equal(A.turns.length, 8);
  assert.equal(A.cost, 2);
  assert.match(A.turns[0].user.answer, /^Fake owner:/);
  assert.equal(A.turns[1].sent, A.turns[0].user.answer);
  assert.equal(A.turns[1].kind, 'answer');
  assert(existsSync(join(run.out, 'runs/A/user-1.jsonl')));
  assert.deepEqual(A.git.ignored, ['.env']);
  assert.equal(A.review.problems.length, 2);
  const saved = readdirSync(join(run.out, 'runs/B/repo'));
  assert(saved.includes('.env.example'));
  for (const skip of ['node_modules', '.next', '.git'])
    assert(!saved.includes(skip));
  assert.match(
    readFileSync(join(run.out, 'runs/B/repo/README.md'), 'utf8'),
    /SWE OS/,
  );
  // Nothing big is left behind in the temp folder.
  assert.deepEqual(
    readdirSync(run.temp).filter((f) =>
      /^(project|review|swe-os|owner)-/.test(f),
    ),
    [],
  );

  // Regrading redoes the checks and reviews without rerunning the agents.
  const graded = spawnSync(process.execPath, [runner, '--grade', run.out], {
    encoding: 'utf8',
    env: run.env,
  });
  assert.equal(graded.status, 0, graded.stderr);
  const after = run.callsNow();
  assert.equal(after.length, run.calls.length + 2);
  assert(after.slice(-2).every((c) => c.role === 'reviewer'));
  rmSync(run.dir, { recursive: true });
});

test('the simulated user answers at most twice per turn', () => {
  const run = runEval([], { FAKE_CLAUDE_ASK: 'always' });
  assert.equal(run.status, 0, run.stderr);
  const sent = run.calls
    .filter((c) => c.role === 'agent' && !isB(c))
    .map(prompt);
  assert.equal(sent.length, 21);
  for (let i = 0; i < 7; i++) {
    assert.equal(sent[3 * i], project.turns[i]);
    assert.match(sent[3 * i + 1], /^Fake owner:/);
    assert.match(sent[3 * i + 2], /^Fake owner:/);
  }
  // Both arms asked the same number of questions and got the same number of answers.
  assert.equal(run.calls.filter((c) => c.role === 'user').length, 28);
  rmSync(run.dir, { recursive: true });
});

test('the simulated user never answers "keep going?"', () => {
  const run = runEval([], { FAKE_CLAUDE_ASK: 'keep-going' });
  assert.equal(run.status, 0, run.stderr);
  const sent = run.calls
    .filter((c) => c.role === 'agent' && !isB(c))
    .map(prompt);
  assert.deepEqual(sent, project.turns);
  const A = JSON.parse(readFileSync(join(run.out, 'A.json'), 'utf8'));
  assert(A.turns.every((t) => t.user && t.user.answer === null));
  rmSync(run.dir, { recursive: true });
});

test('--fixed-answers sends the facts once per turn, never a nudge', () => {
  const run = runEval(['--fixed-answers'], { FAKE_CLAUDE_ASK: 'always' });
  assert.equal(run.status, 0, run.stderr);
  const sent = run.calls
    .filter((c) => c.role === 'agent' && !isB(c))
    .map(prompt);
  assert.equal(sent.length, 14);
  for (let i = 0; i < 7; i++) {
    assert.equal(sent[2 * i], project.turns[i]);
    assert.match(
      sent[2 * i + 1],
      /^Answers to your questions: The club has 12 members/,
    );
  }
  assert.equal(run.calls.filter((c) => c.role === 'user').length, 0);
  rmSync(run.dir, { recursive: true });
});

test('a review missing reasons gets one request to finish it', () => {
  const run = runEval([], { FAKE_CLAUDE_REVIEW: 'partial' });
  assert.equal(run.status, 0, run.stderr);
  const followups = run.calls.filter((c) => c.role === 'reviewer-followup');
  assert.equal(followups.length, 2);
  for (const f of followups) {
    assert(f.args.includes('--resume'));
    assert.match(
      f.args.at(-1),
      /missing a score or a reason for: authorization/,
    );
  }
  const summary = readFileSync(join(run.out, 'summary.md'), 'utf8');
  assert.match(
    summary,
    /\*\*authorization\.\*\* A: Fake reason for authorization\. B: Fake reason for authorization\./,
  );
  rmSync(run.dir, { recursive: true });
});

test('a usage limit stops the run before grading', () => {
  const run = runEval([], { FAKE_CLAUDE_FAIL: 'limit' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /usage or rate limit/);
  assert.equal(run.calls.length, 1);
  assert(!existsSync(join(run.out, 'summary.md')));
  assert(existsSync(join(run.out, 'A.json')));
  rmSync(run.dir, { recursive: true });
});

test('the budget stops both arms at the same turn', () => {
  // $1.10 a turn for both arms (two agent messages and one simulated answer each) plus $6
  // held for reviews doesn't fit a second turn in $7.
  const run = runEval(['--budget', '7']);
  assert.equal(run.status, 0, run.stderr);
  const sent = (b) =>
    run.calls.filter((c) => c.role === 'agent' && isB(c) === b).length;
  assert.equal(sent(false), 2);
  assert.equal(sent(true), 2);
  assert.match(
    readFileSync(join(run.out, 'summary.md'), 'utf8'),
    /Stopped before turn 2 of 7/,
  );
  rmSync(run.dir, { recursive: true });
});

test('--dry-run prints every turn and spends nothing', () => {
  const run = runEval(['--dry-run']);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.calls.length, 0);
  for (const [i, turn] of project.turns.entries())
    assert(run.stdout.includes(`${i + 1}. ${turn.slice(0, 60)}`));
  assert(!existsSync(run.out));
  rmSync(run.dir, { recursive: true });
});
