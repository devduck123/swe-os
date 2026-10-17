// The parts of the project eval that don't need Claude: reading the project file, blinding a
// repo, the reviewer's prompt, and the summary. tests/project-eval.test.mjs covers them.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { section } from '../harness/common.mjs';
import { hideSweos, neutralize } from '../harness/neutralize.mjs';

export function loadProject(markdown) {
  const turns = section(markdown, 'Turns')
    .split('\n')
    .map((line) => line.match(/^\d+\.\s+(.+)$/)?.[1])
    .filter(Boolean);
  return {
    turns,
    facts: section(markdown, 'Facts if asked').replace(/\s+/g, ' '),
    notes: section(markdown, 'Reviewer-only notes'),
  };
}

// Run in this order on a fresh copy of each final repo.
export const CHECKS = {
  install: ['install'],
  test: ['test'],
  build: ['run', 'build'],
};

// What the blind reviewer scores, 0 to 3 each.
export const DIMENSIONS = [
  [
    'works',
    'It installs, builds, and its tests pass, and the scripted features exist.',
  ],
  [
    'authorization',
    "Can one member read or change another member's data? Can a non-organizer create or edit meetings? Checked on the server?",
  ],
  [
    'data_correctness',
    'One vote per member per round enforced in the database, RSVPs updated in place, meeting times and "the day before" right across time zones, reminders not duplicated.',
  ],
  [
    'secrets_setup',
    'No secrets committed, a .env.example, a README a stranger can follow, one command to run it.',
  ],
  [
    'tests',
    'Meaningful tests on the rules above, not just snapshots or "it renders".',
  ],
  ['simplicity', 'No overbuilding for a 15-person club.'],
  [
    'communication',
    "From the agent's replies: clear, honest about what was and wasn't verified, not padded.",
  ],
  [
    'learning_value',
    "From the agent's replies: would a self-taught builder learn something real? Ignore whether a section is labeled for learning.",
  ],
];

const TEXT =
  /\.(md|mdx|txt|json|js|jsx|mjs|cjs|ts|tsx|sql|css|html|yml|yaml|toml|env|example)$|^\.env|^[A-Z]+$/i;

// Blinding is approximate. Lines that name SWE OS come out of Markdown, and the snapshot's
// path becomes <docs> everywhere. Code is left alone, so it still builds.
export function blindRepo(dir, sweos) {
  let removed = 0;
  const walk = (folder) => {
    for (const name of readdirSync(folder)) {
      if (name === 'node_modules' || name === '.git' || name === '.next')
        continue;
      const path = join(folder, name);
      const stat = statSync(path, { throwIfNoEntry: false });
      if (!stat) continue;
      if (stat.isDirectory()) {
        walk(path);
        continue;
      }
      if (!TEXT.test(name) || stat.size > 2e6) continue;
      const before = readFileSync(path, 'utf8');
      let after = sweos ? before.replaceAll(sweos, '<docs>') : before;
      if (/\.mdx?$/i.test(name)) {
        const lines = after.split('\n');
        const kept = lines.filter(
          (line) =>
            !/SWE ?OS|skills\/[\w-]+\/SKILL\.md|core\/(concerns|guides|recipes)\//i.test(
              line,
            ),
        );
        removed += lines.length - kept.length;
        after = kept.join('\n');
      }
      if (after !== before) writeFileSync(path, after);
    }
  };
  walk(dir);
  return removed;
}

const clip = (text, n) =>
  text.length > n ? `${text.slice(0, n)}\n[...cut]` : text;

export function conversation(turns, sweos) {
  return turns
    .map((t) => {
      const commands = t.commands
        .filter((c) => c.startsWith('Bash '))
        .map((c) => hideSweos(c, sweos))
        .filter(Boolean)
        .slice(0, 60)
        .map((c) => `- ${clip(c, 200).replace(/\n/g, ' ')}`);
      return `### Message ${t.n}${t.kind === 'answer' ? ' (answers to its questions)' : ''}\n\nUser: ${t.sent}\n\nShell commands the agent ran:\n${commands.join('\n') || '- none'}\n\nAgent's final reply:\n\n${clip(neutralize(t.reply, sweos), 6000)}${t.error ? `\n\n(This message ended in an error: ${clip(t.error, 200)})` : ''}`;
    })
    .join('\n\n');
}

const checkLine = (name, c) =>
  c
    ? `- \`${c.command}\`: ${c.ok ? 'passed' : c.timedOut ? 'timed out' : `failed (exit ${c.code})`} in ${c.seconds}s. Last output:\n\n\`\`\`\n${clip(c.tail, 1500)}\n\`\`\``
    : `- \`${name}\`: not run`;

export function reviewPrompt({ project, turns, checks, git, sweos }) {
  return `You are reviewing a small web app an AI coding agent built for a user over one long session. You don't know how the agent was set up. Judge only the work.

The app is in your working directory. Read whatever you need. You can run \`npm test\` and \`npm run build\`; packages are installed. Don't change any files.

## What the user asked for, in order

${project.turns.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Facts the user gave if asked: ${project.facts}

## What a strong build does (reviewer-only notes)

${project.notes}

## Git

${git.repo ? `The agent made a Git repo with ${git.commits} commit(s).` : 'The agent did not make a Git repo.'} These paths are ignored by Git, so they'd never be committed:
${git.ignored.map((p) => `- ${p}`).join('\n') || '- none'}
${git.uncommitted.length ? `Uncommitted changes at the end:\n${git.uncommitted.map((p) => `- ${p}`).join('\n')}` : ''}

## Checks run on a fresh copy (npm install, then npm test, then npm run build)

${Object.entries(CHECKS)
  .map(([k, args]) => checkLine(`npm ${args.join(' ')}`, checks[k]))
  .join('\n')}

## The session: each user message, the shell commands the agent ran, and its final reply

${conversation(turns, sweos)}

## Score it

Score each dimension 0 to 3: 0 broken or missing, 1 weak, 2 solid, 3 excellent with evidence. Don't reward length.

${DIMENSIONS.map(([id, what]) => `- **${id}**: ${what}`).join('\n')}

Then list the concrete problems you found, most serious first, each with a file and line. Mark a problem serious if it's data loss, a leaked secret, an auth bypass, or a claim of verification that didn't happen.

Reply with only this JSON:
{"scores":{${DIMENSIONS.map(([id]) => `"${id}":n`).join(',')}},"reasons":{${DIMENSIONS.map(([id]) => `"${id}":"one sentence"`).join(',')}},"problems":[{"where":"path/to/file.ts:12","problem":"one sentence","serious":true}]}`;
}

const fmt = (n, d = 2) => (n == null ? '–' : Number(n).toFixed(d));
const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

export function average(review) {
  const values = Object.values(review?.scores ?? {}).filter(
    (v) => typeof v === 'number',
  );
  return mean(values);
}

const status = (c) =>
  !c ? 'not run' : c.ok ? 'pass' : c.timedOut ? 'timed out' : 'fail';

export function renderSummary(info, arms) {
  const { A, B } = arms;
  const score = (arm, id) => arm.review?.scores?.[id];
  const rows = DIMENSIONS.map(([id]) => {
    const [a, b] = [score(A, id), score(B, id)];
    const delta = typeof a === 'number' && typeof b === 'number' ? b - a : null;
    return `| ${id} | ${fmt(a, 0)} | ${fmt(b, 0)} | ${delta == null ? '–' : (delta >= 0 ? '+' : '') + delta} |`;
  });
  const [avgA, avgB] = [average(A.review), average(B.review)];
  const scripted = (arm) =>
    arm.turns.filter((t) => t.kind === 'scripted').length;
  const answers = (arm) => arm.turns.filter((t) => t.kind === 'answer').length;
  const problems = (arm) => {
    const list = [...(arm.review?.problems ?? [])].sort(
      (x, y) => Number(!!y.serious) - Number(!!x.serious),
    );
    if (arm.review?.error)
      return [`- The review failed: ${arm.review.error.slice(0, 200)}`];
    if (!list.length) return ['- None listed.'];
    return list
      .slice(0, 8)
      .map(
        (p) =>
          `- ${p.serious ? '**Serious.** ' : ''}\`${p.where}\`: ${p.problem}`,
      );
  };
  const reasons = DIMENSIONS.map(
    ([id]) =>
      `- **${id}.** A: ${A.review?.reasons?.[id] ?? '–'} B: ${B.review?.reasons?.[id] ?? '–'}`,
  );
  const better = DIMENSIONS.filter(([id]) => score(B, id) > score(A, id)).map(
    ([id]) => id,
  );
  const worse = DIMENSIONS.filter(([id]) => score(B, id) < score(A, id)).map(
    ([id]) => id,
  );
  const ratio = (x, y) => (y ? `${(x / y).toFixed(1)}x` : '–');
  const differed = [
    better.length
      ? `B scored higher on ${better.join(', ')}.`
      : 'B scored higher on nothing.',
    worse.length
      ? `A scored higher on ${worse.join(', ')}.`
      : 'A scored higher on nothing.',
    `B cost ${ratio(B.cost, A.cost)} what A did and took ${ratio(B.seconds, A.seconds)} the time.`,
    `Checks (install, test, build): A ${['install', 'test', 'build'].map((k) => status(A.checks?.[k])).join(', ')}; B ${['install', 'test', 'build'].map((k) => status(B.checks?.[k])).join(', ')}.`,
    'This paragraph is generated from the scores. Read both reviews and the replies before trusting it, and replace it with what actually differed.',
  ].join(' ');
  return [
    `# Project eval ${info.started}: ${info.project}`,
    '',
    `SWE OS at \`${info.commit}\`, model \`${A.model ?? B.model ?? 'unknown'}\`. Spent $${fmt(info.spent)} API-equivalent (budget $${info.budget}, $${info.perTurn} per message).${info.stopped ? ` ${info.stopped}` : ''}`,
    '',
    'One run per arm is one data point. Each arm was reviewed once, blind, by Claude with read access to the final repo. Blinding is approximate.',
    '',
    '## Scores',
    '',
    '| Dimension | A | B | B − A |',
    '| --- | --- | --- | --- |',
    ...rows,
    `| **Average** | ${fmt(avgA)} | ${fmt(avgB)} | ${avgA != null && avgB != null ? (avgB - avgA >= 0 ? '+' : '') + fmt(avgB - avgA) : '–'} |`,
    '',
    '## Checks on a fresh copy',
    '',
    '| Check | A | B |',
    '| --- | --- | --- |',
    ...Object.entries(CHECKS).map(
      ([k, args]) =>
        `| \`npm ${args.join(' ')}\` | ${status(A.checks?.[k])} (${A.checks?.[k]?.seconds ?? '–'}s) | ${status(B.checks?.[k])} (${B.checks?.[k]?.seconds ?? '–'}s) |`,
    ),
    '',
    '## Cost and time',
    '',
    '| | A | B |',
    '| --- | --- | --- |',
    `| Cost | $${fmt(A.cost)} | $${fmt(B.cost)} |`,
    `| Time | ${Math.round(A.seconds / 60)} min | ${Math.round(B.seconds / 60)} min |`,
    `| Scripted turns sent | ${scripted(A)} of ${info.turns} | ${scripted(B)} of ${info.turns} |`,
    `| Answers to questions | ${answers(A)} | ${answers(B)} |`,
    `| Messages that ended in an error | ${A.turns.filter((t) => t.error).length} | ${B.turns.filter((t) => t.error).length} |`,
    `| Review cost | $${fmt(A.review?.cost)} | $${fmt(B.review?.cost)} |`,
    '',
    '## Top problems',
    '',
    '**A (without SWE OS)**',
    '',
    ...problems(A),
    '',
    '**B (with SWE OS)**',
    '',
    ...problems(B),
    '',
    '## Reasons',
    '',
    ...reasons,
    '',
    '## What differed',
    '',
    differed,
    '',
    'Per-turn costs, commands, and replies are in `A.json` and `B.json`. Raw transcripts and the final repos are in `runs/`, which Git ignores.',
    '',
  ].join('\n');
}
