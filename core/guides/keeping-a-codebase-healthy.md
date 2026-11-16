---
title: Keeping an agent-built codebase healthy
description: Agents copy what's nearby and forget what they wrote last week, so a codebase drifts unless someone cleans it up on purpose.
stage: improve
track: 25
concerns: [testing]
freshness: durable
status: draft
---

An agent writes each feature from the files it reads that session. It copies the patterns it sees and can't remember the helper it wrote last week. Six months in, the app works, but every change takes longer, because there are three ways to do everything. Cleanup is the one job agents never start on their own.

## Easy to miss

- **Agents copy what's nearby.** One shortcut in one file becomes the pattern for every feature after it. Fix a bad pattern early, before it's copied ten times.
- **Every session writes its own helper.** A fresh session can't see last week's `formatDate`, so it writes another. Three near-copies drift apart, each with its own bug.
- **A refactor that changes behavior is two changes.** Move code and change what it does in one PR, and a failing test could be either. Keep them in separate PRs.
- **Lock behavior before you move it.** Tests that pin what the code does today, odd parts included, are what make a refactor safe. Without them, "it builds" is all you know.
- **Stale instructions mislead every session after.** An `AGENTS.md` that describes last month's structure sends every new agent the wrong way. Update it in the same PR as the change.
- **Dead code gets read, copied, and revived.** Agents treat it like live code. Delete it instead of commenting it out. Git remembers.
- **Cleanup never gets scheduled.** Bug fixes rightly note a refactor and move on, and the notes pile up. Pick one off every few features.

**How I do it:** a cleanup PR every few features. Behavior gets pinned by tests first, then duplicates are merged, unused code is deleted, and `AGENTS.md` is brought up to date.

**Ask your agent:** "Find duplicated helpers, unused code, and things done three different ways. Pin today's behavior with tests, then make the smallest cleanup that fixes the worst one, without changing what the app does."

## Go deeper

- [Martin Fowler: refactoring](https://refactoring.com)
