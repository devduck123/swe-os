---
title: Keeping an agent-built codebase healthy
description: Agents copy what's nearby and forget what they wrote last week, so a codebase drifts unless someone cleans it up on purpose.
stage: improve
track: 25
concerns: [testing]
freshness: durable
status: reviewed
---

An agent writes each feature from the files it reads that session. It copies the patterns it sees and can't remember the helper it wrote last week. Six months in, the app works, but every change takes longer, because there are three ways to do everything. Cleanup is the job nobody asks an agent for.

## Easy to miss

- **Agents copy what's nearby.** One shortcut in one file becomes the pattern for every feature after it. Fix a bad pattern early, before it's copied ten times.
- **Every session writes its own helper.** A fresh session doesn't know last week's `formatDate` exists and won't search unless told, so it writes another. Three near-copies drift apart, each with its own bug.
- **A refactor that changes behavior is two changes.** Move code and change what it does in one PR, and a failing test could be either. Keep them in separate PRs.
- **Lock behavior before you move it.** Tests that pin what the code does today, odd parts included, are what make a refactor safe. Without them, "it builds" is all you know.
- **Stale docs get believed.** Agents trust `AGENTS.md` and the docs over the code. On the Mac utility I'm building, three docs said the build was signed a way it no longer was, so every install reset a permission to fix a problem that didn't exist. Update docs in the same PR as the change.
- **Dead code gets read, copied, and revived.** Agents treat it like live code. Delete it instead of commenting it out. Git remembers.
- **Cleanup never gets scheduled.** Bug fixes rightly note a refactor and move on, and the notes pile up. The signal to stop and clean up: a change that takes longer than it should, or the same bug fixed twice.

**How I do it:** I clean up when it starts hurting, with today's behavior pinned by tests first, and docs updated in the same PR as the code.

**Ask your agent:** "Find duplicated helpers, unused code, and things done three different ways. Pin today's behavior with tests, then make the smallest cleanup that fixes the worst one, without changing what the app does."

## Go deeper

- [Martin Fowler: refactoring](https://refactoring.com)
