---
title: Background jobs and webhooks
description: 'Work that happens outside the request: deferred work, cron, hosted job services, and incoming webhooks, and how to keep them from running twice or never.'
domain: backend
stage: build
freshness: durable
status: reviewed
reviewed: 2026-10-06
track: 13
concerns: [concurrency, reliability, observability]
---

A background job is work you promise to do later, outside the request that asked for it. The request answers fast, and something else does the work, retries it, and tells you when it gives up. A webhook is someone else's background job calling you, like Stripe hitting your URL when a payment succeeds. Both can show up late, twice, or never. So design for **at least once**: assume anything can run twice, make the repeat harmless, and give every failure somewhere to land.

## The import that died at row 3,100

Users import a CSV of 5,000 contacts, and each one gets enriched by a third-party API, all inside the upload request. The function hits its time limit and gets killed at row 3,100. You don't know which rows finished, and the user clicks Upload again.

Work leaves the request when it's **slow** like this, needs **retries** (the enrichment API is flaky), runs on a **schedule** (a nightly digest), or arrives in **bursts** your database or API quota can't take at once. If the work is fast and the user needs the result, keep it in the request. A queue (a list of work waiting to be done) adds a second place to fail, and a way to fail quietly.

## Pick the smallest tool that survives what you need

**`after()` in Next.js** runs a callback once the response is sent. Use it for analytics, logging, and best-effort cleanup. If the callback throws or hits the time limit, the work is gone, with no record and no retry.

**Vercel Cron** calls one of your routes on a schedule. It suits a sweep (a scheduled run that picks up work still pending), but it's weaker than it looks. On Hobby it runs **at most once a day**, anywhere within the hour you picked. Vercel also says a failed run isn't retried, a run can be delivered twice, and a slow run can overlap the next. Protect the route with `CRON_SECRET`, since it's a public URL. On Supabase, Supabase Cron can call the same route more often, from inside your database.

**A hosted job service** like Inngest, Trigger.dev, or Vercel Workflows stores the job, retries it with backoff (a longer wait before each try), runs steps that outlast one function, and shows you what failed. Use it for imports, emails, and multi-step work.

<details>
<summary>Going deeper: per-minute cron and database cost</summary>

Vercel Pro allows cron once a minute. On Neon, polling every minute keeps the database from ever scaling to zero (it suspends after 5 idle minutes), so you pay for compute around the clock. Postgres queue libraries like pg-boss need a long-running worker process, which Vercel Functions don't give you.

</details>

## Every job will eventually run twice

A job finishes its work, then crashes before recording success. That looks the same as a crash before doing anything, so the job runs again. Make every job idempotent: running it twice leaves the world the same as running it once ([the patterns](timeouts-retries-idempotency.md)).

For the import, give each contact a status. Notice the `AND status = 'pending'`: it makes the write land once, even if the API call repeats.

```sql
UPDATE contacts SET status = 'done', company = $2
WHERE id = $1 AND status = 'pending';
-- 0 rows updated means a previous run already handled it.
```

Keep jobs small, too. With one job per 100 rows, a killed function loses one batch, not progress you can't locate.

## Webhooks: verify, record, acknowledge, then work

A webhook endpoint is a public URL that changes your data. In this Stripe handler, notice the order: check the signature, save the event, then answer `200`.

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

**Verify the signature first.** The sender signs the raw body, the exact bytes it sent. Parse and re-serialize the JSON and the signature no longer matches.

**Dedupe by event ID.** Stripe can send the same event more than once, and retries for up to three days in live mode. `webhook_events.id` is the primary key (the column Postgres keeps unique), so every repeat is a no-op.

**Store before you acknowledge.** If you return `200`, then process in `after()` and crash, the sender never retries and the event is lost. Writing the row first makes your `200` a promise you can keep. If processing is a couple of quick writes, doing it inline before the `200` is fine too.

**Don't trust the order.** `invoice.paid` can land before `invoice.created`. Treat the event as a signal: fetch the current object from Stripe and set your state from that.

To test locally, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. It forwards test events to your machine and prints the signing secret.

## Keep every job in a table you can query

Your own jobs need a record too. In this minimal `jobs` table, each column answers a question you'll ask when something breaks:

```sql
CREATE TABLE jobs (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind       text NOT NULL,                    -- what to do: 'enrich_contacts'
  payload    jsonb NOT NULL,                   -- what to do it to: {"importId": 42, "fromRow": 0}
  status     text NOT NULL DEFAULT 'pending',  -- pending, done, or failed
  attempts   int NOT NULL DEFAULT 0,           -- how many times it has run
  last_error text,                             -- why the last run failed
  created_at timestamptz NOT NULL DEFAULT now()
);
```

The request inserts a row, then processes it right away, inline or in `after()`. On success, set `status` to `done`. On an error, add one to `attempts` and save `last_error`. After five attempts, set `status` to `failed` and report it to Sentry, where a person will see it.

The cron sweep is the safety net. It picks up anything pending for more than a few minutes and processes it the same way:

```sql
SELECT id, kind, payload FROM jobs
WHERE status = 'pending' AND created_at < now() - interval '5 minutes'
ORDER BY created_at
LIMIT 50;
```

Keep one query that shows how many jobs are pending and how old the oldest is. A growing backlog is the earliest sign processing stopped. More in [knowing it broke](knowing-it-broke.md).

## Stop a sweep from overlapping itself

If a sweep runs long, the next one can start before it ends, and both grab the same rows. A lease fixes it: one row that says the sweep is taken, and until when. In the `UPDATE`, notice `locked_until < now()`: only one run can claim an expired lease.

```sql
-- Once:
CREATE TABLE job_locks (name text PRIMARY KEY, locked_until timestamptz NOT NULL);
INSERT INTO job_locks VALUES ('sweep', now());

-- At the start of every run:
UPDATE job_locks SET locked_until = now() + interval '10 minutes'
WHERE name = 'sweep' AND locked_until < now()
RETURNING name;
-- No row back means another run holds the lease. Exit.
```

Set `locked_until = now()` when the run finishes. If a run crashes, the lease expires on its own.

<details>
<summary>Going deeper: why not an advisory lock</summary>

Postgres session advisory locks are the textbook tool here, but they don't survive a transaction-mode connection pooler. Neon's pooler doesn't support them, and Supabase's transaction pooler drops session-level advisory locks between transactions. A lease row works through any pooler.

</details>

## What the vibe-coded version misses

- **Slow work inside the request.** The import dies at the time limit, and the retry pays to enrich 3,100 contacts twice.
- **Unsigned webhook endpoints.** Anyone can post a fake `checkout.session.completed` and get the paid plan free.
- **No dedupe on event ID.** A retried delivery sends two welcome emails and grants credits twice.
- **Acknowledging before storing.** The handler returns `200`, crashes, and the event is gone for good.
- **Events applied in arrival order.** A late update overwrites a newer cancellation, and you keep serving someone who stopped paying.

## What I'd do

For a Next.js app on Vercel with Neon or Supabase:

- For slow work, ask your agent: "Move the slow part of this route into a `jobs` table with status, attempts, and last_error. Insert the row in the request and process it in `after()`."
- Ask your agent: "Add a daily Vercel Cron route that sweeps pending jobs, protected by `CRON_SECRET`, with a lease row so runs can't overlap."

I'd move to a hosted job service once I need retries with backoff, steps that wait on each other, or runs longer than a function's time limit. Past that, I'd be rebuilding one badly in a table.

## Sources

- [Next.js: `after`](https://nextjs.org/docs/app/api-reference/functions/after)
- [Vercel: Cron jobs usage and pricing (Hobby limits)](https://vercel.com/docs/cron-jobs/usage-and-pricing) and [Managing cron jobs (retries, duplicate delivery, concurrency)](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel Functions limits (max duration)](https://vercel.com/docs/functions/limitations) and [Vercel Workflows](https://vercel.com/docs/workflows)
- [Neon: Scale to zero](https://neon.com/docs/introduction/scale-to-zero) and [Connection pooling (unsupported session features)](https://neon.com/docs/connect/connection-pooling)
- [Supabase: Cron](https://supabase.com/docs/guides/cron) and [Connecting to Postgres (transaction mode limits)](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Stripe: Receive events in your webhook endpoint (duplicates, ordering, `stripe listen`)](https://docs.stripe.com/webhooks)
