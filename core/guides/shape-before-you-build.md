---
title: Shape before you build
description: Decide who it's for, the smallest useful slice, and what "done" means before an agent writes a line, or the agent decides for you.
stage: understand
track: 3
concerns: [product-ux]
freshness: durable
status: reviewed
---

Shaping, deciding what to build before anyone builds it, fits on half a page: who has the problem, what they do today, the smallest slice that helps, how you'll know it's done, what you're not building, and what would tell you to stop. Five minutes for a feature, an hour for a new product, nothing for a clear bug fix.

## Easy to miss

- **A vague request gets the average app.** Ask for "a habit tracker" and the agent adds the features most habit trackers have. Each one is a decision you didn't make and code you now own.
- **Your real competition is what they do today.** If you can't say what hurts about the current workaround, like a checklist in Notes, there's no product yet.
- **A slice is something a person can use.** One thin path from the screen to the database, deployed where someone can open it. For a habit tracker: sign in, add one habit, check it off. A schema, the table design on its own, isn't a slice. Nobody can use it.
- **Agents skip what nobody names.** Put an edge case and an empty state, what the screen shows before there's any data, in your "done when" list, like "tapping twice records one check-in." Each line becomes a test, a small check the agent writes and reruns on every change. The list is how you tell done from "the agent says it's done."
- **Write down what you're not building.** It stops the agent from adding it, and stops you when "reminders would only take ten minutes" comes up.
- **Decide the stop signal before any code.** Write the result that would make you quit, like "nobody checks in twice in the first two weeks." After a month of work, every result looks like a reason to keep going.
- **The AI part is rarely the product.** Before building an "AI coach", write the messages yourself for a week. If people ignore them, you saved a model bill.

**How I do it:** I talk a new idea through with an agent before it picks a stack, and keep the shape in `PROJECT.md`, a file at the root of the repo my agents read first.

**Ask your agent:** "Before any code, ask me what you need to know to build the smallest useful version of this."

## Go deeper

- [Basecamp: Shape Up](https://basecamp.com/shapeup)
- [Paul Graham: Do Things That Don't Scale](https://paulgraham.com/ds.html)
