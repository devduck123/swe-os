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
