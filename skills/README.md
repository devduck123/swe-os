---
title: Using SWE OS with an agent
description: The entry point for coding agents. Pick a skill, follow the shared rules, and load only what the task needs.
---

If you're an agent, start here. Links are relative: resolve them against this file's path or URL, and read the raw Markdown. Reading from a URL, print each file to the terminal with `curl`. There's nothing to save.

SWE OS doesn't replace your judgment. It covers what agents tend to skip by default (checking their own work, the risks a happy path hides, setting a project up to last) and Tommy's preferences. Where your own defaults already do the job well, keep them and skip the ceremony.

If you're a person, this is the page to point your agent at. [Three ways to do it](https://github.com/devduck123/swe-os#use-it-with-an-agent), including a Claude Code plugin. Not Tommy? Your own instructions and your project's `AGENTS.md` override everything here. To use your own voice and default stack, point your project's `AGENTS.md` at your own profile files (see the [project template](../templates/project/AGENTS.md)).

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

**A website is a project too.** A landing page or a coming-soon site in its own repo gets start-project for that repo and build-feature for each change, even when the ask is casual, like "do the sections below the hero next". Agents building one tend to skip the skills because it feels like just a page, and that's where the checks went missing. A page inside a repo that already exists is build-feature alone: use the repo's own tooling, and keep a static page as static files, with no framework, CI, or project docs of its own.

**Tiny changes skip the skills.** A typo, a copy edit, or a one-line fix that adds no behavior: make it, run the checks, and report in a sentence or two. No concern report, and no Worth learning unless something surprised you.

If none fit, work normally and still follow the rules below. If a request spans two, finish the first before the second. Shape before you build.

## Rules for every task

1. **The user and the project come first.** Explicit instructions and the project's own `AGENTS.md` override anything in SWE OS.
2. **Load only what you need.** Read the skill and the concerns and guides it sends you to, not the whole OS. Read them one at a time: a tool that reads several files at once can cut one short without saying so.
3. **Done means you saw it work.** Report what you ran and what it showed. Never claim what you didn't see.
4. **Keep moving on reversible work.** When a question doesn't block code you could undo, make the most likely assumption, say it, build, and ask at the end. A plan with open questions is not a deliverable when the user asked for a feature. The exception is a new product's look when you can't tell [what the product is](../profile/design.md#start-from-what-the-product-is): a wrong guess there means rebuilding it, so ask one question first.
5. **Ask before anything hard to undo,** like destructive data changes, force-pushes, permission or secret changes, or production deploys nobody asked for. Making something public counts: the user sees a private preview before anyone else does.
6. **Ask before signing up for or turning on a paid service** the user hasn't asked for. Writing code that calls a service the user asked for isn't that. Build it, and say what it will cost to run.
7. **Ask before growing the agreed scope.**
8. **Never weaken a meaningful test** to get green.
9. **Name every gap.** When you build, fix, or review, check every concern you picked, then report the ones that aren't done: deferred, unknown, or not applicable for a reason that isn't obvious. What you handled shows in your evidence, so don't list it again. Answers to questions skip this. See [Concerns](../core/concerns/README.md#report-what-you-did-with-each-one).
10. **Sound like SWE OS.** Read [Voice](../profile/voice.md) for every task. If the project's `AGENTS.md` names another profile, use its files instead of Tommy's, here and wherever SWE OS points to `profile/`. Add [Writing](../profile/writing.md) when you write pages, skills, PRs, or a product's copy, and [Learning](../profile/learning.md) when you teach.
11. **Keep private work private:** no employer code, internal names, credentials, customer data, or details of an unreleased private project in public places. A lesson from private work goes in described generically.
12. **Leave a lesson.** End implementation reports with **Worth learning**: one non-obvious decision, concept, or trap you avoided (two at most), linking a guide if one exists, or "nothing new". Never repeat what the reply already said. Put the report in the PR description if you open one. This is how Tommy keeps learning while agents type; see [learn](learn/SKILL.md).
13. **Leave the OS better.** Only when SWE OS guidance actually caused a problem in this task (missing, wrong, too strict, or it pushed you to overbuild), end with one line, written for the user: what went wrong and which file should change. Most tasks have nothing to report, so leave it out. Outside this repo, don't edit a copy. Suggest the user file it with the [agent feedback form](https://github.com/devduck123/swe-os/issues/new?template=agent-feedback.yml).
14. **Work on a branch, and see it to merged.** In a Git repo, build or fix on a short-lived branch off `main`, commit as you go, and finish with a PR when there's a remote, unless the project says otherwise. Never push to `main` directly. Merge only when the gate passes: required checks are green on the latest commit, the branch is up to date with `main`, and you've seen the change work. Until then, wait for the gate, not the user. Once it passes, merge when the user clearly approves ("looks great", "ship it"), or without waiting if the project's `AGENTS.md` says agents merge their own PRs. Say that you merged. That grant covers the deploy a merge sets off, and nothing else rule 5 asks about. That's Tommy's [light trunk-based](../profile/defaults.md#working-with-agents) habit.

## What's here

- [Principles](../core/principles.md): rules of judgment. Read one when a trade-off needs a tiebreaker.
- [Concerns](../core/concerns/README.md): which engineering concerns a task triggers and how deep to go.
- [Guides](../core/guides/README.md): concept explanations. Concern pages link to the ones you need.
- [Tommy](../profile/tommy.md) and [Defaults](../profile/defaults.md): how Tommy thinks and works, and his starting tech choices.
- [Project templates](../templates/project/AGENTS.md): starter `AGENTS.md` and `PROJECT.md` for a new repo.
