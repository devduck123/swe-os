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

- **The old code is still running when the migration lands.** The previous deploy, a scheduled job, or a background worker that started earlier still asks for the old column, so a one-step rename breaks all of them. Rolling back doesn't help: the version you go back to wants a column that's gone.
- **A one-millisecond change can freeze a table.** Most schema changes briefly lock the table, taking it for themselves, and every read and write waits in line behind them. If a slow query is already running, everything waits for it. A lock timeout, one line at the top of the migration, makes it give up instead.
- **Your dev database is too small to warn you.** Changing a column's type can rewrite every row, and building an index, the lookup that makes queries fast, blocks writes unless you build it concurrently. Both are instant on ten rows and an outage on a million. Real data also has the nulls and duplicates your new rule will trip on. Rehearse on a copy with production's size and mess.
- **One giant `UPDATE` holds the table hostage.** Changing every row in one statement locks them all until it ends. Fill in a new column a few thousand rows at a time, picking only rows that still need it, so you can stop and restart safely.
- **A schema push skips the review.** Commands like `prisma db push`, or edits in the dashboard, change the database directly and leave nothing to read. A SQL migration file in the PR is where you catch a rename the tool turned into dropping the column and adding an empty one.
- **The drop is the one step you can't take back.** Before it, restore a backup into a scratch database and check the data is there, as in [when production breaks](when-production-breaks.md).

**How I do it:** I read the SQL migration in every PR, and nothing that renames, retypes, or drops a column ships in one step.

**Ask your agent:** "Write every change to an existing table as a SQL migration with a lock timeout at the top. Plan any rename, type change, or drop as add, copy, switch, drop, one PR per step, and fill big tables in small batches."

## Go deeper

- [strong_migrations: dangerous operations and safer ways to do them](https://github.com/ankane/strong_migrations#checks)
- [PostgreSQL: ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
