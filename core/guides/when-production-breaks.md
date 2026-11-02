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

- **Stop it before you understand it.** Roll back, turn the feature off with a feature flag (a switch you can flip without deploying), or take the route offline. Redeploying guesses is a production change made under stress. Roll back before you push a fix, because some hosts only go back one deploy.
- **Rolling back the code doesn't stop the writes.** A scheduled job, a background worker (code that runs outside any page request), or a database trigger can keep destroying data after the deploy is reverted. Ask "what is still writing right now?" and stop all of it.
- **A backup you haven't restored is a hope.** Daily backups lose everything since last night. Point-in-time recovery, restoring to any minute, reaches back only as far as your plan keeps history, and some free tiers keep none. If that window is shorter than it takes someone to notice, the data is gone.
- **Restore next to production, not over it.** Restoring in place throws away every good write since. Restore into a separate database, then copy back only the rows that were lost. Sent emails and charges don't come back either way.
- **The cheapest restore is the one you skip.** Soft-delete: mark rows deleted instead of removing them, and remove them for real on a schedule. Have the code refuse any delete that would hit more than, say, 100 rows. A filter bug then hits a wall instead of the whole table.
- **"Be more careful" changes nothing.** In the write-up afterward, a postmortem, ask why the system made the mistake easy, not who made it. Each fix is a check in code that blocks it, a test, or an alert.

**How I do it:** before launch I know my stop buttons, soft-delete what users create, and do one restore drill: restore a backup into a copy and check that yesterday's rows are there. After anything that hits users, I ship at least one change from the postmortem.

**Ask your agent:** "Show me every way to stop this app fast: rolling back a deploy, switching a feature off, and pausing each background job. Then walk me through restoring yesterday's database into a copy, and switch deletes of user data to soft-delete."

## Go deeper

- [Google SRE book: Postmortem culture](https://sre.google/sre-book/postmortem-culture/)
- [Supabase: Database backups](https://supabase.com/docs/guides/platform/backups)
