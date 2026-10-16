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

## Error tracking first

Sentry catches errors your code didn't handle, on the server and in the browser, groups duplicates, and shows the stack trace and how many users it hit. Its free Developer plan covers one user and 5,000 errors.

Two settings decide whether it's useful:

- **Source maps.** Your production JavaScript is minified, squeezed onto one line with short names, so a raw stack trace points at `a.js:1:48213`. A source map translates that back to your file and line. Sentry's Next.js setup uploads them at build time and keeps them out of the browser. It needs `SENTRY_AUTH_TOKEN` in Vercel's environment variables.
- **Releases.** Tag every event with the commit it came from. Vercel exposes it as `VERCEL_GIT_COMMIT_SHA`. Then Sentry can say "this started in the 14:00 deploy", which is half the debugging.

Tag the environment too, so preview noise doesn't bury production issues.

## Logs you can search: structured, with an ID, without secrets

`console.log(e)` gives you a line you can't search that doesn't say enough. Log JSON instead. In this webhook route, notice the fixed event name, the request ID made at the top, and that every other field is an ID:

```ts
// lib/log.ts
export function log(level: 'info' | 'error', event: string, fields = {}) {
  const time = new Date().toISOString();
  console[level](JSON.stringify({ level, event, time, ...fields }));
}

// app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const event = await verifyStripeEvent(req);
  try {
    await markInvoicePaid(event);
  } catch (err) {
    log('error', 'invoice.mark_paid_failed', {
      requestId,
      stripeEventId: event.id,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err; // still fail, so Stripe retries and Sentry sees it
  }
  return new Response('ok');
}
```

The **request ID** connects a user's complaint to a log line. Put it on every log line and as a Sentry tag, and show it on your error screen: "Something went wrong. Reference: 3f9c…". The user sends you that, and you search for it.

Log IDs, not contents. Request bodies and user objects hold passwords, tokens, and emails, and logs get copied to more places than your database. See [secrets and safety](secrets-and-agent-safety.md).

Vercel keeps runtime logs for 1 hour on Hobby and 1 day on Pro, so treat them as a live view. Anything you'll need next week belongs in Sentry, which keeps 30 days on the free plan, or in the database.

## Prove it's up, and that the important things still happen

A **health check** is a route that returns `200` when the app can serve requests. Notice that it never touches the database:

```ts
// app/api/health/route.ts
export function GET() {
  return Response.json({
    ok: true,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });
}
```

An **uptime monitor** calls it from outside every few minutes and alerts you when it stops answering. Sentry's free plan includes one. On Neon, a database query that often keeps the database from sleeping, and the free compute hours run out mid-month ([cliffs](../recipes/side-project-stack.md#what-it-costs)). A broken database shows up in Sentry anyway.

Uptime says the server answers, not that signups work. For that, track a few **outcomes**, the events that mean the product is doing its job:

- signups per day
- payments received vs. marked paid
- background job runs that failed or never ran

These are SQL queries over tables you already have, sent to you in a daily email. Vercel Hobby cron runs at most once a day, which is all a daily summary needs.

Sentry's free plan also includes one cron monitor: your job pings Sentry each run, and Sentry alerts you when a run fails or the ping never comes. Spend it on the job that matters most ([background jobs](background-jobs-and-webhooks.md)), and cover the rest in the daily summary.

## Alert only when a human has to act

Every alert should mean "stop and do something". Alerts that cry wolf train you to ignore all of them, including the real one.

Good alerts for a side project:

- The uptime check failed twice in a row.
- A new issue appeared in Sentry, especially in payments or auth.
- The monitored cron job missed its ping.
- An outcome count went to zero, like no signups in 24 hours when you usually get some.

Bad alerts: every error event, CPU usage, one slow request. Look at those weekly. Then break each alerted thing once on purpose to see the alert fire.

## What the vibe-coded version misses

- **`console.log(e)` in a catch.** No IDs to search for, and on Hobby it's gone in an hour.
- **No source maps or releases.** Every stack trace points at minified code from an unknown deploy.
- **A health check that queries the database.** On Neon Free, compute runs out mid-month and the database goes down for real.
- **An alert for every error.** By week two they're filtered to a folder, outage alert included.
- **Nothing watching background jobs.** The nightly sync fails for a week and nothing tells you.

## What I'd do

Before the first real user:

- Run `npx @sentry/wizard@latest -i nextjs`, add `SENTRY_AUTH_TOKEN` in Vercel, then ask your agent: "Set Sentry's release to `VERCEL_GIT_COMMIT_SHA` and its environment to `VERCEL_ENV`."
- Ask your agent: "Add a JSON `log()` helper, make a request ID at the top of every route handler and server action, log it with every error, tag it in Sentry, and show it on the error page."
- Add the `/api/health` route above, and point Sentry's uptime monitor at it.
- Put Sentry's one cron monitor on the most important job.
- Ask your agent: "Add a Vercel cron route that runs once a day, counts yesterday's signups, payments received vs. marked paid, and failed jobs, and emails me the numbers."

No dashboards, log platform, or tracing yet. I'd add a log drain (Vercel Pro forwarding every log line to a log service) once I keep needing logs older than a day, and tracing (a timeline of one request) once I can't tell which call in a slow request is slow.

## Sources

- [Vercel: Runtime logs (limits and retention)](https://vercel.com/docs/logs/runtime)
- [Vercel: Hobby plan (drains)](https://vercel.com/docs/plans/hobby)
- [Vercel: Cron jobs usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel: System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Sentry pricing (Developer plan)](https://sentry.io/pricing/)
- [Sentry: Next.js setup (wizard)](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry: Source maps for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)
- [Sentry: Releases for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/releases/)
- [Sentry: Cron monitoring](https://docs.sentry.io/product/crons/)
- [Neon pricing](https://neon.com/pricing)
