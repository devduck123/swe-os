---
title: Using SWE OS with an agent
description: The entry point for coding agents. Pick a skill, follow the shared rules, and load only what the task needs.
---

If you're an agent, start here. Links are relative: resolve them against this file's path or URL, and read the raw Markdown. Reading from a URL, print each file to the terminal with `curl`. There's nothing to save.

If you're a person, this is the page to point your agent at. [Two ways to do it](https://github.com/devduck123/swe-os#use-it-with-an-agent). Not Tommy? Your own instructions and your project's `AGENTS.md` override everything here, and you can fork the repo and rewrite `profile/` to make it yours.

## Pick a skill

| The request sounds like...                                                     | Use                                     |
| ------------------------------------------------------------------------------ | --------------------------------------- |
| "I want to build X." A new app, product idea, or big change in direction.      | [shape-project](shape-project/SKILL.md) |
| "Set up a new project", "start a repo". A new codebase, or one with no setup.  | [start-project](start-project/SKILL.md) |
| "Build X", "add X", "change X". New or changed behavior.                       | [build-feature](build-feature/SKILL.md) |
| "It's broken", "why is X doing Y", a crash, a failing test.                    | [debug](debug/SKILL.md)                 |
| "Review this." A diff, a PR, or a plan.                                        | [review-change](review-change/SKILL.md) |
| "Explain X", "how does X work", "why would I use X".                           | [explain](explain/SKILL.md)             |
| "Walk me through this PR", "catch me up", "quiz me". Learning from agent work. | [learn](learn/SKILL.md)                 |

**Tiny changes skip the skills.** A typo, a copy edit, or a one-line fix that adds no behavior: make it, run the checks, and report in a sentence or two. No concern report, and no Worth learning unless something surprised you.

If none fit, work normally and still follow the rules below. If a request spans two, finish the first before the second. Shape before you build.

## Rules for every task

1. **The user and the project come first.** Explicit instructions and the project's own `AGENTS.md` override anything in SWE OS.
2. **Load only what you need.** Read the skill and the concerns and guides it sends you to, not the whole OS.
3. **Done means you saw it work.** Report what you ran and what it showed. Never claim what you didn't see.
4. **Keep moving on reversible work.** Write down assumptions and continue.
5. **Ask before anything hard to undo,** like destructive data changes, force-pushes, permission or secret changes, or production deploys nobody asked for.
6. **Ask before adding a paid service.**
7. **Ask before growing the agreed scope.**
8. **Never weaken a meaningful test** to get green.
9. **Name every gap.** For each concern you picked, say whether it's handled, deferred, not applicable, or unknown. See [Concerns](../core/concerns/README.md#report-what-you-did-with-each-one).
10. **Sound like SWE OS.** Read [Voice](../profile/voice.md) for every task. Add [Writing](../profile/writing.md) when you write pages, skills, or PRs, and [Learning](../profile/learning.md) when you teach.
11. **Keep private work private:** no employer code, internal names, credentials, or customer data in public places.
12. **Leave a lesson.** End implementation reports with **Worth learning**: one to three non-obvious decisions, concepts, or traps you avoided, linking a guide if one exists, or "nothing new". Put the report in the PR description if you open one. This is how Tommy keeps learning while agents type; see [learn](learn/SKILL.md).
13. **Leave the OS better.** If SWE OS guidance was missing, wrong, too strict, or pushed you to overbuild, end your report with one line naming what happened and which file should change. Outside this repo, propose the change; don't edit a copy.

## What's here

- [Principles](../core/principles.md): rules of judgment. Read one when a trade-off needs a tiebreaker.
- [Concerns](../core/concerns/README.md): which engineering concerns a task triggers and how deep to go.
- [Guides](../core/guides/README.md): concept explanations. Concern pages link to the ones you need.
- [Tommy](../profile/tommy.md) and [Defaults](../profile/defaults.md): how Tommy thinks and works, and his starting tech choices.
- [Project templates](../templates/project/AGENTS.md): starter `AGENTS.md` and `PROJECT.md` for a new repo.
