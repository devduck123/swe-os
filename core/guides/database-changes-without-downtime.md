---
title: Database changes without downtime
description: How to change a schema or rewrite data while the app keeps running, and why rolling back code doesn't roll back data.
domain: data
stage: ship
freshness: durable
status: draft
reviewed: 2026-10-06
track: 17
concerns: [migrations, data, deployment]
---

Code is easy to undo: redeploy the old version and it's back in seconds. Data isn't. A migration changes the one thing every version of your app shares, and there's no redeploy button for a dropped column.

The mental model: during every deploy, old code and new code run against the same database at the same time, so every schema change has to work for both. Big changes get split into small ones across several releases, each safe on its own.

## Why a rename takes down a working app

Say you want to rename `users.name` to `users.display_name`. The agent writes one migration, `ALTER TABLE users RENAME COLUMN name TO display_name`, updates every query, and opens a PR. Tests pass. You merge.

The migration runs, and for the next minute the old deployment is still serving traffic. Every request it handles asks for `name`, which no longer exists, so they all fail. So does a cron job that started before the deploy. Then you hit rollback. The old code comes back, still asking for `name`, and now _everything_ fails. The rollback that saves you on a normal deploy made this one worse.

You need the slow way once real users are on the app, for anything that renames, drops, or changes the type of a column, and for any table big enough that a lock is noticeable. Purely additive changes, like a new nullable column or a new table, are already safe for both versions. Just run them.

## Expand, migrate, switch, contract

The safe rename is four separate releases:

1. **Expand.** Add `display_name` as a nullable column. Deploy code that writes to both `name` and `display_name`, and still reads `name`. Old code ignores the new column, so both versions work.
2. **Migrate.** Backfill `display_name` from `name` for existing rows, in batches (below).
3. **Switch.** Deploy code that reads `display_name`. Keep writing both for a release, so rolling back still finds `name` up to date.
4. **Contract.** Once you're sure you won't roll back, stop writing `name`. In a later release, drop it.

That's four deploys instead of one. Every step but the last is reversible, and by the time you drop anything, nothing has read it for days. Type changes, table splits, and data moves follow the same shape: add, copy, switch, drop.

## Know what lock you're taking

Most `ALTER TABLE` forms take an `ACCESS EXCLUSIVE` lock, which blocks every read and write on the table. For a metadata-only change that's milliseconds. The trap is the queue. If a slow query is already running, your `ALTER` waits for it, and every query that arrives after your `ALTER` waits behind it. A one-millisecond change can freeze the table for as long as that slow query runs. Set a lock timeout so the migration fails fast instead:

```sql
SET lock_timeout = '5s';
```

If it times out, retry later. A failed migration is better than a frozen app.

- **Adding a column** that's nullable, or that has a constant default, only updates metadata. No table rewrite.
- **Adding `NOT NULL` to an existing column** normally scans the whole table under that lock. The safe version proves it with a `CHECK` first:

```sql
ALTER TABLE users ADD CONSTRAINT display_name_not_null
  CHECK (display_name IS NOT NULL) NOT VALID;          -- instant, checks new writes only
ALTER TABLE users VALIDATE CONSTRAINT display_name_not_null; -- scans, but doesn't block writes
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;    -- skips the scan: the CHECK proves it
ALTER TABLE users DROP CONSTRAINT display_name_not_null;
```

Foreign keys can use the same `NOT VALID` then `VALIDATE` trick.

- **Creating an index** normally blocks writes for the whole build. `CREATE INDEX CONCURRENTLY` doesn't, but it **can't run inside a transaction block**, and Drizzle's migrator runs every pending migration inside one transaction. Put a concurrent index in a Drizzle migration and it fails. Run it as its own one-off script over the direct connection instead. If a concurrent build fails, it leaves an `INVALID` index behind. Drop it and try again.
- **Changing a column's type** usually rewrites the whole table under the lock. Use add, copy, switch, drop.

## Backfill in small batches you can stop

One `UPDATE users SET display_name = name` on a big table is one giant transaction. It locks every row it touches until it commits, leaves a dead copy of every row behind (bloat), and can't be paused halfway. Do it in batches:

```sql
UPDATE users SET display_name = name
WHERE id IN (
  SELECT id FROM users
  WHERE display_name IS NULL AND name IS NOT NULL
  LIMIT 1000
);
-- Repeat until it updates 0 rows. Pause briefly between batches.
```

Each batch commits on its own, so locks are short and you can stop any time. The `IS NULL` filter makes it idempotent: rerun it after a crash and it picks up where it left off. The `name IS NOT NULL` part matters too. Without it, rows with no name stay null after every batch, the loop never hits zero, and your backfill runs forever. I run backfills as a script, separate from schema migrations, so I can watch them.

## Drizzle: generate and review, don't push to production

Drizzle Kit gives you two workflows. `drizzle-kit push` compares your TypeScript schema to the database and applies the difference directly. `drizzle-kit generate` writes a SQL migration file that you commit, and `drizzle-kit migrate` applies pending files.

Drizzle's docs mention teams using `push` in production. I wouldn't, once real data is involved: there's no file to review, so nobody sees the `DROP COLUMN` until it has run. With `generate`, the SQL shows up in the PR diff. That's where you catch a column being dropped and re-added when you meant to rename it, or a plain `CREATE INDEX` on a big table. Edit the generated SQL when it needs it. It's your migration, not the tool's.

So: `push` against your local or branch database while you iterate, then `generate` once the schema settles. [Shipping changes you can undo](shipping-changes-you-can-undo.md#run-migrations-in-the-vercel-build) covers where `migrate` runs.

## Rehearse on a branch first

A database branch is a copy you can wreck. Neon branches include the parent's data by default, so you can run and time a migration and backfill against production-shaped data. Supabase branches start empty by default, so seed them if you want to rehearse against something real.

Before any destructive step, [restore a backup into a branch and check it](when-production-breaks.md).

## What the vibe-coded version misses

- **Add, backfill, and drop in a single deploy.** The old code still running during the rollout breaks, and no version you can roll back to works.
- **`drizzle-kit push` against production.** A destructive statement runs before anyone has read it.
- **"Rollback plan: redeploy the old app," after dropping a column.** The old app needs the column. Rolling back breaks every request instead of some of them.
- **A backfill that locks the table.** One huge `UPDATE` holds row locks for minutes, and every user's save waits behind it.
- **Adding a `NOT NULL` column with no default to a table that has rows.** It worked on your empty dev database and fails in production, mid-deploy.
- **A plain `CREATE INDEX` on a busy table.** Writes block for the whole build, which on a big table means checkout stops working.

## What I'd do

For a Next.js app on Neon or Supabase with Drizzle:

- `push` locally while I'm shaping the schema. `generate` plus a reviewed SQL file for anything that reaches production.
- Additive changes go out in one step. Renames, type changes, and drops go through expand, migrate, switch, contract, as separate PRs.
- `SET lock_timeout` at the top of any migration that touches a big table. Concurrent indexes as a separate script.
- Backfills as batched, idempotent scripts, rehearsed on a Neon branch first.

I'd add a migration linter that flags locking operations once more than one person writes migrations, or a table gets too big to eyeball the risk.

## Sources

- [PostgreSQL: ALTER TABLE (lock levels, `NOT VALID`, `SET NOT NULL`, adding columns with defaults)](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL: CREATE INDEX (building indexes concurrently)](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PostgreSQL: Explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Drizzle: Migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle source: the Postgres migrator wraps all pending migrations in one transaction](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/dialect.ts)
- [Neon: Branching](https://neon.com/docs/introduction/branching)
- [Supabase: Branching](https://supabase.com/docs/guides/deployment/branching)
- [Vercel: Managing cron jobs (running jobs during deploys)](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
