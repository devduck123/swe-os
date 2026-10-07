---
title: Background jobs and webhooks
description: 'Work that happens outside the request: deferred work, cron, hosted job services, and incoming webhooks, and how to keep them from running twice or never.'
domain: backend
stage: build
freshness: durable
status: draft
reviewed: 2026-10-06
track: 13
concerns: [concurrency, reliability, observability]
---

A background job is work you promise to do later, outside the request that asked for it. The request answers fast, and something else does the work, retries it, and tells you when it gives up. A webhook is someone else's background job calling you. Both can show up late, twice, or never, so design for **at least once**: every job has to be safe to run again, and every failure needs somewhere to land.

## The import that died at row 3,100

Users import a CSV of 5,000 contacts, and each one gets enriched by a third-party API, all inside the upload request. The function hits its max duration and gets killed at row 3,100. You don't know which rows finished, and the user clicks Upload again.

Work leaves the request when it's **slow** like this, when it should be **retried** on its own (the enrichment API is flaky), when it's **scheduled** (a nightly digest), or when it comes in **bursts** your database or API quota can't take at once. If the work is fast and the user needs the result, keep it in the request. A queue adds a second place to fail, and a way to fail quietly.

## Pick the smallest tool that survives what you need

| Option                                               | Retries | Survives a crash    | Good for                                |
| ---------------------------------------------------- | ------- | ------------------- | --------------------------------------- |
| `after()` in Next.js                                 | No      | No                  | Analytics, logging, best-effort cleanup |
| Vercel Cron                                          | No      | Next run catches up | Daily digests, sweeping stragglers      |
| Hosted job service (Inngest, Trigger.dev, Workflows) | Yes     | Yes                 | Imports, emails, multi-step work        |

**`after()`** runs a callback once the response is sent. On Vercel it keeps the function alive with `waitUntil`, but only up to the route's max duration. If the callback throws or the instance dies, the work is gone, with no record and no retry.

**Cron** is weaker than it looks on this stack. On Hobby, a cron job runs **at most once a day**, anywhere within the hour you picked. Anything more frequent fails to deploy. Pro allows once a minute, but polling every minute keeps Neon from ever scaling to zero (it suspends after 5 idle minutes), so it burns compute hours around the clock. Vercel also says a failed run isn't retried, a run can be delivered twice, and a slow run can overlap the next. Protect the route with `CRON_SECRET`, because it's a public URL.

**A hosted job service** like Inngest, Trigger.dev, or Vercel Workflows stores the job, retries it with backoff (a longer wait before each try), runs steps that outlast one function, and shows you what failed. Postgres queues like pg-boss need a long-running worker, which serverless doesn't have. Message brokers like Kafka are a different scale of problem ([simple first](simple-first.md)).

## Every job will eventually run twice

A worker finishes the job, then crashes before reporting success. From outside, that looks the same as a crash before doing anything, so the job runs again. Make every job idempotent: running it twice leaves the world the same as running it once. [Timeouts, retries, and idempotency](timeouts-retries-idempotency.md) covers the patterns. For the import, each row gets a status, and the write lands once even if the API call repeats:

```sql
UPDATE contacts SET status = 'done', company = $2
WHERE id = $1 AND status = 'pending';
-- 0 rows updated means a previous run already handled it.
```

Keep jobs small, too. One job per 100 rows beats one for 5,000, because a killed function loses one batch instead of progress you can't locate.

## Webhooks: verify, record, acknowledge, then work

A webhook endpoint is a public URL that changes your data, like marking a subscription paid. This order holds up:

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

**Verify the signature first.** The sender signs the raw bytes. Parse and re-serialize the JSON and the signature no longer matches.

**Dedupe by event ID.** Stripe can send the same event more than once, and retries for up to three days in live mode. The primary key on `webhook_events.id` makes every repeat a no-op.

**Store before you acknowledge.** If you return `200`, then process in `after()` and crash, the sender never retries and the event is lost. Writing the row first makes your `200` a promise you can keep. If processing is a couple of quick writes, doing it inline before the `200` is fine too, and the sender's retries become yours.

**Don't trust the order.** `invoice.paid` can land before `invoice.created`. Treat the event as a signal: fetch the current object from Stripe and set your state from that.

To test locally, `stripe listen --forward-to localhost:3000/api/webhooks/stripe` forwards real test events to your machine and prints the signing secret to use.

## Stop a sweep from overlapping itself

If a cron run takes longer than its interval, a second instance can start while the first is still going, and both grab the same pending rows. A lease row in Postgres fixes it. (Not a session advisory lock: Neon's connection pooler doesn't support those.)

```sql
UPDATE job_locks SET locked_until = now() + interval '10 minutes'
WHERE name = 'sweep' AND locked_until < now()
RETURNING name;
-- No row back means another run holds the lease. Exit.
```

Seed the row once and reset `locked_until` when the run finishes. If a run crashes, the lease expires on its own.

## Failed jobs need somewhere to land

Give every job a terminal `failed` state with the last error and attempt count, and report it to Sentry when it lands there. Keep one query that shows how many jobs are pending and how old the oldest is. A growing backlog is the earliest sign processing stopped. More in [knowing it broke](knowing-it-broke.md).

## What the vibe-coded version misses

- **Slow work inside the request.** The import dies at the time limit, and the retry enriches 3,100 contacts twice on your API quota.
- **Unsigned webhook endpoints.** Anyone can post a fake `checkout.session.completed` and get the paid plan for free.
- **No dedupe on event ID.** The sender retried a slow delivery, and the customer got two welcome emails and two credit grants.
- **Events applied in arrival order.** A late `customer.subscription.updated` overwrites a newer cancellation, and you keep serving someone who stopped paying.
- **Acknowledging before storing.** The handler returns `200`, crashes while processing, and the event is gone for good.
- **A per-minute cron poller.** It fails to deploy on Hobby. On Pro it deploys fine and keeps your database awake around the clock.

## What I'd do

For a Next.js app on Vercel with Neon:

- Keep work in the request whenever it's fast and the user needs the result.
- Otherwise, insert the work durably (a `jobs` row, or a `webhook_events` row) in the request, then process it right away, inline or in `after()`. The row is the record. `after()` is just the fast path.
- Run cron only as a daily sweep (hourly on Pro, if stragglers can't wait) that picks up rows still pending, with `CRON_SECRET`, a lease row, and idempotent processing.

I'd move to a hosted job service as soon as I need retries with backoff, steps that wait on each other, or runs that outlast a function's time limit. Past that point, I'd just be rebuilding one badly in a table.

## Sources

- [Next.js: `after`](https://nextjs.org/docs/app/api-reference/functions/after)
- [Vercel: Cron jobs usage and pricing (Hobby limits)](https://vercel.com/docs/cron-jobs/usage-and-pricing) and [Managing cron jobs (retries, duplicate delivery, concurrency)](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel Functions limits (max duration)](https://vercel.com/docs/functions/limitations) and [Vercel Workflows](https://vercel.com/docs/workflows)
- [Neon: Scale to zero](https://neon.com/docs/introduction/scale-to-zero) and [Connection pooling (unsupported session features)](https://neon.com/docs/connect/connection-pooling)
- [Stripe: Receive events in your webhook endpoint (duplicates, ordering, `stripe listen`)](https://docs.stripe.com/webhooks)
