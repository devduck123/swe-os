---
title: Database changes without downtime
description: During every deploy, old and new code share one database, so every schema change has to work for both, and rolling back the code never rolls back the data.
stage: ship
track: 17
concerns: [migrations, data, deployment]
freshness: durable
status: draft
---

Code is easy to undo. Data isn't. A migration, a script that changes your database's structure, changes the one thing every version of your app shares. So a rename, drop, or type change goes out across several releases: add the new thing, copy the data, switch the code, then drop the old thing.

## Easy to miss

- **The old code is still running when the migration lands.** The previous deploy, a cron job, or a worker that started earlier still asks for the old column, so a one-step rename breaks all of them.
- **Rolling back the code doesn't roll back the data.** After that rename, the version you roll back to wants a column that's gone, so the rollback makes it worse.
- **A one-millisecond change can freeze a table.** Most schema changes wait for a lock that blocks every read and write, and every query queues behind them. If a slow query is already running, the table is stuck until it ends. A lock timeout makes the migration fail instead.
- **Your dev database is too small to warn you.** A type change that rewrites the table, or an index build that blocks writes, is instant on ten rows and an outage on a million. Real data also has the nulls and duplicates your new rule will trip on. Rehearse on a copy with production's shape.
- **One big `UPDATE` is one big lock.** Backfill in small batches that only pick rows still needing the change, so you can stop it and rerun it. Skip rows that can never be filled, or the loop never finishes.
- **The ORM's shortcut skips the review.** Pushing schema changes straight to the database leaves nothing to read. A SQL file in the PR is where you catch a rename the tool turned into drop-and-add.
- **The drop is the one step you can't take back.** Before it, restore a backup into a copy and check it, as in [when production breaks](when-production-breaks.md).

**How I do it:** I read the SQL migration in every PR, give every change to an existing table a lock timeout, and have the agent plan renames, type changes, and drops as add, copy, switch, drop, one PR per step.

## Go deeper

- [PostgreSQL: Explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL: ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
