---
title: Running several agents at once
description: Parallel agents finish more work, as long as they don't share a folder, a server, a database, or a migration number, and you can review it all.
stage: build
track: 14
concerns: [testing, security]
freshness: durable
status: reviewed
---

Two agents can finish twice the work, if you can review twice the work. They can also quietly test each other's code, overwrite each other's files, and both add migration 7. None of that shows up as an error. It shows up as a green report about the wrong code.

## Easy to miss

- **You're the bottleneck.** Every agent ends in a PR that waits on your review. More agents than you can review means a longer queue, or merges nobody read.
- **Two agents in one folder edit each other's work.** Give each its own git worktree, a second checkout of the same repo on its own branch, so their files never touch. Remove it when its PR merges, or it keeps the branch checked out and Git won't delete it.
- **A server that's already running may be another agent's.** Agent B opens the page on port 3000, sees agent A's old build, and reports it working. Each agent starts what it tests, on its own port.
- **A shared local database makes tests lie.** One agent's seed or migration breaks the other's run halfway through. Give each worktree its own database, or run database work one agent at a time.
- **Two branches can both add migration 7.** Each passes alone, and whichever merges second breaks. Merge one at a time, and give the next one a new number after updating it from `main`.
- **Split the work by files, not by feature list.** Two agents in the same files means a conflict you resolve by hand. Run overlapping work one after the other. A changelog, a tracker, or the lockfile conflicts even when the features don't.
- **Every message re-reads the whole session.** A long session costs more per message as it grows. Start a fresh session for unrelated work, hand off through PROJECT.md, and spend the extra tokens where a mistake is expensive.
- **Routine prompts train you to stop reading.** Ten prompts an hour, and you approve the eleventh without reading it. Let routine commands through with allow rules or your agent's auto-approve mode, and deny the destructive ones outright.

**How I do it:** a worktree per agent that I remove when its PR merges, a fresh session for unrelated work and one session for a connected batch, auto mode for routine commands, and PRs merged one at a time.

**Ask your agent:** "Before you start, check whether another agent's branch or dev server is running in this repo. Work in your own worktree on your own port, and tell me which files you'll touch."

## Go deeper

- [Git: git worktree](https://git-scm.com/docs/git-worktree)
- [Claude Code: permission rules and modes](https://code.claude.com/docs/en/permissions)
