---
title: Knowing it broke before your users do
description: 'Error tracking, structured logs, a health check, and a few outcome counts: the smallest observability setup that tells a solo dev what failed, for whom, and why.'
domain: reliability
stage: operate
freshness: evolving
status: draft
reviewed: 2026-10-06
track: 18
concerns: [observability, reliability]
---

Observability means you can answer three questions from data you already collected: is it broken, for whom, and why. If the only way to answer is to ask a user, or to add a log line and redeploy, you don't have it yet.

For a solo dev, the setup that helps is small: error tracking, structured logs with a request ID, a health check with an uptime monitor, a few outcome counts, and alerts only for things you have to act on.

## Your users are a slow, lossy monitoring system

Say you run a small invoicing app. You rename a field, and the Stripe webhook handler starts throwing for customers whose invoices have a discount. Stripe takes the money. Your database never marks the invoice paid. Nothing looks wrong on any page you visit.

Three days later a customer emails: "Why does it say I owe you $40? I paid." Vercel's logs are empty, because Hobby keeps runtime logs for one hour. You have no stack trace, no count of affected customers, and no idea which deploy started it.

With error tracking, the first failed webhook creates an issue within a minute, with the stack trace and the release that introduced it. A daily count of "paid at Stripe vs. marked paid" shows the gap the next morning. And plenty of users who hit a bug never email you. They just leave.

## When you need this, and when you don't

You need it the moment strangers use the app, or the app does anything you can't see happen: payments, webhooks, scheduled jobs, emails. Those fail silently by default.

For a prototype only you use, the browser console and your dev server output are enough. Sentry's Next.js wizard does most of the setup, so I add it before the first real user, not after the first bug report.

## Logs, metrics, and traces answer different questions

- **Logs** are events: "at 14:02, the webhook for invoice 812 failed with this error". They answer _what happened to this one thing_.
- **Metrics** are numbers over time: errors per minute, signups per day, p95 latency. They answer _is this normal_. They're cheap to keep and great to alert on, but they can't tell you why.
- **Traces** follow one request through every step it takes, with timings: the route handler, three database queries, the call to OpenAI. They answer _where the time went_ or _which hop failed_.

A side project lives on logs and error tracking, plus a few metrics from SQL queries. Traces start to matter when a request crosses several services or slow external calls and you can't tell which part is slow. Sentry's SDK can capture traces too, so that's a config change, not a new tool.

## Error tracking first

Error tracking is the highest-value piece. Sentry captures unhandled exceptions on the server and in the browser, groups duplicates into one issue, and shows the stack trace, the URL, and how many users it hit. Its free Developer plan covers one user and 5,000 errors a month.

Two settings decide whether it's useful:

- **Source maps.** Your production JavaScript is minified, so a raw stack trace points at `a.js:1:48213`. The Sentry Next.js setup uploads source maps at build time and, by default, deletes the client-side ones afterward so the browser never serves them. You need `SENTRY_AUTH_TOKEN` in the build environment for that to work.
- **Releases.** Tag every event with the commit it came from. Vercel exposes the commit as `VERCEL_GIT_COMMIT_SHA`. Then Sentry can say "this started in the 14:00 deploy", which is half the debugging.

Tag the environment too, so preview noise doesn't bury production issues.

## Logs you can search: structured, with an ID, without secrets

A log line is only useful if you can find it and it says enough. `console.log(e)` fails both tests. Log JSON with a stable event name, the IDs involved, and a request ID:

```ts
export function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
) {
  const line = JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    ...fields,
  });
  if (level === 'error') console.error(line);
  else console.log(line);
}

// In the webhook handler:
log('error', 'invoice.mark_paid_failed', {
  requestId,
  invoiceId: invoice.id,
  stripeEventId: event.id,
  error: err instanceof Error ? err.message : String(err),
});
```

The **request ID** connects a user's complaint to a log line. Make one per request with `crypto.randomUUID()`, or reuse an incoming `x-request-id`. Put it on every log line and as a Sentry tag, and show it on your error screen: "Something went wrong. Reference: 3f9c…". When the user sends you that reference, you search for it and see exactly what happened.

Log IDs, not contents. Whole request bodies, headers, and user objects contain passwords, session tokens, and emails, and logs get copied to more places than your database. Log `userId`, not the email. See [secrets and safety](secrets-and-agent-safety.md).

Know how long logs live. Vercel keeps runtime logs for 1 hour on Hobby and 1 day on Pro, and log drains, which ship them elsewhere, are Pro-only. Treat Vercel's logs as a live view. Anything you'll need next week belongs in Sentry or the database.

## Prove it's up, and that the important things still happen

A **health check** is a route that returns `200` when the app can serve requests:

```ts
// app/api/health/route.ts
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
```

An **uptime monitor** calls it from outside every few minutes and tells you when it fails. Sentry's free plan includes one uptime monitor. One catch: if your database scales to zero, like Neon's free tier does, a check that queries it every few minutes keeps it awake all month and burns compute hours. Point the frequent check at a route that doesn't touch the database, or check less often.

Uptime says the server answers. It doesn't say signups work. For that, track a few **outcomes**, the events that mean the product is doing its job:

- signups per day
- payments received vs. marked paid
- background job runs that failed or never ran

On a side project, these are SQL queries over tables you already have, run by a daily cron job that emails you the numbers. For scheduled jobs, use a check-in monitor like Sentry Cron Monitors. It alerts when a job fails and when it never runs, which nothing else will tell you. More in [background jobs and webhooks](background-jobs-and-webhooks.md).

## Alert only when a human has to act

Every alert should mean "stop and do something". If the right response to an alert is to ignore it, delete or tune it. Alerts that cry wolf train you to ignore all of them, including the real one.

Good alerts for a side project:

- The uptime check failed twice in a row.
- A new issue appeared in Sentry, especially in payments or auth.
- A scheduled job missed its check-in.
- An outcome count went to zero, like no signups in 24 hours when you usually get some.

Bad alerts: every error event, CPU usage, one slow request. Look at those weekly instead. Then break each alerted thing once on purpose, so you know the alert fires.

## What the vibe-coded version misses

- **`catch (e) { console.log(e) }`.** No operation name, no record ID, no request ID, and on Hobby it's gone in an hour. You know something failed, not what or for whom.
- **Logging whole request bodies.** The debug line that dumps `req.body` now holds passwords and tokens, copied into your log provider.
- **No error tracking.** Users find the bugs, and most of them leave instead of telling you.
- **No source maps or releases.** Sentry is there, but every stack trace points at minified code and you can't tell which deploy broke it.
- **Alert spam.** An email for every error event. By week two it's filtered to a folder, and the outage alert goes there too.
- **No way to connect a complaint to a log line.** "It didn't work around lunchtime" is all you have to search with.
- **Background jobs failing silently.** The nightly sync has been throwing for a week. No request failed, so nothing told you.

## What I'd do

Before the first real user:

- Sentry via its Next.js wizard, with source maps, the commit SHA as the release, and the environment tag.
- A tiny JSON `log()` helper and a request ID on every server request, shown on the error screen.
- `/api/health` and Sentry's uptime monitor on it, emailing me on failure.
- A Sentry cron check-in on every scheduled job.
- A daily email with three numbers: signups, payments, failed jobs.

That's it. No dashboards, no log platform, no tracing. I'd add a log drain to a log search service once I'm on Vercel Pro and keep needing logs older than a day. I'd turn on tracing once I have a slow request and can't tell which call is slow. I'd add PostHog once I want product analytics, not just errors.

## What changes at scale

- **SLOs and error budgets.** You decide what "working" means as a number, like 99.9% of checkouts succeed, and alert when you're burning through the budget, not on single errors.
- **On-call rotation.** Alerts go to whoever is on call, with a runbook for each one.
- **Sampling.** At high volume you keep a fraction of traces and successful-request logs, and all the errors.
- **OpenTelemetry**, so traces from several services land in one place and you can switch vendors without rewriting instrumentation.

## Sources

- [Vercel: Runtime logs (limits and retention)](https://vercel.com/docs/logs/runtime)
- [Vercel: Hobby plan (drains)](https://vercel.com/docs/plans/hobby)
- [Vercel: System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Sentry pricing](https://sentry.io/pricing/)
- [Sentry: Source maps for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)
- [Sentry: Releases for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/releases/)
- [Sentry: Cron monitoring](https://docs.sentry.io/product/crons/)
- [Neon pricing (scale to zero)](https://neon.com/pricing)
