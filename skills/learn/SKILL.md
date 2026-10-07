---
name: learn
description: Help Tommy learn from what his agents built. Walk through a PR and check his understanding before merge, catch him up on recent agent work, or set up a piece for him to write himself. Use only when he asks for one of these. Not for reviewing code for defects (use review-change) or explaining a new concept from scratch (use explain).
metadata:
  title: Learn
  example: 'Walk me through this PR and quiz me before I merge.'
---

# Learn

Make sure Tommy can explain what his agents built without the code in front of him. Agent memory isn't his learning. Follow the [rules for every task](../README.md#rules-for-every-task) and the study mode in [Learning](../../profile/learning.md#how-tommy-learns): explain, he recalls, you correct. [Learning while agents write the code](../../core/guides/learning-with-agents.md) explains why.

## Pick the mode

- **Walkthrough:** "walk me through this PR", "before I merge".
- **Catch-up:** "catch me up", "quiz me", "what did my agents do this week".
- **Own a piece:** "I want to write the core of this myself".

## Walkthrough

1. Read the diff, the PR description, and its "Worth learning" items.
2. Walk the decisions in order, not the files. For each, say what changed, why, and what it rules out, quoting small snippets of real code. Skip the routine parts.
3. Ask three to five questions he answers from memory: why this approach, what fails if something specific goes wrong, and where he'd look if it broke. No multiple choice.
4. Grade against the code, not his confidence. Correct misses plainly and point to the line that proves it.
5. Write a record for what he showed he understands.

Keep it under ten minutes. If he skips the questions, name what he didn't check.

## Catch-up

1. List the PRs merged since the last catch-up (the newest date in `LEARNING.md`), with `gh pr list --state merged --search "merged:>=YYYY-MM-DD"` or `git log` on main.
2. Collect their "Worth learning" items and group them by concept.
3. Teach the one or two that matter most: a concept that keeps coming up, one in a safety-floor area (auth, data, money, models that take actions), or one he got wrong before. Link a guide if one exists. Offer a walkthrough of any PR he's fuzzy on.
4. End with one recall question from an older record in `LEARNING.md`. He answers before you show anything.

## Own a piece

The agent building the feature leaves the core decision for Tommy: one `TODO(human)` with the context, constraints, and a failing test that defines done. Do it at most once per feature, where it's worth his time, ideally in a safety-floor area. When he's done, review his code and give one useful insight.

## Records

Keep records in `LEARNING.md` at the project root. Only this skill writes to it, so parallel agents don't collide. If the repo is public, ask once whether to commit it or gitignore it, and note the answer at the top. Write a record only when he shows understanding: a correct answer, an unprompted explanation, or a corrected misconception.

```
## 2026-10-06: Idempotency keys for retried POSTs
- Can explain: why retrying POST /orders needs a key, and where the server stores it.
- Evidence: walkthrough of PR #14. Missed key retention, corrected.
```

If a concept shows up across projects, or he misses it twice, say so: "This could be a SWE OS guide: <title>."

## Stop rules

- Only quiz when Tommy asked for this skill. Never quiz during normal work.
- If a PR has nothing worth learning, say so and stop.
- Never write a record for understanding he didn't demonstrate.
