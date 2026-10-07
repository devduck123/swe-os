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

Code is easy to undo. You redeploy the old version and it's back in seconds. Data isn't. A migration changes the one thing every version of your app shares, and there's no redeploy button for a dropped column.

The mental model: during every deploy, old code and new code run against the same database at the same time. So every schema change has to work for both versions. Big changes get split into small ones spread across several releases, each safe on its own.

## Why a rename takes down a working app

Say you want to rename `users.name` to `users.display_name`. The agent writes one migration, `ALTER TABLE users RENAME COLUMN name TO display_name`, updates every query, and opens a PR. Tests pass. You merge.

The migration runs, and for the next minute the old deployment is still serving traffic. Every request it handles asks for `name`, which no longer exists, so they all fail. A cron job that started before the deploy keeps running the old code until it finishes. Then you notice the errors and hit rollback. The old code comes back, still asking for `name`, and now _everything_ fails. The rollback that saves you on a normal deploy made this one worse.

## When you need the slow way, and when you don't

You need this once real users are on the app, for anything that renames, drops, or changes the type of a column, and for any table big enough that a lock is noticeable.

You can skip it for a local prototype you can reset, a preview branch, or an app with no users yet. Purely additive changes, like a new nullable column or a new table, are already safe for both versions. Just run them.

## Expand, migrate, switch, contract

Here's the rename done safely, as separate releases:

1. **Expand.** Add `display_name` as a nullable column. Deploy code that writes to both `name` and `display_name`, and still reads `name`. Old code ignores the new column, so both versions work.
2. **Migrate.** Backfill `display_name` from `name` for existing rows, in batches (below).
3. **Switch.** Deploy code that reads `display_name`. Keep writing both for a release, so rolling back to the previous version still finds `name` up to date.
4. **Contract.** Once you're sure you won't roll back, stop writing `name`. In a later release, drop it.

It's four deploys instead of one. Every step but the last is reversible, and by the time you drop anything, nothing has read it for days. Changing a column's type, splitting a table, or moving data between tables all follow the same shape: add, copy, switch, drop.

## Know what lock you're taking

Most `ALTER TABLE` forms take an `ACCESS EXCLUSIVE` lock, which blocks every read and write on the table. For a metadata-only change that's milliseconds and nobody notices. The trap is the queue. If a slow query is already running, your `ALTER` waits for it. Every query that arrives after your `ALTER` waits behind it. A one-millisecond change can freeze the table for as long as that slow query runs. Set a lock timeout so the migration fails fast instead of taking the app down:

```sql
SET lock_timeout = '5s';
```

If it times out, retry later. A failed migration is better than a frozen app.

Some operations are cheap and some aren't:

- **Adding a column** that's nullable, or that has a constant default, only updates metadata. No table rewrite.
- **Adding `NOT NULL` to an existing column** normally scans the whole table under that lock. The safe version proves it with a `CHECK` first:

```sql
ALTER TABLE users ADD CONSTRAINT display_name_not_null
  CHECK (display_name IS NOT NULL) NOT VALID;          -- instant, checks new writes only
ALTER TABLE users VALIDATE CONSTRAINT display_name_not_null; -- scans, but doesn't block writes
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;    -- skips the scan: the CHECK proves it
ALTER TABLE users DROP CONSTRAINT display_name_not_null;
```

Postgres's docs spell out both halves of this: `VALIDATE CONSTRAINT` takes a lighter lock that lets writes continue, and `SET NOT NULL` skips the table scan when a valid `CHECK` already proves there are no nulls. Foreign keys can use the same `NOT VALID` then `VALIDATE` trick.

- **Creating an index** normally blocks writes for the whole build. `CREATE INDEX CONCURRENTLY` doesn't, but it takes longer and **can't run inside a transaction block**. Many migration runners wrap each migration in a transaction, so check yours, and run the concurrent build as its own step if it does. If a concurrent build fails, it leaves an `INVALID` index behind. Drop it and try again.
- **Changing a column's type** usually rewrites the whole table under the lock. Use add, copy, switch, drop.

## Backfill in small batches you can stop

One `UPDATE users SET display_name = name` on a big table is one giant transaction. It locks every row it touches until it commits, bloats the table, and can't be paused halfway. Do it in batches instead:

```sql
UPDATE users SET display_name = name
WHERE id IN (
  SELECT id FROM users
  WHERE display_name IS NULL AND name IS NOT NULL
  LIMIT 1000
);
-- Repeat until it updates 0 rows. Pause briefly between batches.
```

Each batch commits on its own, so locks are short and you can stop any time. The `IS NULL` filter makes it idempotent: rerun the script after a crash and it picks up where it left off. The `name IS NOT NULL` part matters too. Without it, rows with no name stay null after every batch, the loop never hits zero, and your backfill runs forever. I run backfills as a script, separate from schema migrations, so I can watch them.

## Drizzle: generate and review, don't push to production

Drizzle Kit gives you two workflows. `drizzle-kit push` compares your TypeScript schema to the database and applies the difference directly. `drizzle-kit generate` writes a SQL migration file that you commit, and `drizzle-kit migrate` applies pending files.

Drizzle's docs mention teams using `push` as their main flow in production. I wouldn't, once real data is involved. With `push` there's no file to review, so nobody sees the `DROP COLUMN` until it has already run. With `generate`, the SQL shows up in the PR diff. That's where you catch a column being dropped and re-added when you meant to rename it, or a plain `CREATE INDEX` on a big table that should be `CONCURRENTLY`. Edit the generated SQL when it needs it. It's your migration, not the tool's.

So: `push` against your local or branch database while you iterate, then `generate` once the schema settles, and `migrate` in CI or at deploy time. Production never gets a migration nobody read. More on wiring that into a pipeline in [shipping changes you can undo](shipping-changes-you-can-undo.md).

## Rehearse on a branch, and restore before you destroy

A database branch is a copy you can wreck. Neon branches are copy-on-write clones that include the parent's data by default, so you can run a migration and a backfill against production-shaped data and time them without touching production. Supabase branches start empty by default. Include data from the dashboard or load a seed file if you want to rehearse against something real.

Before any destructive step, confirm you can get the data back. Not "we have backups." Actually restore one, into a branch or a scratch database, and check the row counts. Find out how far back your provider's restore goes and how long it takes. A backup you've never restored is a hope, and the moment after a bad `DROP` is the worst time to learn it doesn't work.

## What the vibe-coded version misses

- **One migration that adds, backfills, and drops in a single deploy.** The old code still running during the rollout breaks, and there's no version you can roll back to that works.
- **`drizzle-kit push` against production.** The change goes from a laptop straight to the database with no SQL file in review, so a destructive statement runs before anyone has read it.
- **"Rollback plan: redeploy the old app," after dropping a column.** The old app needs the column. Rolling back now breaks every request instead of some of them.
- **A backfill that locks the table.** One huge `UPDATE` holds a lock on every row for minutes, and every user's save waits behind it.
- **Adding a `NOT NULL` column with no default to a table that has rows.** It worked on your empty dev database and fails in production, mid-deploy.
- **A plain `CREATE INDEX` on a busy table.** Writes block for the whole build, which on a big table means checkout stops working.
- **Never having restored a backup.** The first restore attempt happens during the incident, and it's slower or older than anyone assumed.

## What I'd do

For a Next.js app on Neon or Supabase with Drizzle:

- `push` locally while I'm shaping the schema. `generate` plus a reviewed SQL file for anything that reaches production. `migrate` runs in CI before the new code is promoted.
- Additive changes go out in one step. Renames, type changes, and drops go through expand, migrate, switch, contract, as separate PRs.
- `SET lock_timeout` at the top of any migration that touches a big table. `CONCURRENTLY` for indexes on tables with real traffic.
- Backfills as batched, idempotent scripts, rehearsed on a Neon branch first.
- Before any drop: restore last night's backup into a branch and check the counts.

I'd add a migration linter that flags locking operations once more than one person writes migrations or a table gets big enough that I can't eyeball the risk.

## What changes at scale

- **Lock budgets get tight.** Even a metadata change needs a quiet moment on a hot table, so teams retry with short lock timeouts and schedule risky steps for low traffic.
- **Backfills become jobs.** Hours-long backfills run as throttled background jobs with progress tracking. See [background jobs and webhooks](background-jobs-and-webhooks.md).
- **Tooling enforces the rules.** Migration linters and online schema change tools catch unsafe operations before review does.
- **Contract steps wait longer.** With many services or mobile clients on old versions, an old column might need to live for weeks before it's safe to drop.

## Sources

- [PostgreSQL: ALTER TABLE (lock levels, `NOT VALID`, `SET NOT NULL`, adding columns with defaults)](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL: CREATE INDEX (building indexes concurrently)](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PostgreSQL: Explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Drizzle: Migrations](https://orm.drizzle.team/docs/migrations)
- [Neon: Branching](https://neon.com/docs/introduction/branching)
- [Supabase: Branching](https://supabase.com/docs/guides/deployment/branching)
- [Vercel: Managing cron jobs (running jobs during deploys)](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
