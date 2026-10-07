---
title: When production breaks anyway
description: Stop the damage first, debug from evidence, tell people, and restore from backups you've actually tested. Then write down what changes so it doesn't happen again.
domain: reliability
stage: operate
freshness: durable
status: draft
reviewed: 2026-10-06
track: 19
concerns: [reliability, data, observability]
---

When production breaks, the order is: stop the bleeding, then understand it, then fix it, then make sure it can't happen the same way again. Most bad incidents get worse because someone did these out of order, like debugging for an hour while the bug kept deleting data.

The other half of this guide is backups. A broken deploy you can roll back in a minute. Lost data you can only get back if a backup exists, covers the right moment, and you know how to restore it. A backup you've never restored is a hope, not a plan.

## A bad afternoon

You run a project-management app with a few hundred users. You ship "archive selected projects". The query builder drops the `WHERE id IN (...)` when the selection is empty, so one user clicking Archive with nothing selected archives every project in their workspace. Then a cleanup job hard-deletes archived projects older than a day, and a bug in your date math makes that "all archived projects".

At 15:10 the first email arrives: "All my projects are gone." What you do in the next ten minutes decides whether this is a bad afternoon or the end of the project.

## Stop the bleeding first

Your first job isn't to understand the bug. It's to stop new damage. Pick the fastest move that does that, even if it's blunt:

1. **Roll back** to the last good deploy. On Vercel that's Instant Rollback, and it takes effect immediately. See [shipping changes you can undo](shipping-changes-you-can-undo.md).
2. **Flip the flag off**, if the feature is behind one.
3. **Disable the feature**: hide the button, return `503` from the route, pause the cron job.
4. **Put the app in maintenance mode** if you can't tell what's safe.

In the example, rolling back the deploy stops new archive clicks, but the cleanup job is the thing destroying data. Pause it too. Ask "what is still writing right now?" and stop all of it.

Write down the time of each action as you go. You'll need it for the restore and the postmortem, and you won't remember it accurately later.

## When this applies, and when it doesn't

All of this applies once the app holds other people's data or money. Then a sloppy incident costs their trust.

For a toy with no users, you can just fix forward. Even there, I'd practice one restore, because the first time you restore a database shouldn't be the time it matters.

## Debug from evidence, not redeploys

Once nothing is getting worse, find the cause. Start from what you already have:

- The **Sentry issue**, with its stack trace and the release that introduced it.
- The **request ID** from the user's error screen, which leads to their exact log lines.
- **Recent deploys**, since "what changed?" answers most incidents. Diff the last good release against the bad one.

Then reproduce it. Run the same input locally, or against a database branch with production-shaped data, until you can make the bug happen on demand. Then fix it, with a test that fails before the fix. The [debug skill](../../skills/debug/SKILL.md) is this loop written down.

The tempting alternative is redeploying guesses: add a `console.log`, push, wait, repeat. Every guess is a production change made under stress. If you can't reproduce it, the first fix is better logging. See [knowing it broke](knowing-it-broke.md).

## Tell people, even in one sentence

Users can handle "something's broken and I'm on it". Silence is what they can't handle. Post a short note where they'll see it: a banner in the app, or an email to the people affected.

> Archiving deleted more projects than it should have, starting around 14:50. I've turned it off and I'm restoring the data now. Next update by 17:00.

Say what's affected, what you've done, and when you'll update. Then update on time, even if it's "still working on it". Don't guess at causes in public.

## A backup you haven't restored is a hope

Managed Postgres providers keep history you can restore from. The details decide whether it helps.

- **Point-in-time recovery (PITR)** lets you restore to any moment within a window, like 14:49, one minute before the damage. It works by replaying the database's write-ahead log, the record of every change, on top of a snapshot.
- **Daily backups** only restore to when the snapshot was taken. Anything written since is gone.

The window is the part people skip. As of this writing, Neon's free plan keeps 6 hours of restore history, its Launch plan up to 7 days, and its Scale plan up to 30 days. Supabase's free plan has no automatic backups, and its docs tell free users to export with `supabase db dump` themselves. Supabase Pro keeps 7 days of daily backups, and PITR is a paid add-on.

Run the example on Neon's free plan. If you notice the deletion within 6 hours, you can get the data back. If a user notices on Monday, it's gone.

Also note how a restore works. Restoring a Neon root branch in place overwrites it. Neon keeps the pre-restore state as a backup branch, but every good write since 14:49 is no longer in the live database. Usually the better move is to restore _next to_ production and copy back only what was lost:

```sh
# A branch of production as it was one minute before the damage.
neon branches create --name before-archive-bug --parent 2026-10-06T14:49:00Z
```

Then connect to that branch, select the deleted projects, and insert them back into production. Everyone else's work from the last hour stays.

## Practice the restore on a branch

Do a restore drill before you need one. It takes twenty minutes:

1. Pick a time an hour ago and create a branch from it.
2. Connect and run a sanity query: row counts on your main tables, the newest `created_at`.
3. Write down the exact commands and how long it took, in your project's runbook or PROJECT.md.
4. Delete the branch.

Now you know the backups exist, cover the window you think, and restore without a docs search mid-incident. Repeat it when you change providers or plans.

## Some damage can't be restored

A database restore brings back rows. It can't bring back:

- **Emails and notifications.** If the bug emailed every user "your account is closed", the only fix is a second email.
- **Charges.** Double charges need refunds, one by one, through your payment provider.
- **Calls to other systems.** Webhooks you sent, files you deleted from storage, records you wrote into someone else's API.

So protect risky operations when you design them. Soft-delete with a `deleted_at` column and hard-delete later. Send bulk emails through a queue you can pause. Show a count before bulk actions ("Archive 214 projects?"). More in [data that stays correct](data-that-stays-correct.md).

## Write a blameless postmortem

Once it's over, write it down while it's fresh. Blameless doesn't mean nobody made a mistake. It means asking why the system made the mistake easy, because "be more careful" changes nothing. "The cleanup job can't hard-delete more than 100 rows without a manual flag" does.

Keep it short:

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

## What the vibe-coded version misses

- **Hotfixing in prod by hand.** Editing rows in the database console or deploying from a laptop mid-incident, with no record of what changed and no way to review it.
- **No rollback path.** Nobody knows where the rollback button is, or that the feature has no flag, so the only option is a rushed fix forward.
- **Debugging before stopping the damage.** An hour of investigation while the cleanup job keeps deleting.
- **Assuming backups exist.** The free plan has 6 hours of history, or no automatic backups at all, and nobody checked.
- **Never restoring one.** The first restore attempt happens during the incident, from docs you're reading for the first time.
- **Restoring over production.** An in-place restore brings back the deleted rows and throws away every good write since.
- **Fixing the symptom and moving on.** The rows come back, the root cause stays, and no postmortem means it happens again in a month.

## What I'd do

For a side project on Neon and Vercel:

- Know my three stop buttons before launch: Vercel Instant Rollback, env-var flags on risky features, and a way to pause each cron job.
- Move to a paid Neon plan with a multi-day restore window as soon as real users' data is in the database. Six hours isn't enough to notice most problems.
- Do one restore drill to a branch at launch and write the steps in the runbook.
- Soft-delete anything users create, and cap bulk deletes.
- Write a five-section postmortem for anything that affected users, and ship at least one of its changes.

I'd add a separate logical backup, like a nightly `pg_dump` to storage outside the provider, once losing the database would end the business or the provider itself is the risk.

## What changes at scale

- **Incident roles.** One person leads and decides, one communicates, others debug. Nobody does all three.
- **Status pages and SLAs**, so communication follows a plan instead of a panic.
- **Restore time as a target.** You measure how long a full restore takes and design to fit it.
- **Regular game days**, where a team breaks things on purpose to practice the response.

## Sources

- [Neon pricing (restore windows)](https://neon.com/pricing)
- [Neon: Instant restore](https://neon.com/docs/introduction/branch-restore)
- [Neon CLI: branches](https://neon.com/docs/cli/branches)
- [Supabase: Database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase pricing](https://supabase.com/pricing)
- [Vercel: Instant Rollback](https://vercel.com/docs/instant-rollback)
