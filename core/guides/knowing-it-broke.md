---
title: Knowing it broke before your users do
description: 'Error tracking, structured logs, a health check, and a few outcome counts: the smallest observability setup that tells a solo dev what failed, for whom, and why.'
domain: reliability
stage: operate
freshness: evolving
status: reviewed
reviewed: 2026-10-06
track: 18
concerns: [observability, reliability]
---

Observability means you can answer three questions from data you already collected: is it broken, for whom, and why. If the only way to answer is to ask a user, or to add a log line and redeploy, you don't have it yet. For a solo dev, the setup is small: error tracking, structured logs, a health check, a few outcome counts, and alerts you have to act on.

## Your users are a slow, lossy monitoring system

Say you run a small invoicing app. You rename a field, and the Stripe webhook handler starts throwing for customers whose invoices have a discount. Stripe takes the money. Your database never marks the invoice paid. Nothing looks wrong on any page you visit.

Three days later a customer emails: "Why does it say I owe you $40? I paid." Vercel's logs are empty, because Hobby keeps runtime logs for one hour. You have no stack trace, no count of affected customers, and no idea which deploy did it.

With error tracking, the first failed webhook creates an issue within a minute, with the stack trace and the release that caused it. And plenty of users who hit a bug never email you. They just leave.

You need this the moment strangers use the app, or it does anything you can't watch happen: payments, webhooks, scheduled jobs, emails. Those fail silently. For a prototype only you use, the browser console is enough.

Logs record what happened to one thing, metrics tell you whether a number is normal, and traces show where one request spent its time. A side project lives on logs and error tracking, and Sentry can turn on traces later with a config change.

## Error tracking first

Sentry captures unhandled exceptions on the server and in the browser, groups duplicates into one issue, and shows the stack trace and how many users it hit. Its free Developer plan covers one user and 5,000 errors a month, and its Next.js wizard does most of the setup.

Two settings decide whether it's useful:

- **Source maps.** Your production JavaScript is minified, so a raw stack trace points at `a.js:1:48213`. Sentry's Next.js setup uploads source maps at build time, then deletes the client-side ones so the browser never serves them. It needs `SENTRY_AUTH_TOKEN` in the build environment.
- **Releases.** Tag every event with the commit it came from. Vercel exposes it as `VERCEL_GIT_COMMIT_SHA`. Then Sentry can say "this started in the 14:00 deploy", which is half the debugging.

Tag the environment too, so preview noise doesn't bury production issues.

## Logs you can search: structured, with an ID, without secrets

`console.log(e)` gives you a line you can't search for, and it doesn't say enough. Log JSON with a stable event name, the IDs involved, and a request ID:

```ts
export function log(
  level: 'info' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
) {
  const time = new Date().toISOString();
  console[level](JSON.stringify({ level, event, time, ...fields }));
}

// In the webhook handler:
log('error', 'invoice.mark_paid_failed', {
  requestId,
  invoiceId: invoice.id,
  stripeEventId: event.id,
  error: err instanceof Error ? err.message : String(err),
});
```

The **request ID** connects a user's complaint to a log line. Make one per request with `crypto.randomUUID()`, or reuse an incoming `x-request-id`. Put it on every log line and as a Sentry tag, and show it on your error screen: "Something went wrong. Reference: 3f9c…". When a user sends you that reference, you search for it and see what happened.

Log IDs, not contents. Request bodies and user objects hold passwords, tokens, and emails, and logs get copied to more places than your database. See [secrets and safety](secrets-and-agent-safety.md).

Vercel keeps runtime logs for 1 hour on Hobby and 1 day on Pro, and log drains are Pro-only. Treat Vercel's logs as a live view. Anything you'll need next week belongs in Sentry, which keeps 30 days on the free plan, or in the database.

## Prove it's up, and that the important things still happen

A **health check** is a route that returns `200` when the app can serve requests. Keep it away from the database:

```ts
// app/api/health/route.ts
export function GET() {
  return Response.json({
    ok: true,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });
}
```

A database check every few minutes keeps Neon awake, and an always-awake database burns through the free 100 CU-hours before the month ends. See the [cliffs](../recipes/side-project-stack.md#what-it-costs). A broken database shows up in Sentry anyway.

An **uptime monitor** calls it from outside every few minutes. Sentry's free plan includes one.

Uptime says the server answers, not that signups work. For that, track a few **outcomes**, the events that mean the product is doing its job:

- signups per day
- payments received vs. marked paid
- background job runs that failed or never ran

These are SQL queries over tables you already have, sent to you in a daily email. Vercel Hobby cron runs at most once a day, which is all a daily summary needs.

Sentry's free plan also includes one cron monitor, which alerts when a job fails or never runs. Spend it on the job that matters most, and cover the rest in the daily summary. More in [background jobs and webhooks](background-jobs-and-webhooks.md).

## Alert only when a human has to act

Every alert should mean "stop and do something". Alerts that cry wolf train you to ignore all of them, including the real one.

Good alerts for a side project:

- The uptime check failed twice in a row.
- A new issue appeared in Sentry, especially in payments or auth.
- The monitored cron job missed its check-in.
- An outcome count went to zero, like no signups in 24 hours when you usually get some.

Bad alerts: every error event, CPU usage, one slow request. Look at those weekly. Then break each alerted thing once on purpose, so you know the alert fires.

## What the vibe-coded version misses

- **`catch (e) { console.log(e) }`.** No record ID, no request ID, and on Hobby it's gone in an hour. You know something failed, not what or for whom.
- **No source maps or releases.** Sentry is there, but every stack trace points at minified code and you can't tell which deploy broke it.
- **A health check that queries the database.** The uptime monitor keeps Neon awake around the clock, and the free compute runs out mid-month. Then the database goes down for real.
- **Alert spam.** An email for every error event. By week two it's filtered to a folder, and the outage alert goes there too.
- **Background jobs failing silently.** The nightly sync has been throwing for a week. No request failed, so nothing told you.

## What I'd do

Before the first real user:

- Sentry via its Next.js wizard, with source maps, the commit SHA as the release, and the environment tag.
- A tiny JSON `log()` helper and a request ID on every server request, shown on the error screen.
- A `/api/health` route that skips the database, with Sentry's uptime monitor on it.
- Sentry's one cron monitor on the most important job.
- A daily email with three numbers: signups, payments, failed jobs.

No dashboards, no log platform, no tracing. I'd add a log drain once I'm on Vercel Pro and keep needing logs older than a day, and tracing once I can't tell which call in a slow request is slow.

## Sources

- [Vercel: Runtime logs (limits and retention)](https://vercel.com/docs/logs/runtime)
- [Vercel: Hobby plan (drains)](https://vercel.com/docs/plans/hobby)
- [Vercel: Cron jobs usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel: System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Sentry pricing (Developer plan)](https://sentry.io/pricing/)
- [Sentry: Source maps for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)
- [Sentry: Releases for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/releases/)
- [Sentry: Cron monitoring](https://docs.sentry.io/product/crons/)
- [Neon pricing](https://neon.com/pricing)
