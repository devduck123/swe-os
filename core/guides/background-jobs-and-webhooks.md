---
title: Background jobs and webhooks
description: 'Work that happens outside the request: deferred work, cron, queues, and incoming webhooks, and how to keep them from running twice or never.'
domain: backend
stage: build
freshness: durable
status: draft
reviewed: 2026-10-06
track: 12
concerns: [concurrency, reliability, observability]
---

A background job is work you promise to do later, outside the request that asked for it. The request answers fast. Something else does the work, retries it when it fails, and tells you when it gives up.

Webhooks are the same idea from the other side. They're someone else's background job calling you, and they follow the same rules: they arrive late, they arrive twice, and sometimes they don't arrive at all. Background work runs **at least once**, so it has to be safe to run again.

## Work leaves the request for four reasons

Say your side project lets users import a CSV of 5,000 contacts, and each one gets enriched with a call to a third-party API. Inside the upload request, the user stares at a spinner. The function hits its platform's max duration and gets killed at row 3,100. You don't know which rows finished, and the user clicks Upload again.

That's the first reason: **slow** work. The other three:

- **Retryable.** The enrichment API is flaky. You want to retry a failed row in a minute, not fail the whole import.
- **Scheduled.** A nightly digest email isn't triggered by anyone's request.
- **Bursty.** A spike of incoming work should go through at a rate your database and your API quota can handle.

## Keep it in the request when you can

If the work is fast and the user needs the result to continue, do it inline. Creating a record, updating a setting, and calling a quick API all stay in the request. A queue adds a second place for things to fail, plus a way to fail quietly.

## Pick the smallest tool that survives what you need it to survive

From simplest up:

| Option                                        | Retries | Survives a crash    | Good for                                |
| --------------------------------------------- | ------- | ------------------- | --------------------------------------- |
| `after()` in Next.js                          | No      | No                  | Analytics, logging, best-effort cleanup |
| Cron (Vercel Cron Jobs)                       | No      | Next run catches up | Nightly digests, sweeping a jobs table  |
| Postgres-backed queue or a hosted job service | Yes     | Yes                 | Imports, emails, webhook processing     |
| A full message broker (SQS, RabbitMQ, Kafka)  | Yes     | Yes                 | Many services, high throughput          |

**`after()`** runs a callback once the response is sent. On Vercel it extends the function's life with `waitUntil`, but only up to the route's max duration. If the callback throws or the instance dies, the work is just gone. There's no record and no retry. Use it for things you can afford to lose.

**Cron** calls a route on a schedule. Vercel's docs are honest about the edges. A failed run isn't retried. Delivery is best effort, so a run can be skipped or delivered twice. A run that takes longer than the interval can overlap with the next one. Protect the route with `CRON_SECRET`, because it's a public URL.

**A real queue** stores the job durably, hands it to a worker, and redelivers it if the worker doesn't confirm success. Postgres-backed queues like pg-boss or Graphile Worker keep jobs in the database you already have, but they need a long-running worker process, which serverless functions aren't. Hosted job services like Inngest, Trigger.dev, or Vercel's own Queues (in beta as of this writing) and Workflows take the worker off your hands. They store the job, run it, retry it, and give you a dashboard of what failed.

**A broker** is for several services consuming the same events at serious volume. Not a side-project problem.

## Every job will eventually run twice

At-least-once isn't a vendor quirk. A worker finishes the job, then crashes before it tells the queue. The queue can't tell that apart from a worker that crashed before doing anything, so it delivers again. The only alternative is sometimes losing work.

So make every job idempotent: running it twice leaves the world the same as running it once. [Timeouts, retries, and idempotency](timeouts-retries-idempotency.md) covers the patterns: idempotency keys, unique constraints, conditional updates. For the import, each row gets a status, and the write only lands once even if the API call repeats:

```sql
UPDATE contacts SET status = 'done', company = $2
WHERE id = $1 AND status = 'pending';
-- 0 rows updated means a previous run already handled it.
```

Make the jobs small, too. One job per 100 rows beats one job for 5,000. When a function gets killed at its time limit, you lose one small batch that will be retried, not an hour of progress you can't locate.

## Webhooks: verify, record, acknowledge, then work

A webhook endpoint is a public URL that changes your data, like marking a subscription paid. Anyone who finds the URL can post to it. Here's the order that holds up:

```ts
export async function POST(req: Request) {
  const body = await req.text(); // the raw body; req.json() breaks the signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      req.headers.get('stripe-signature') ?? '',
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  await db
    .insert(webhookEvents)
    .values({
      id: event.id,
      type: event.type,
      payload: event,
      status: 'pending',
    })
    .onConflictDoNothing(); // a retried delivery hits the primary key and does nothing

  return new Response(null, { status: 200 });
}
```

**Verify the signature first.** The sender signs the raw bytes with a shared secret. Parse and re-serialize the JSON and the signature no longer matches.

**Dedupe by event ID.** Stripe's docs warn that the same event can arrive more than once. The primary key on `webhook_events.id` turns the repeat into a no-op.

**Acknowledge fast.** Senders time out and retry if you're slow. Stripe retries for up to three days in live mode. It also doesn't guarantee order, so `invoice.paid` can arrive before `invoice.created`.

**Store before you acknowledge.** If you return `200` and then process the event in `after()`, and that crashes, the sender thinks you're done and never retries. The event is lost. Writing it to a table first makes your `200` a promise you can keep. Then process pending rows right after, or from a cron sweep. If processing is a couple of quick database writes, doing it inline before the `200` is fine too. Then the sender's retries are your retries.

## Stop cron from overlapping itself

Vercel says it outright: if a cron job runs longer than its interval, a second instance can start while the first is still going. Both pick up the same pending rows and send the digest twice.

A lease row in Postgres is the simplest fix that works through a connection pooler:

```sql
UPDATE job_locks SET locked_until = now() + interval '10 minutes'
WHERE name = 'nightly-digest' AND locked_until < now()
RETURNING name;
-- No row back means another run holds the lease. Exit.
```

Seed the row once, and set `locked_until` back to `now()` when the run finishes. If a run crashes, the lease expires on its own, so the lock isn't held forever. When workers pull jobs from a shared table, `SELECT ... FOR UPDATE SKIP LOCKED` lets each one claim different rows without blocking the others.

## Failed jobs need somewhere to land

A job that keeps failing has to end up somewhere a human will see it, or you'll hear about it from a support ticket three days later.

Give every job a terminal `failed` state that keeps the last error and the attempt count. This is the dead-letter idea: stop retrying, keep the evidence. Report the failure to Sentry when it lands there. Keep one query you can run, or one dashboard you can open, to see how many jobs are pending and how old the oldest one is. A growing backlog is the earliest sign your worker stopped. More in [knowing it broke](knowing-it-broke.md).

## What the vibe-coded version misses

- **Slow work inside the request.** The import runs in the upload handler until the function hits its time limit. Half the rows are processed, nothing says which, and the user retries the whole thing.
- **Unsigned webhook endpoints.** Anyone who finds the URL can post a fake `checkout.session.completed` and get the paid plan for free.
- **Double-processing a retried webhook.** Your handler was slow, the sender retried, and the customer got two welcome emails and two credit grants.
- **Cron jobs overlapping themselves.** A slow run collides with the next one, and both send the same digest.
- **Failed jobs vanishing silently.** The job threw, nothing recorded it, and you learn about it from a user.
- **Serverless functions killed mid-job.** A long loop in `after()` or a cron route gets terminated at max duration, with no checkpoint to resume from.
- **Acknowledging before storing.** The handler returns `200`, then crashes while processing. The sender never retries, and the event is gone.

## What I'd do

For a Next.js app on Vercel with Postgres:

- Keep work in the request whenever it's fast and the user needs the result.
- `after()` only for things I can lose: analytics, logging, cache warming.
- Webhooks: verify, insert into `webhook_events` with the event ID as primary key, return `200`. Process inline if it's quick, from the table if it isn't.
- Vercel Cron for scheduled work, with `CRON_SECRET`, a lease row, and idempotent processing that catches up on anything a missed run left behind.
- A `jobs` table drained by cron, with status, attempts, last error, and a `failed` state, before any queue service.

I'd move to a hosted job service once I need retries with backoff on many jobs, steps that wait on each other, or runs that outlast a function's time limit. That's the point where I'd otherwise be rebuilding one badly in a table. I'd reach for a broker only when more than one service needs the same events.

## What changes at scale

- **Throughput and backpressure.** Workers process at a fixed concurrency, and producers slow down or shed load when the backlog grows.
- **Ordering and partitioning.** Events for the same customer go to the same partition so they're processed in order, which plain queues don't promise.
- **The outbox pattern.** Writing "send this event" to a table in the same transaction as the business change, so the database and the queue can't disagree.
- **Durable workflows.** Multi-step processes that sleep, wait for events, and resume after crashes move to a workflow engine instead of chained jobs.

## Sources

- [Next.js: `after`](https://nextjs.org/docs/app/api-reference/functions/after)
- [Vercel: Managing cron jobs (retries, duplicate delivery, concurrency)](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel Functions limits (max duration)](https://vercel.com/docs/functions/limitations)
- [Vercel Queues](https://vercel.com/docs/queues) and [Vercel Workflows](https://vercel.com/docs/workflows)
- [Stripe: Receive events in your webhook endpoint](https://docs.stripe.com/webhooks)
