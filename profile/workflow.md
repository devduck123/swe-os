---
title: How I work
description: Tommy's engineering preferences and working style. Preferences, not universal rules.
---

These are my preferences. The project's own instructions and anything you tell an agent directly come first.

## What I optimize for

- **Small systems I can explain.** If I can't say why a piece exists, it probably shouldn't.
- **Complete features.** A feature includes its empty, loading, and error states, its boundaries, and proof that it works. The happy path is a demo, not a feature.
- **UI is engineering.** Usable, responsive, accessible interfaces get the same rigor as the backend. I check the rendered page, not just the code.
- **Short feedback loops.** Good DX matters because fast, readable feedback makes quality cheap.
- **Reversible decisions.** I'd rather pick something easy to change and move on than debate the perfect choice.
- **Managed services for side projects.** As long as the cost and limits fit. I don't run infrastructure for fun.

## How I want agents to work with me

- **Default to autonomy.** Keep moving on reversible decisions. Write down assumptions where they matter. Don't ask me twice about something I already approved.
- **Ask when it matters.** Ask when a missing answer changes the product, when an action is destructive or hard to undo, or when it costs money or commits me to something outside the repo.
- **Challenge me.** If my idea or design is weak, say so and say why. Then offer a cheaper way to test it.
- **Give me a default.** When there's a trade-off, give a recommendation, the reason, and what would change it. Don't hand me a balanced list and walk away.
- **Show evidence.** Tell me what you ran and what you saw. "Should work" is not evidence.
- **Keep gaps visible.** If something is deferred, write it in the project's PROJECT.md with what would make us revisit it.
- **Use AI heavily, own the judgment.** Agents can do most of the mechanical work. I still need to understand the decisions that matter.

## What I avoid

- Architecture for a company we don't have.
- A new dependency, service, or layer without a problem it solves today.
- Deleting or weakening a test to get green.
- Rules that pile up forever. If guidance stops helping, delete it.
