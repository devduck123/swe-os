---
title: Running several agents at once
description: Parallel agents finish more work, as long as they don't share a folder, a server, a database, or a migration number.
stage: build
track: 14
concerns: [testing, security]
freshness: durable
status: draft
---

Two agents in parallel can do a day's work in an hour. They can also quietly test each other's code, overwrite each other's files, and both add migration 7. None of that shows up as an error. It shows up as a green report about the wrong code.

## Easy to miss

- **Two agents in one folder edit each other's work.** Give each its own git worktree, a second checkout of the same repo on its own branch, so their files never touch.
- **A server that's already running may be another agent's.** Agent B opens the page on port 3000, sees agent A's old build, and reports it working. Each agent starts what it tests, on its own port.
- **A shared local database makes tests lie.** One agent's seed or migration breaks the other's run halfway through. Give each worktree its own database.
- **Two branches can both add migration 7.** Each passes alone, and whichever merges second breaks. Merge one at a time, and rebase the next onto `main` before it goes in.
- **Split the work by files, not by feature list.** Two agents in the same files means a conflict you resolve by hand. Run overlapping work one after the other.
- **Every message re-reads the whole session.** A long session costs more per message as it grows, and reviews of reviews add up fast. Start a fresh session per feature, hand off through PROJECT.md, and spend the extra tokens where a mistake is expensive.
- **A prompt you always approve should be a rule.** Allow the routine commands you've already said yes to, like opening a PR, and deny the destructive ones outright. Ten prompts an hour trains you to approve the eleventh without reading it.

**How I do it:** a worktree per agent, a fresh session and a PR per feature, allow rules for the commands I approve every time, and PRs merged one at a time.

**Ask your agent:** "Before you start, check whether another agent's branch or dev server is running in this repo. Work in your own worktree on your own port, and tell me which files you'll touch."

## Go deeper

- [Git: git worktree](https://git-scm.com/docs/git-worktree)
- [Claude Code: settings and permission rules](https://code.claude.com/docs/en/settings)
