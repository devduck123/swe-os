import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { scenarios } from '../evals/harness/scenarios.mjs';
import { neutralize } from '../evals/harness/neutralize.mjs';

const dir = 'evals/scenarios';

test('every scenario file has a harness entry, and every entry has its files', () => {
  const files = readdirSync(dir).map((f) => f.replace(/\.md$/, ''));
  for (const file of files)
    assert(
      scenarios.some((s) => (s.file ?? s.id) === file),
      `${file} has no harness entry`,
    );
  for (const s of scenarios) {
    assert(files.includes(s.file ?? s.id), `${s.id} has no scenario file`);
    if (s.fixture)
      assert(
        existsSync(join('evals/fixtures', s.fixture)),
        `${s.id} fixture is missing`,
      );
    if (s.pr) {
      assert(s.git, `${s.id} has a PR but no git`);
      assert(
        existsSync(join('evals/fixtures', s.pr.fixture)),
        `${s.id} PR fixture is missing`,
      );
    }
  }
});

test('the harness sends exactly what each scenario file says', () => {
  for (const s of scenarios) {
    const text = readFileSync(join(dir, `${s.file ?? s.id}.md`), 'utf8');
    for (const turn of s.turns)
      assert(
        text.includes(turn),
        `${s.id}: "${turn.slice(0, 40)}..." isn't in its scenario file`,
      );
    if (s.ifAsked)
      assert(
        text.toLowerCase().includes(s.ifAsked.slice(0, 60).toLowerCase()),
        `${s.id}: ifAsked doesn't match its scenario file`,
      );
  }
});

test('grading hides the run folder, whose name gives the arm away', async () => {
  const { hideRunFolder } = await import('../evals/harness/neutralize.mjs');
  assert.equal(
    hideRunFolder(
      'Bash cd /tmp/swe-os-evals-1-x/runs/sprout-design-B-2/work/site && ls',
    ),
    'Bash cd <project>/site && ls',
  );
});

test('grading strips SWE OS tells but keeps what they say', () => {
  const reply = [
    'Fixed the typo in both files. Tests pass.',
    '',
    '**Worth learning.** Tests that assert exact copy break when the copy changes.',
    '',
    '**SWE OS feedback:** skills/build-feature/SKILL.md is heavy for typos.',
    'I followed SWE OS. The limit is 5,000 characters.',
  ].join('\n');
  const out = neutralize(reply, '/tmp/x/swe-os');
  assert.match(out, /Tests that assert exact copy break/);
  assert.match(out, /The limit is 5,000 characters/);
  assert.doesNotMatch(out, /Worth learning|SWE OS|SKILL\.md/);
});

test('grades parse from fenced or chatty replies', async () => {
  const { parseGrade } = await import('../evals/harness/parse-grade.mjs');
  const json =
    '{"scores":{"risk":3},"serious_flaws":[],"reasons":{"risk":"Uses {braces} fine."}}';
  assert.equal(parseGrade('```json\n' + json + '\n```').scores.risk, 3);
  assert.equal(
    parseGrade('Here you go:\n' + json + '\nHope that helps {really}.').scores
      .risk,
    3,
  );
  assert.ok(parseGrade('no json here').error);
});

test('grading hides SWE OS reads but keeps the rest of a chained command', async () => {
  const { hideSweos } = await import('../evals/harness/neutralize.mjs');
  const sweos = '/tmp/x/swe-os';
  assert.equal(
    hideSweos(
      `Bash cd ${sweos} && ls core/concerns; grep -n depend core/concerns/README.md; npm view left-pad name`,
      sweos,
    ),
    'Bash npm view left-pad name',
  );
  assert.equal(hideSweos(`Read ${sweos}/skills/README.md`, sweos), null);
  assert.equal(hideSweos('Bash npm test', sweos), 'Bash npm test');
});

test('two graders average, and a flaw counts only if both flag one', async () => {
  const { combineGrades } = await import('../evals/harness/parse-grade.mjs');
  const a = {
    scores: { risk: 3, verification: null },
    serious_flaws: ['fake check'],
    reasons: {},
  };
  const b = {
    scores: { risk: 2, verification: null },
    serious_flaws: [],
    reasons: {},
  };
  const both = combineGrades([a, b]);
  assert.equal(both.scores.risk, 2.5);
  assert.equal(both.scores.verification, null);
  assert.deepEqual(both.serious_flaws, []);
  assert.deepEqual(both.disputedFlaws, ['fake check']);
  assert.deepEqual(
    combineGrades([a, { ...b, serious_flaws: ['x'] }]).serious_flaws,
    ['fake check'],
  );
});

test('the learner reads the main path only', async () => {
  const { mainPath } = await import('../evals/learner/main-path.mjs');
  const page =
    "---\ntitle: X\n---\n\nIntro.\n\n<details>\n<summary>Going deeper</summary>\n\nLock levels.\n\n</details>\n\n## What I'd do\n\nShip it.\n\n## Sources\n\n- a link\n";
  const out = mainPath(page);
  assert.match(out, /Intro\.[\s\S]*Ship it\./);
  assert.doesNotMatch(out, /title: X|Lock levels|a link/);
});

test('a run records the commands the harness blocked', async () => {
  const { parseStream } = await import('../evals/harness/common.mjs');
  const out = [
    { type: 'system', subtype: 'init', session_id: 's', model: 'm' },
    {
      type: 'assistant',
      message: {
        content: [{ type: 'tool_use', name: 'Bash', input: { command: 'ls' } }],
      },
    },
    {
      type: 'result',
      result: 'Done.',
      session_id: 's',
      total_cost_usd: 0.5,
      permission_denials: [
        { tool_name: 'Bash', tool_input: { command: 'gh pr create' } },
        { tool_name: 'WebFetch', tool_input: { url: 'https://example.com' } },
      ],
    },
  ]
    .map((e) => JSON.stringify(e))
    .join('\n');
  const r = parseStream(out);
  assert.equal(r.reply, 'Done.');
  assert.deepEqual(r.commands, ['Bash ls']);
  assert.deepEqual(r.denied, [
    'Bash gh pr create',
    'WebFetch https://example.com',
  ]);
  assert.deepEqual(parseStream('').denied, []);
});

test('a private round refuses a temp folder, which would lose its results', async () => {
  const { spawnSync } = await import('node:child_process');
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const folder = mkdtempSync(join(tmpdir(), 'private-'));
  writeFileSync(
    join(folder, 'scenarios.mjs'),
    'export const scenarios = [];\n',
  );
  const r = spawnSync(
    process.execPath,
    ['evals/harness/run.mjs', '--dry-run', '--only', 'overhead'],
    { env: { ...process.env, EVAL_PRIVATE: folder }, encoding: 'utf8' },
  );
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /temp folder the system clears/);
});

test('a session limit stops the round instead of counting as a run', async () => {
  const { stopReasonFor } = await import('../evals/harness/common.mjs');
  assert.ok(
    stopReasonFor(
      "You've hit your session limit · resets 5:10pm (America/Los_Angeles)",
    ),
  );
  assert.ok(stopReasonFor('usage_limit_reached'));
  assert.equal(stopReasonFor('Build failed: missing semicolon'), null);
});
