---
title: Reading and reviewing code you didn't write
description: How to understand an unfamiliar codebase or an agent's diff fast, what a real review looks for and in what order, and why you shouldn't merge what you can't explain.
domain: foundations
stage: verify
freshness: durable
status: draft
track: 14
concerns: [testing, security]
---

Reading code is how you find out what's actually true about a system, as opposed to what the README, the PR description, or the agent's summary says is true. Reviewing is deciding whether a change deserves to exist in that system.

With agents, these two skills became most of the job. You type less and read more. An agent can write a 600-line PR in four minutes. Whether that PR is good is still your call, and you can only make it if you can read fast and know where to look.

## Green CI and a nice summary aren't a review

Here's the trap. An agent opens "Add CSV export for invoices." The description is clear, the tests pass, the code is tidy. You skim the diff, it looks reasonable, you merge.

Inside the new route:

```ts
export async function GET(req: Request) {
  const teamId = new URL(req.url).searchParams.get('teamId');
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.teamId, teamId));
  return csvResponse(rows);
}
```

It never checks that the logged-in user belongs to `teamId`. Anyone with an account can export any team's invoices by changing a number in the URL. The tests pass because they call the route with a team the test user owns. CI was green because CI checks what the tests check, and nobody wrote the test that mattered.

Nothing in the diff looks wrong. The bug is what's missing, and you only see it if you know what this kind of route must always do. That's the skill.

## When to read deeply, and when to skim

Match the depth to the damage a mistake could do.

Read every line of anything that touches auth or permissions, money, data deletion, migrations, anything that sends email or calls paid APIs, and anything that's hard to undo once deployed. These are the places where a subtle bug costs real money or real trust.

Skim copy changes, styling, test-only changes, and code in a prototype you'll throw away. Check that they do what they say, then move on.

When in doubt, ask: if this is wrong, who finds out, and how bad is it? [Shipping changes you can undo](shipping-changes-you-can-undo.md) lowers the cost of being wrong, but it doesn't help with leaked data or a broken migration.

## Read an unfamiliar codebase from the outside in

Don't start by opening random files. Start where the system starts.

1. **Find the entry points.** `package.json` scripts, the `app/` routes, middleware, the database schema, the env vars it expects. These tell you what the system does and what it talks to.
2. **Trace one request end to end.** Pick one real action, like "user saves a profile", and follow it from the button click to the database and back. [How a request travels](how-a-request-travels.md) is the map. One full trace teaches more than skimming twenty files.
3. **Read the tests.** They're the closest thing to a spec. They show what the author thought mattered, and the gaps show what they didn't think about.
4. **Ask Git why.** Code tells you what. History tells you why.
5. **Run it.** Click through the feature, change a value, break something on purpose. What you predict and what actually happens rarely match the first time, and the gap is where you learn.

The Git part is underused:

```sh
git log --oneline -20 -- app/api/export     # what changed here recently
git log -S 'teamId' -p -- app/api            # when this string appeared or vanished
git blame -w -C app/api/export/route.ts      # who last touched each line, following moved code
git log -L :GET:app/api/export/route.ts      # the history of one function
```

Agents are great at the first pass: "trace what happens when a user saves a profile, with file and line references." Then check two or three of its claims against the code. Agents summarize confidently, including when they're wrong.

## Review in priority order

Spend attention where the damage is. The [review-change skill](../../skills/review-change/SKILL.md) uses this order:

1. **Correctness.** Does it do what it claims, including edge cases?
2. **Data loss or corruption.** Can it delete, overwrite, or quietly mangle data?
3. **Security.** Who can call this, with what input, touching whose data? See [trust boundaries](trust-boundaries.md).
4. **Failure behavior.** What happens when the network, the database, or the third-party API fails?
5. **Concurrency.** What happens if two of these run at once?
6. **Boundaries.** Does it put logic in the right layer, and change any contract callers rely on?
7. **Maintainability.** Could someone change this safely in six months?
8. **Performance,** where it matters.
9. **Accessibility and UX.**
10. **Style.**

The order matters because review attention runs out. Ten comments about naming and zero about the missing ownership check is a review that made the code worse, because it gave the PR a stamp of approval.

Three habits make the difference:

- **Review past the diff.** Most real bugs sit where changed code meets code it didn't touch. If the PR changes what a function returns, open its callers. If it adds a column, find everything else that reads that table.
- **Prove each finding.** Name the trigger, the consequence, and the evidence: "Request `/export?teamId=7` as a user on team 3. You get team 7's invoices." A finding with a reproduction gets fixed. "This feels risky" gets argued about.
- **Flag machinery the change doesn't need.** Agents love abstractions: a factory with one product, a config option nobody sets, a new dependency for ten lines of code. Each one is something to understand and maintain forever. [Simple first](simple-first.md) explains why that matters.

## Don't merge what you can't explain

This is the rule for the agent era. Before merging anything non-trivial, you should be able to explain what it does, why it's built this way, and how it fails. Not the agent. You.

A quick self-check: without looking, how does this change handle a user who isn't on the team? What happens if the export has 100,000 rows? If you can't answer, you haven't reviewed it yet. You've read it.

You can turn that into a habit. Ask the agent for a walkthrough of its decisions, then answer a few questions about the change from memory before you merge. [Learning while agents write the code](learning-with-agents.md) has the reasoning behind this, and the [learn skill](../../skills/learn/SKILL.md) runs the comprehension check for you. It also keeps you able to review at all: you can't spot a bad auth change if you no longer know how your auth works.

## Small PRs get real reviews

Big PRs get skimmed. Google's engineering guidelines suggest around 100 lines is usually a reasonable size for a change and 1,000 is usually too large, because small changes get reviewed faster and more thoroughly, introduce fewer bugs, and are easier to roll back.

Agents don't feel the cost of a big PR, so you have to ask for small ones. Split by layer or by step: the migration in one PR, the server logic in the next, the UI last. Or ship behind a flag in pieces.

Then ask the agent to write a PR description you can review against:

- **What and why.** The user-facing outcome in one or two sentences.
- **Decisions.** The choices it made, and the alternatives it rejected.
- **What it didn't do.** Assumptions, skipped edge cases, follow-ups.
- **How it was verified.** The commands it ran and what they showed, not "tests pass". Screenshots at phone and desktop width for UI changes.
- **Risk and rollback.** What could break, and how to undo it.
- **Worth learning.** One to three things you'd want to understand before merging.

A description like that tells you where to look. It's also a claim you can check, which a vague summary isn't.

## What the vibe-coded version misses

- **Approving because CI is green.** CI only proves what the tests check. The missing ownership check sails through.
- **Reviewing only the changed lines.** The bug is in the caller that now gets `null`, three files away from the diff.
- **Nitpicking style while an auth hole sits in the diff.** The review feels thorough and blesses the real problem.
- **2,000-line agent PRs merged unread.** Nobody on the team understands that code, so the first bug in it takes days instead of minutes.
- **No test for the bug being fixed.** The fix looks right, nothing proves it, and the bug comes back in the next refactor.
- **Trusting the agent's summary over the code.** The description says "validates input". The code validates one of three fields.
- **Unnecessary machinery waved through.** Each extra layer makes the next change slower and the next review harder.

## What I'd do

For my own projects, every change goes through a PR, even when I'm the only person reviewing. I'd ask agents for small PRs with the description above. I'd read anything touching auth, data, or money line by line, and skim the rest. Before merging anything non-trivial, I'd run the [review-change skill](../../skills/review-change/SKILL.md) for a second opinion, then answer a few comprehension questions myself. If I can't explain it, it doesn't merge until I can.

I'd add more process once other people are committing: required approvals, CODEOWNERS for sensitive paths like auth and migrations, and a PR template with the sections above.

## What changes at scale

- **Required reviewers by path.** CODEOWNERS makes sure the person who knows the billing code sees every billing change.
- **Automated review as a first pass.** Linters, type checks, security scanners, and AI reviewers take the mechanical findings, so human reviewers can focus on design and intent.
- **Review latency becomes a metric.** When PRs wait days, people batch work into bigger PRs, which get worse reviews.
- **Stacked PRs.** Tooling for chains of small dependent changes, so large features still land in reviewable pieces.

## Sources

- [Google engineering practices: Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
- [Git documentation: git-log](https://git-scm.com/docs/git-log) and [git-blame](https://git-scm.com/docs/git-blame)
