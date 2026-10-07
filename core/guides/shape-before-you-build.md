---
title: Shape before you build
description: Turn a vague idea into a person with a problem, a smallest useful slice, and a definition of done an agent can check, before it writes a line.
domain: foundations
stage: understand
freshness: durable
status: draft
track: 3
concerns: [product-ux]
---

Shaping is deciding what to build, for whom, and how you'll know it worked, before anyone writes code. It fits on half a page: who has the problem, what they do today, the smallest slice that helps, how you'll check it's done, what you're not building, and what would tell you to keep going or stop.

It matters more with agents, not less. An agent builds exactly what you ask for, fast, including the wrong thing. Shaping is how you make sure what you ask for is worth building.

## "Build me a habit tracker"

Say you type that into an agent. In an hour you have sign-up with email and Google, habits with categories and colors, streaks, a stats page with charts, push reminders, a friends feed, and an "AI coach" that writes motivational messages. It looks impressive. It's also a pile of decisions you never made. What counts as "today" for someone who checks in at 11:50 p.m.? Does a missed day reset the streak? Who sees the friends feed? Each answer is now code you have to review, own, or delete.

Here's the same idea, shaped:

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

That fits in a prompt. It also fits in the project's `PROJECT.md`, where the next agent session finds it.

## Why it matters more with agents

Building used to be slow, and that slowness hid some free thinking time. While you built the habits table by hand, you'd wonder about time zones or whether anyone wanted a friends feed. Now an agent turns a vague sentence into forty files before you've had that thought.

When a request is vague, an agent fills the gaps with the most common pattern it has seen. For "habit tracker", that's the average habit tracker: every feature every other one has. It won't ask who it's for, because you didn't give it a way to.

Shaping fixes both sides. The slice and the non-goals keep the agent from building what you didn't ask for. The acceptance criteria give it a way to check its own work, and give you a way to tell "done" from "the agent says it's done." That's most of what [start with the user's problem](../principles.md#start-with-the-users-problem) and [AI speeds up implementation, not judgment](../principles.md#ai-speeds-up-implementation-not-judgment) mean in practice.

## When to shape, and how long it takes

Shape anything new that someone besides you will use, anything that would take an agent more than a session, and anything that touches a floor: auth, money, personal data, or deleting things.

The depth scales with the stakes. A new feature in an existing app takes five minutes: one sentence for the outcome, three to five acceptance criteria, and a line of non-goals. A new product deserves an hour, mostly spent on the first two questions.

Skip it for a bug with a clear reproduction, a copy change, or a throwaway experiment where the experiment is the shaping. If you're building something just to learn a tool, the learning is the goal and nothing else needs to be shaped.

## Six questions, in order

Each answer constrains the next one, so the order matters.

**1. Who has the problem?** A specific person, not "users." "Me and two friends trying to stretch every morning" tells you the scale (three people), the device (phones, in the morning), and who you can ask. "Health-conscious millennials" tells you nothing you can build against.

**2. What do they do today?** Their current workaround is your real competition. If the Notes checklist works fine, an app won't beat it. If you can't name what's painful about the workaround, stop here. There's no product yet.

**3. What's the smallest slice that helps?** One complete journey, thin: sign in, do the one thing, see that it worked. It goes through every layer, from the UI to the database to deployed on a real URL. "Design the database schema first" isn't a slice, because nobody can use a schema. The slice should feel almost embarrassingly small.

**4. How will you check it's done?** Write acceptance criteria as behavior someone can observe. "Tapping twice records one check-in" is checkable. "Clean UI" and "fast" aren't. Include at least one edge case and one error case, because those are exactly what an agent skips when nobody names them. Criteria like these turn into tests almost directly. See [how you know it works](how-you-know-it-works.md).

**5. What are you not building?** Write the non-goals down. They're what you tell the agent to leave out, and what you tell yourself when "it'd only take ten minutes to add reminders" comes up. Every unlisted feature is fair game for scope creep, from you or from an eager agent.

**6. What tells you to keep going, and what tells you to stop?** Decide this before you build, while you're still honest. Once you've spent a month on something, every result starts to look like a reason to continue. A kill signal is a gift to your future self.

## The AI part is rarely the product

"AI habit coach" sounds like the product. Look at the shaped version again. The value is the daily check-in and seeing the pattern. The coach is a feature you might test later.

Before building it, try a manual version: write the coaching messages yourself and text them to your two friends for a week. If they ignore them, you've saved yourself a model integration, a prompt, an eval, and a per-use bill. If they love them, you now know what good output looks like, which is the hardest part of [AI features in production](ai-features-in-production.md) anyway. The [AI features concern](../concerns/ai-features.md) starts with whether a model is even the right tool.

## What the vibe-coded version misses

- **The stack before the problem.** The first prompt is "Next.js, Supabase, Stripe, and OpenAI," and the first question about the user comes three weeks later, or never.
- **No definition of done.** The agent says it's finished, and you have nothing to check that against except a vibe. Bugs become arguments about what was intended.
- **Ten features in v1.** Each one is half-finished, none is tested, and you can't tell which one people actually use. Ten features also means ten times the edge cases and ten times the review.
- **No non-goals, so scope creeps.** The agent adds a settings page and dark mode "while it was there," and now you maintain them.
- **Only the happy path in the criteria.** Nobody wrote down the double tap, the time zone, or the empty state, so nobody built them.
- **The AI part treated as the product.** Weeks go into prompts and models for a feature nobody asked for, while the boring part people needed is still rough.
- **No kill signal.** The project never fails, it just fades, and you keep paying for its database.

## What I'd do

- Run the [shape-project](../../skills/shape-project/SKILL.md) skill on any new idea before I let an agent pick a stack. It asks the same questions and pushes back on the weakest assumption.
- Write the shaped slice into `PROJECT.md` when I set up the repo with [start-project](../../skills/start-project/SKILL.md), so every later session starts from it.
- Paste the acceptance criteria and non-goals into the prompt for the first build, and use the criteria as the checklist when I review.
- Ship the slice to a real URL, use it for a week, and only then shape the next slice.

If someone hands me a real spec, at work or from a client, I don't redo it. I add whatever acceptance criteria and non-goals are missing, because those are what an agent needs most.

## What changes at scale

- On a team, the shaped slice becomes a one-page brief or design doc, and the non-goals protect you from stakeholders as much as from agents.
- Success and kill signals become product analytics and experiments instead of "the three of us kept using it."
- Slices ship behind feature flags so you can test them with a few users first. See [shipping changes you can undo](shipping-changes-you-can-undo.md).
