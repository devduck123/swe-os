---
name: learn
description: Help Tommy actually learn from what his agents built. Walk through a PR and check his understanding before merge, catch him up on recent agent work, run a spaced review of past lessons, or set up a piece for him to write himself. Use only when he asks to learn, review, quiz, or catch up. For explaining a new concept from scratch, use explain.
metadata:
  title: Learn
  example: 'Walk me through this PR and quiz me before I merge.'
---

# Learn

Agents write most of the code now. This skill makes sure Tommy still understands it. Follow the [rules for every task](../README.md#rules-for-every-task) and the study mode in [Learning](../../profile/learning.md#how-tommy-learns): explain, then he recalls, then you correct.

Agent memory isn't Tommy's learning. CLAUDE.md notes, agent learnings files, and retros make the agent better. This skill is about what Tommy can explain without the code in front of him. [Learning while agents write the code](../../core/guides/learning-with-agents.md) explains why it works this way.

## Pick the mode

- **Walkthrough:** "walk me through this PR", "before I merge".
- **Catch-up:** "catch me up", "what did my agents do this week".
- **Review:** "quiz me", "review what I've learned".
- **Own a piece:** "I want to write the core of this myself".

## Walkthrough

1. Read the diff, the PR description and its "Worth learning" items, and any prediction Tommy wrote when he started the task. If he wrote one, compare it first.
2. Walk the change in the order of its decisions, not file order. For each decision, say what changed, why, and what it rules out. Quote small snippets from the real code. Skip the routine parts.
3. Ask three to five questions he answers from memory: why this approach, what fails if something specific goes wrong, and where he'd look if it broke. Include at least one debugging question. No multiple choice.
4. Grade against the code, not against how confident he sounds. Correct misses plainly and point to the line that proves it.
5. Write a record for what he showed he understands.

Keep it under about ten minutes. If he wants to skip the questions, skip them, and name what he didn't check.

## Catch-up

1. List the PRs merged since the last catch-up, for example with `gh pr list --state merged --search "merged:>=YYYY-MM-DD"`, or read `git log` on main.
2. Collect their "Worth learning" items and group them by concept.
3. Teach the one or two that matter most: a concept that keeps coming up, one in a safety-floor area (auth, data, money, models that take actions), or one he got wrong before. Link a guide if one exists.
4. Offer a walkthrough of any PR he's fuzzy on.

## Review

1. Read `LEARNING.md` and pick up to five records whose next review date has passed.
2. Ask one question per record about the decision or concept. Never ask trivia. He answers before you show anything.
3. If he gets it, push the next review out: one week, then three weeks, then two months, then retire it. If he misses, re-explain briefly and reset it to one week.

A good time to run this is while agents are working.

## Own a piece

When Tommy says he wants to own an area, the agent building it leaves the core decision for him. That's one `TODO(human)` in the code, with the context, the task, the constraints, and a failing test that defines done. Do it at most once per feature, and only where it's worth his time. Safety-floor areas pay off most. When he's done, review his code and give him one useful insight.

## Records

Keep records in `LEARNING.md` at the project root. Only this skill writes to it, because parallel agents writing to the same file collide. If the repo is public, ask Tommy once whether to commit it or keep it local and gitignored, and note his answer at the top of the file. Write a record only when Tommy shows understanding: he answered a question correctly, explained something back without being asked, or had a misconception corrected. Covering a topic isn't learning it.

```
## 2026-10-06: Idempotency keys for retried POSTs
- Can explain: why retrying POST /orders needs a key, and where the server stores it.
- Evidence: walkthrough of PR #14. Missed key retention, corrected.
- Next review: 2026-10-13
```

If a concept shows up across projects, or he misses it twice, say so: "This could be a SWE OS guide: <title>."

## Stop rules

- Only quiz when Tommy asked for this skill. Never quiz during normal work.
- If a PR has nothing worth learning, say so and stop.
- Never write a record for understanding he didn't demonstrate.
