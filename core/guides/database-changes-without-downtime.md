---
title: Database changes without downtime
description: How to change a schema or rewrite data while the app keeps running, and why rolling back code doesn't roll back data.
domain: data
stage: ship
freshness: durable
status: reviewed
reviewed: 2026-10-06
track: 17
concerns: [migrations, data, deployment]
---

Code is easy to undo: redeploy the old version and it's back in seconds. Data isn't. A migration (a script that changes your database's structure) changes the one thing every version of your app shares, and there's no redeploy button for a dropped column.

The mental model: during every deploy, old code and new code run against the same database at the same time, so every schema change has to work for both. Big changes get split into small ones across several releases, each safe on its own.

## Why a rename takes down a working app

Say you want to rename `users.name` to `users.display_name`. The agent writes one migration, `ALTER TABLE users RENAME COLUMN name TO display_name`, updates every query, and opens a PR. Tests pass. You merge.

The migration runs, and for the next minute the old deployment is still serving traffic. Every request it handles asks for `name`, which no longer exists, so they all fail. So does a cron job that started before the deploy. Then you hit rollback. The old code comes back, still asking for `name`, and now _everything_ fails. The rollback that saves you on a normal deploy made this one worse.

You need the slow way once real users are on the app, for anything that renames, drops, or changes the type of a column. Purely additive changes, like a new nullable column (one that can be empty) or a new table, are already safe for both versions. Just run them.

## Expand, migrate, switch, contract

The safe rename is four separate releases:

1. **Expand.** Add `display_name` as a nullable column. Deploy code that writes to both `name` and `display_name`, and still reads `name`. Old code ignores the new column, so both versions work.
2. **Migrate.** Backfill `display_name` from `name` for existing rows, in batches (below).
3. **Switch.** Deploy code that reads `display_name`. Keep writing both for a release, so rolling back still finds `name` up to date.
4. **Contract.** Once you're sure you won't roll back, stop writing `name`. In a later release, drop it.

That's four deploys instead of one. Every step but the last is reversible, and by the time you drop anything, nothing has read it for days. Type changes, table splits, and data moves follow the same shape: add, copy, switch, drop.

## Know what lock you're taking

A lock is how Postgres keeps changes from colliding: while one statement holds a table's lock, others that need it wait. Most `ALTER TABLE` statements take the strongest lock, which blocks every read and write. For a quick change, that's milliseconds. The trap is the queue. If a slow query is already running, your `ALTER` waits for it, and every query after waits behind your `ALTER`. A one-millisecond change can freeze the table for as long as that slow query runs.

So start risky migrations with a lock timeout, which makes them give up after 5 seconds instead of waiting:

```sql
SET lock_timeout = '5s';
```

If it times out, retry later. A failed migration is better than a frozen app. Here's what common changes cost:

- **Adding a column** that's nullable, or has a fixed default, is instant.
- **Changing a column's type** usually rewrites the whole table while holding the lock. Use add, copy, switch, drop.
- **Adding `NOT NULL` to an existing column** scans the whole table while holding the lock. On a big table, use the safer version in "Going deeper" below.
- **Adding an index** (a lookup structure that makes queries on a column fast) normally blocks writes until it's built. On a busy table, use `CREATE INDEX CONCURRENTLY`, which doesn't. It needs to run on its own (see "Going deeper").

<details>
<summary>Going deeper: NOT NULL on a big table, and index builds that don't block</summary>

Prove the rule with a `CHECK` constraint first, then let `SET NOT NULL` skip its scan:

```sql
ALTER TABLE users ADD CONSTRAINT display_name_not_null
  CHECK (display_name IS NOT NULL) NOT VALID;          -- instant, checks new writes only
ALTER TABLE users VALIDATE CONSTRAINT display_name_not_null; -- scans, but doesn't block writes
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;    -- skips the scan: the CHECK proves it
ALTER TABLE users DROP CONSTRAINT display_name_not_null;
```

Foreign keys can use the same `NOT VALID` then `VALIDATE` trick. Adding a `NOT NULL` column with no default to a table that has rows fails outright, which an empty dev database never shows you.

`CREATE INDEX CONCURRENTLY` can't run inside a transaction (a group of statements that all apply or none do), and Drizzle's migrator wraps your migrations in one. So run it on its own with `psql`, Postgres's command-line client, over your database's direct (unpooled) connection string:

```sh
psql "$DIRECT_DATABASE_URL" -c "CREATE INDEX CONCURRENTLY invoices_team_id_idx ON invoices (team_id);"
```

If a concurrent index build fails, it leaves an `INVALID` index behind. Drop it and try again.

</details>

## Backfill in small batches you can stop

One `UPDATE users SET display_name = name` on a big table is one giant transaction. It locks every row it touches until it finishes, and it can't be paused halfway. Do it in batches. Notice the inner query picks only rows that still need copying:

```sql
UPDATE users SET display_name = name
WHERE id IN (
  SELECT id FROM users
  WHERE display_name IS NULL AND name IS NOT NULL
  LIMIT 1000
);
-- Repeat until it updates 0 rows. Pause briefly between batches.
```

Each batch saves on its own, so locks are short and you can stop any time. The `IS NULL` filter makes it safe to rerun: after a crash, it picks up where it left off. The `name IS NOT NULL` part matters too. Without it, rows with no name stay null after every batch, the loop never hits zero, and your backfill runs forever.

## Review the SQL migration file before it runs

Most tools have a shortcut that skips the file. That's fine locally while you iterate. For production, you want a SQL file in the PR, because that's where you catch the `DROP COLUMN` before it runs, or a column dropped and re-added when you meant to rename it. Edit that SQL when it needs it. It's your migration, not the tool's. ([Where it runs](shipping-changes-you-can-undo.md#run-migrations-in-the-vercel-build).)

**On Drizzle:** the shortcut is `drizzle-kit push`. Use `drizzle-kit generate` to write the file, and `drizzle-kit migrate` to apply it.

**On Supabase:** the shortcut is editing tables in the dashboard, and nobody can review or repeat those edits. Make them on your local stack, then `supabase db diff -f <name>` writes them to a migration file. `supabase db push` applies committed files, so despite the name, it's the reviewable path.

## Rehearse on a branch first

A database branch is a copy you can wreck. Neon branches include the parent's data by default, so you can run and time a migration and backfill against production-shaped data. Supabase branches start empty and need a paid plan. On the free plan, rehearse locally: `supabase db reset` rebuilds your local database from your migrations and `supabase/seed.sql`.

Before any destructive step, [restore a backup into a branch and check it](when-production-breaks.md).

## What I'd do

For a Next.js app on Neon or Supabase:

- **Review the SQL.** On Drizzle, `push` locally, then `generate`, and read the SQL file in the PR. On Supabase, edit tables only locally, run `supabase db diff -f <name>`, and read that file.
- **Split risky changes.** Additive changes go out in one step. For a rename, type change, or drop, ask your agent: "Plan this as expand, migrate, switch, contract, one PR per step."
- **Guard big tables.** `SET lock_timeout = '5s';` first in any migration that touches one, and build indexes `CONCURRENTLY` with the `psql` command in "Going deeper".
- **Script backfills.** Ask your agent: "Write a script that runs this batched `UPDATE` until it updates 0 rows, pausing between batches and logging progress." Rehearse it first.

Once more than one person writes migrations, I'd add a migration linter, a tool that flags locking statements in the PR.

## Before you ship, check

Paste this to your agent before you merge:

- No migration renames, drops, or retypes a column the running code still uses.
- Every schema change is a SQL migration file in this PR.
- Migrations that touch a big table start with `SET lock_timeout`.
- New indexes on busy tables use `CREATE INDEX CONCURRENTLY`.
- Backfills run in small batches that are safe to rerun.
- The migration and backfill ran on a branch or local copy first.

## Sources

- [PostgreSQL: ALTER TABLE (lock levels, `NOT VALID`, `SET NOT NULL`, adding columns with defaults)](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL: CREATE INDEX (building indexes concurrently)](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PostgreSQL: Explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Drizzle: Migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle source: the Postgres migrator wraps all pending migrations in one transaction](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/pg-core/dialect.ts)
- [Neon: Branching](https://neon.com/docs/introduction/branching)
- [PostgreSQL: psql (`-c` runs a single command)](https://www.postgresql.org/docs/current/app-psql.html)
- [Supabase: Branching](https://supabase.com/docs/guides/deployment/branching), [pricing (branching on paid plans)](https://supabase.com/pricing), [database migrations (dashboard edits, `db diff`, `db push`, `db reset`, `seed.sql`)](https://supabase.com/docs/guides/deployment/database-migrations), and [CLI: `supabase db diff`](https://supabase.com/docs/reference/cli/supabase-db-diff)
- [Vercel: Managing cron jobs (running jobs during deploys)](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
