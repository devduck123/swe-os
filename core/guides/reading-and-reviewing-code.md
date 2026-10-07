---
title: Reading and reviewing code you didn't write
description: How to understand an unfamiliar codebase or an agent's diff fast, where a real review spends its attention, and why you shouldn't merge what you can't explain.
domain: foundations
stage: verify
freshness: durable
status: reviewed
reviewed: 2026-10-06
track: 15
concerns: [testing, security]
---

Reading code is how you find out what's actually true about a system, as opposed to what the README, the PR description, or the agent's summary says. Reviewing is deciding whether a change deserves to exist in that system. With agents, these two skills are most of the job. An agent can write a 600-line PR in four minutes, and whether it's good is still your call.

## Green CI and a nice summary aren't a review

An agent opens "Add CSV export for invoices." The description is clear, the tests pass, the code is tidy. You skim the diff and merge.

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

It never checks that the logged-in user belongs to `teamId`. Anyone with an account can export any team's invoices by changing a number in the URL. The tests pass because they use a team the test user owns. CI checks what the tests check, and nobody wrote the test that mattered.

Nothing in the diff looks wrong. The bug is what's missing, and you only see it if you know what this kind of route must always do. That's the skill.

## Match the depth to the damage

Read every line of anything that touches auth or permissions, money, data deletion, migrations, email or paid APIs, and anything hard to undo once deployed. Skim copy, styling, test-only changes, and throwaway prototypes: check that they do what they say, then move on.

When in doubt, ask: if this is wrong, who finds out, and how bad is it? [Shipping changes you can undo](shipping-changes-you-can-undo.md) lowers the cost of being wrong, but it doesn't help with leaked data or a broken migration.

## Read an unfamiliar codebase from the outside in

Start where the system starts, not in random files.

1. **Find the entry points.** `package.json` scripts, the `app/` routes, middleware, the database schema, the env vars it expects.
2. **Trace one request end to end.** Follow one real action, like "user saves a profile", from the click to the database and back. [How a request travels](how-a-request-travels.md) is the map.
3. **Read the tests.** They're the closest thing to a spec, and the gaps show what the author didn't think about.
4. **Ask Git why.** Code tells you what. History tells you why.
5. **Run it.** Click through, change a value, break something on purpose. The gap between what you predicted and what happened is where you learn.

```sh
git log --oneline -20 -- app/api/export     # what changed here recently
git log -S 'teamId' -p -- app/api            # when this string appeared or vanished
git blame -w -C app/api/export/route.ts      # who last touched each line, following moved code
git log -L :GET:app/api/export/route.ts      # the history of one function
```

Agents are great at the first pass: "trace what happens when a user saves a profile, with file and line references." Then check two or three of its claims against the code, because agents sound just as sure when they're wrong.

## Spend attention where the damage is

Review attention runs out, so spend it in order. First, **correctness**: does it do what it claims, edge cases included? Second, **data**: can it delete, overwrite, or quietly mangle anything? Third, **security**: who can call this, with what input, touching whose data? Style comes last.

Ten comments about naming and zero about the missing ownership check is a review that made the merge riskier, because it stamped the PR approved.

The [review-change skill](../../skills/review-change/SKILL.md) has the full checklist. Three habits from it matter most when you review by hand:

- **Review past the diff.** Most real bugs sit where changed code meets code it didn't touch. If the PR changes what a function returns, open its callers.
- **Prove each finding.** "Request `/export?teamId=7` as a user on team 3. You get team 7's invoices." A finding with a reproduction gets fixed. "This feels risky" gets argued about.
- **Flag machinery the change doesn't need.** A factory with one product, a config option nobody sets, a dependency for ten lines of code. [Simple first](simple-first.md) explains the cost.

## Don't merge what you can't explain

Before merging anything non-trivial, you should be able to explain what it does, why it's built this way, and how it fails. Not the agent. You.

A quick self-check: without looking, how does this change handle a user who isn't on the team? What happens if the export has 100,000 rows? If you can't answer, you haven't reviewed it yet. You've read it. [Learning while agents write the code](learning-with-agents.md) turns this into a habit.

## Small PRs get real reviews

Big PRs get skimmed. Google's code review guide calls 100 lines usually reasonable and 1,000 usually too large. Small changes get reviewed more thoroughly, introduce fewer bugs, and are simpler to roll back.

Agents don't feel the cost of a big PR, so ask for small ones: the migration in one PR, the server logic in the next, the UI last. And ask for the description in the [build-feature report format](../../skills/build-feature/SKILL.md#report), which says how it was verified and what wasn't, so you know where to look.

## What the vibe-coded version misses

- **Approving because CI is green.** CI only proves what the tests check, so the missing ownership check ships and every team's invoices are one URL edit away.
- **Reviewing only the changed lines.** The bug is in the caller that now gets `null`, three files from the diff, and it surfaces as a production crash.
- **Nitpicking style while an auth hole sits in the diff.** The review feels thorough and puts your approval on the real problem.
- **2,000-line agent PRs merged unread.** Nobody understands that code, so its first bug takes days instead of minutes.
- **Trusting the agent's summary over the code.** The description says "validates input". The code validates one of three fields.

## What I'd do

Every change goes through a PR, even when I'm the only reviewer. I'd ask agents for small PRs with a real description, read anything touching auth, data, or money line by line, and skim the rest. Before merging anything non-trivial, I'd run the review-change skill for a second opinion, then answer the self-check questions myself. If I can't explain it, it doesn't merge until I can.

Once other people commit, I'd add required approvals and CODEOWNERS for auth and migrations.

## Sources

- [Google engineering practices: Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
- [Git documentation: git-log](https://git-scm.com/docs/git-log) and [git-blame](https://git-scm.com/docs/git-blame)
