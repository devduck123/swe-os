---
title: Using SWE OS with an agent
description: The entry point for coding agents. Pick a skill, follow the shared rules, and load only what the task needs.
---

If you're an agent, start here. If you're a person, this is the page to point your agent at.

## Pick a skill

| The request sounds like...                                                | Use                                     |
| ------------------------------------------------------------------------- | --------------------------------------- |
| "I want to build X." A new app, product idea, or big change in direction. | [shape-project](shape-project/SKILL.md) |
| "Build X", "add X", "change X". New or changed behavior.                  | [build-feature](build-feature/SKILL.md) |
| "It's broken", "why is X doing Y", a crash, a failing test.               | [debug](debug/SKILL.md)                 |
| "Review this." A diff, a PR, or a plan.                                   | [review-change](review-change/SKILL.md) |
| "Explain X", "how does X work", "why would I use X".                      | [explain](explain/SKILL.md)             |

If none fit, work normally and still follow the rules below. If a request spans two, finish the first before the second. Shape before you build.

## Rules for every task

1. **The user and the project come first.** Explicit instructions and the project's own `AGENTS.md` override anything in SWE OS.
2. **Load only what you need.** Read the skill. Open the concerns and guides it sends you to. Don't read the whole OS.
3. **Done means you saw it work.** Report the commands you ran and what they showed. Never claim a test, deploy, or result you didn't observe.
4. **Keep moving on reversible work.** Write down assumptions and continue.
5. **Stop and ask before** destructive data changes, force-pushing shared branches, permission or IAM changes, production secret changes, new paid services, production deploys nobody asked for, or growing the agreed scope.
6. **Never delete or weaken a meaningful test** to get green.
7. **Name every gap.** For each concern you picked, say whether it's handled, deferred, not applicable, or unknown. See [Concerns](../core/concerns/README.md#report-what-you-did-with-each-one).
8. **Sound like SWE OS.** Read [Voice](../profile/voice.md) for every task. Add [Writing](../profile/writing.md) when you write pages, skills, or PRs, and [Learning](../profile/learning.md) when you teach.
9. **Keep private work private.** No employer code, internal names, credentials, or customer data in public places.

## What's here

- [Principles](../core/principles.md): fourteen rules of judgment. Read one when a trade-off needs a tiebreaker.
- [Concerns](../core/concerns/README.md): which engineering concerns a task triggers and how deep to go.
- [Guides](../core/guides/README.md): concept explanations. Concern pages link to the ones you need.
- [Tommy](../profile/tommy.md) and [Defaults](../profile/defaults.md): how Tommy thinks and works, and his starting tech choices.
- [Project templates](../templates/project/AGENTS.md): starter `AGENTS.md` and `PROJECT.md` for a new repo.
