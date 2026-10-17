---
title: When production breaks anyway
description: Stop the damage first, debug from evidence, tell people, and restore from backups you've actually tested. Then write down what changes so it doesn't happen again.
domain: reliability
stage: operate
freshness: durable
status: reviewed
reviewed: 2026-10-06
track: 19
concerns: [reliability, data, observability]
---

When production breaks, the order is: stop the bleeding, then understand it, then fix it, then make sure it can't happen the same way again. Most bad incidents get worse because someone did these out of order.

The other half is backups. A broken deploy rolls back in a minute. Lost data comes back only if a backup exists, covers the right moment, and you know how to restore it.

## A bad afternoon

You run a project-management app with a few hundred users. You ship "archive selected projects". When nothing is selected, a bug drops the query's filter, so one user clicking Archive with nothing selected archives every project in their workspace. Then a cleanup job that permanently deletes archived projects older than a day has a date-math bug, and deletes all of them.

At 15:10 the first email arrives: "All my projects are gone." The next ten minutes decide whether this is a bad afternoon or the end of the project.

This applies once the app holds other people's data or money. Even for a toy, practice one restore.

## Stop the bleeding first

Your first job is to stop new damage with the fastest move available, even a blunt one:

1. **Roll back** to the last good deploy. On Vercel that's Instant Rollback. Hobby can only go back one deploy: if your fix attempt is broken too, you can't roll back past it. So roll back first, then push the fix. See [shipping changes you can undo](shipping-changes-you-can-undo.md).
2. **Turn the feature off** with its flag, if it has one: a setting your code checks before running it, flipped without a deploy.
3. **Disable it by hand**: hide the button, return `503` ("unavailable") from the route, or stop scheduled jobs with **Disable Cron Jobs** in Vercel's project settings.
4. **Put the app in maintenance mode** (one "back soon" page) if you can't tell what's safe.

In the example, rolling back stops new archive clicks, but the cleanup job is still destroying data. Pause it too. Ask "what is still writing right now?" and stop all of it.

Write down the time of each action as you go, for the restore and the postmortem.

## Debug from evidence, not redeploys

Start from the Sentry issue, the request ID, and the diff between the last good release and the bad one, then reproduce before you fix. Redeploying guesses is a production change made under stress. The [debug skill](../../skills/debug/SKILL.md) is this loop.

## Tell people, even in one sentence

Users can handle "something's broken and I'm on it". Silence they can't. Post a banner in the app, or email the people affected.

> Archiving deleted more projects than it should have, starting around 14:50. I've turned it off and I'm restoring the data now. Next update by 17:00.

Then update on time, and don't guess at causes in public.

## A backup you haven't restored is a hope

- **Point-in-time recovery (PITR)** lets you restore to any moment within a window, like 14:49, one minute before the damage.
- **Daily backups** only restore to when the backup was taken. Anything written since is gone.

The window is the part people skip. As of this writing:

- **Neon** keeps 6 hours of history on Free, up to 7 days on Launch, and up to 30 days on Scale.
- **Supabase Free** has no automatic backups. Its docs tell you to export your own with `supabase db dump`.
- **Supabase Pro** keeps 7 days of daily backups. PITR is an add-on, about $100 a month for 7 days, and needs a bigger database server.

In the example, a deletion you catch within 6 hours comes back on Neon Free. Reported on Monday, it's gone on either free plan. Supabase Pro gets you last night's backup, minus today.

## Restore next to production, not over it

Restoring production in place brings back the deleted rows and throws away every good write since. Supabase also takes the project offline while it restores. Instead, restore a copy _next to_ production and move back only what was lost.

On Neon, the copy is a database branch, not a git branch. Notice `--parent`: the minute before the damage.

```sh
neon branches create --name before-archive-bug --parent 2026-10-06T14:49:00Z
```

On Supabase Pro, open **Database > Backups**, choose **Restore to a New Project**, and pick last night's backup, or a time if you have PITR. It's billed like any project, so delete it after.

On Supabase Free, load your last `db dump` into a new project with `psql` (Postgres's command-line client) and the Session pooler string from **Connect**. Notice it's one transaction:

```sh
# The dump is three files: roles, schema, then data.
# --single-transaction: a failure leaves nothing half-loaded.
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file roles.sql --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres"
# session_replication_role = replica skips triggers while the rows load.
```

Ask your agent: "Write a script that copies the projects with these IDs from the restored copy into production, skipping any that already exist. Show me row counts before running it." Everyone else's work from today stays.

A restore brings back rows, not sent emails or charges. [Shipping changes you can undo](shipping-changes-you-can-undo.md) covers what nothing can undo.

## Practice the restore on a copy

A drill takes twenty minutes:

1. Restore a copy from an hour ago, or your latest backup.
2. Check row counts on your main tables and the newest `created_at`.
3. Write down the steps and how long they took.
4. Delete the copy.

Now you know the backups cover the window you think. Repeat it after changing plans.

## Write a blameless postmortem

Blameless doesn't mean nobody made a mistake. It means asking why the system made it easy, because "be more careful" changes nothing. "The cleanup job can't hard-delete more than 100 rows without a manual flag" does.

Notice that the last two sections carry the fix:

```md
## Summary

One paragraph: what broke, who was affected, for how long.

## Timeline (UTC)

14:50 deploy · 15:10 first report · 15:14 rolled back, cleanup job paused · 16:30 data restored

## What failed

The direct cause.

## Why it was possible

The missing guard, test, or alert that let it through and let it get worse.

## What changes

Each change with a link to its PR or issue.
```

## What I'd do

Before launch:

- Know my three stop buttons: Instant Rollback, a flag on each risky feature, and **Disable Cron Jobs**. Ask your agent: "Put bulk archive and delete behind a flag in a settings table, so I can turn them off without a deploy."
- Soft-delete what users create: mark it deleted instead of removing the row. Ask your agent: "Add a `deleted_at` column to projects, hide deleted rows everywhere, and refuse any delete or archive over 100 rows."
- Do one restore drill.

Once real users' data is in the database, I'd move to Neon Launch or Supabase Pro for a multi-day window. Until then on Supabase Free, I'd copy Supabase's nightly `db dump` workflow, a GitHub Actions file (a script GitHub runs on a schedule), into a private repo. It's the only backup there is.

After anything that hits users, I'd write the postmortem and ship at least one of its changes.

## Before you ship, check

Paste this to your agent before you merge:

- Bulk deletes and cleanup jobs can be turned off without a deploy.
- Deletes set `deleted_at`, and a bulk delete over 100 rows is refused.
- The backup window is longer than it would take someone to notice lost data.
- I've done one restore drill.
- On Supabase Free, a nightly `db dump` runs.

## Sources

- [Neon pricing (restore windows)](https://neon.com/pricing)
- [Neon: Plans (history window)](https://neon.com/docs/introduction/plans)
- [Neon: Instant restore](https://neon.com/docs/introduction/branch-restore)
- [Neon CLI: branches](https://neon.com/docs/cli/branches)
- [Supabase: Database backups (plans, PITR, restore downtime)](https://supabase.com/docs/guides/platform/backups)
- [Supabase: Restore to a new project](https://supabase.com/docs/guides/platform/clone-project)
- [Supabase: Automated backups with GitHub Actions](https://supabase.com/docs/guides/deployment/ci/backups)
- [Supabase: Backup and restore using the CLI (`psql` restore)](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase pricing](https://supabase.com/pricing)
- [Vercel: Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Vercel: Managing cron jobs (disabling)](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
