---
title: Shape before you build
description: Turn a vague idea into a person with a problem, a smallest useful slice, and a definition of done an agent can check, before it writes a line.
domain: foundations
stage: understand
freshness: durable
status: reviewed
reviewed: 2026-10-06
track: 3
concerns: [product-ux]
---

Shaping is deciding what to build, for whom, and how you'll know it worked, before anyone writes code. Skip it and an agent decides for you. It fits on half a page: who has the problem, what they do today, the smallest slice that helps, how you'll check it's done, what you're not building, and what would tell you to keep going or stop.

## "Build me a habit tracker"

Type that into an agent, and in an hour you have sign-up with email and Google, habits with categories and colors, streaks, charts, push reminders, a friends feed, and an "AI coach". It's a pile of decisions you never made. What counts as "today" for someone who checks in at 11:50 p.m.? Does a missed day reset the streak? Who sees the friends feed? Each answer is now code you have to review, own, or delete.

Here's the same idea, shaped. Notice that every "Done when" line is something you could check by tapping:

```md
**Who:** Me, and two friends, trying to stretch every morning.
We keep dropping it after about two weeks.

**Today:** A checklist in the Notes app. Nothing shows the pattern,
so one missed day turns into "I guess I stopped."

**Smallest slice:** Sign in, add up to three habits, tap "Done today,"
and see the last seven days as filled or empty dots.

**Done when:**

- Tapping "Done today" twice still records one check-in for that day.
- "Today" is the user's local date. An 11:50 p.m. check-in in
  California counts for that day, not the next one in UTC.
- A new user sees an empty state that tells them to add a habit.
- It works with one thumb on a phone, and with only a keyboard.
- Users only ever see their own habits.

**Not building:** reminders, streak counts, friends, charts beyond
seven days, the AI coach.

**Keep going if:** all three of us check in on at least five of seven
days for three weeks.
**Stop if:** by week two, we've stopped opening it. Then the problem
isn't tracking.
```

That fits in a prompt, and in your `PROJECT.md` (the file in your repo that tracks the goal and decisions, which your agent reads every session).

Notice what an agent wouldn't add on its own. The Done-when list names an edge case (the double tap) and an empty state, because those are what an agent skips when nobody names them. Each line becomes a test: "tapping twice records one check-in" taps twice and counts the rows ([how you know it works](how-you-know-it-works.md)). The "Today" line names your real competition, the current workaround: if you can't say what's painful about it, there's no product yet. And the stop signal is decided before any code, while you're still honest. After a month of work, every result starts to look like a reason to continue.

## A vague request gets the average app

When a request is vague, an agent fills the gaps with the most common pattern it has seen. For "habit tracker", that's the average habit tracker: every feature every other one has. It won't ask who it's for, because you didn't give it a way to.

Shaping fixes both problems. The slice is one complete journey, thin, from the screen to the database, deployed where someone can open it. "Design the schema first" isn't a slice, because nobody can use a schema. The slice and the non-goals keep the agent from building what you didn't ask for, and keep you honest when "it'd only take ten minutes to add reminders" comes up. The acceptance criteria (the "Done when" list) give it a way to check its own work, and give you a way to tell "done" from "the agent says it's done."

## Shape when the stakes justify it

Shape anything new that someone besides you will use, anything that would take an agent more than a session, and anything that touches a floor: auth, money, personal data, or deleting things.

The depth scales with the stakes. A new feature in an existing app takes five minutes: one sentence for the outcome, three to five acceptance criteria, and a line of non-goals. A new product deserves an hour, mostly spent on who has the problem and what they do today.

Skip it for a bug with a clear reproduction, a copy change, or an experiment where building is the shaping, like learning a tool.

## The AI part is rarely the product

"AI habit coach" sounds like the product. In the shaped version, the value is the daily check-in and seeing the pattern. The coach is a feature you might test later.

Before building it, try a manual version: write the coaching messages yourself and text them to your two friends for a week. If they ignore them, you've saved yourself a model integration, a prompt, and a per-use bill. If they love them, you now know what good output looks like, which is the hardest part of [AI features in production](ai-features-in-production.md) anyway.

## How I do it

On my own side projects:

- Run the [shape-project](../../skills/shape-project/SKILL.md) skill (a saved workflow your agent follows) on any new idea before I let an agent pick a stack. It asks the same questions and pushes back on the weakest assumption.
- Write the shaped slice into `PROJECT.md` when I set up the repo with [start-project](../../skills/start-project/SKILL.md), so every later session starts from it.
- Paste the acceptance criteria and non-goals into the prompt for the first build. Then ask the agent: "Write one test for each Done-when line, and show me each one passing." The same list is my review checklist.
- Ship the slice to a real URL, use it for a week, and only then shape the next slice.

## The standard

- **The riskiest assumption gets tested with people who have the problem, not just you and your friends,** like the manual coach above. Do it before building for strangers, or anything costing real money or over a week.
- **The keep-going and stop signals get a review date, and the review happens.** Do it once someone else's time or money goes in. See [product and UX](../concerns/product-ux.md).
- **Someone owns the spec, and you add its missing acceptance criteria and non-goals instead of redoing it.** Do it when a second person decides what gets built, at work or for a client.

## Before you ship, check

Paste this to your agent before you merge:

- The shaped slice (who, today, slice, done when, not building, keep going or stop) is in `PROJECT.md`.
- The Done-when list has at least one edge case and one error or empty case.
- Every Done-when line has a test, and you've shown me each one passing.
- Nothing on the Not-building list made it into the code.
- The slice is deployed where someone besides me can open it.
