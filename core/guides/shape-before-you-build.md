---
title: Shape before you build
description: Decide who it's for, the smallest useful slice, and what "done" means before an agent writes a line, or the agent decides for you.
stage: understand
track: 3
concerns: [product-ux]
freshness: durable
status: draft
---

Shaping fits on half a page: who has the problem, what they do today, the smallest slice that helps, how you'll know it's done, what you're not building, and what would tell you to stop. Five minutes for a feature, an hour for a new product, nothing for a clear bug fix.

## Easy to miss

- **A vague request gets the average app.** Ask for "a habit tracker" and the agent adds every feature every habit tracker has. Each one is a decision you didn't make and code you now own.
- **Your real competition is what they do today.** If you can't say what hurts about the current workaround, like a checklist in Notes, there's no product yet.
- **A slice is something a person can use.** One thin journey from the screen to the database, deployed where someone can open it. Nobody can use a schema.
- **Agents skip what nobody names.** Put an edge case and an empty state in your "done when" list, like "tapping twice records one check-in." Each line becomes a test, and the list is how you tell done from "the agent says it's done."
- **Write down what you're not building.** It stops the agent from adding it, and stops you when "reminders would only take ten minutes" comes up.
- **Decide the stop signal before any code.** After a month of work, every result looks like a reason to keep going.
- **The AI part is rarely the product.** Before building an "AI coach", write the messages yourself for a week. If people ignore them, you saved a model bill.

**How I do it:** I run [shape-project](../../skills/shape-project/SKILL.md) on any new idea before an agent picks a stack, keep the shape in `PROJECT.md`, and ask for one test per done-when line.

## Go deeper

- [Basecamp: Shape Up](https://basecamp.com/shapeup)
- [Paul Graham: Do Things That Don't Scale](https://paulgraham.com/ds.html)
