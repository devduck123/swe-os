---
title: When production breaks anyway
description: Stop the damage before you understand it, and restore from a backup you've actually tested. Most incidents get worse because someone did things out of order.
stage: operate
track: 19
concerns: [reliability, data, observability]
freshness: durable
status: draft
---

When production breaks, the order is: stop the damage, understand it, fix it, then make sure it can't happen the same way again. The other half is backups. A bad deploy rolls back in a minute. Lost data comes back only if a backup covers the right moment and you know how to restore it.

## Easy to miss

- **Stop it before you understand it.** Roll back, flip the feature's flag off, or take the route offline. Redeploying guesses is a production change made under stress. Roll back before you push a fix, because some hosts only go back one deploy.
- **Rolling back the code doesn't stop the writes.** A scheduled job or a worker can keep destroying data after the deploy is reverted. Ask "what is still writing right now?" and stop all of it.
- **Silence is worse than bad news.** One sentence works: what's broken, that you're on it, and when you'll update next.
- **A backup you haven't restored is a hope.** Daily backups lose everything since last night. Point-in-time recovery, restoring to any minute, reaches back only as far as your plan keeps history, and some free tiers keep none. If that window is shorter than it takes someone to notice, the data is gone. Restore a copy once to learn what you really have.
- **Restore next to production, not over it.** Restoring in place throws away every good write since. Restore a copy and move back only what was lost. Sent emails and charges don't come back either way.
- **The cheapest restore is the one you skip.** Mark rows deleted instead of removing them, refuse bulk deletes over a cap, and purge for real on a schedule. A filter bug then hits a wall instead of the whole table.
- **"Be more careful" changes nothing.** A blameless postmortem asks why the system made the mistake easy, and each fix is a guard, test, or alert.

**How I do it:** before launch I know my stop buttons, soft-delete what users create, and do one restore drill. After anything that hits users, I ship at least one change from the postmortem.

## Go deeper

- [Google SRE book: Postmortem culture](https://sre.google/sre-book/postmortem-culture/)
- [Supabase: Database backups](https://supabase.com/docs/guides/platform/backups)
