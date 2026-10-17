---
title: Timeouts, retries, and idempotency
description: Why every network call needs a deadline, when to try again and when to let the user, and how to make trying again safe.
domain: reliability
stage: design
freshness: durable
status: reviewed
track: 7
reviewed: 2026-10-06
concerns: [reliability, concurrency, api-contracts]
---

A network call can answer, fail, or never answer. **Timeouts** handle "never answers". **Retries** handle "failed, but might work next time". **Idempotency** makes repeats safe, because doing the thing twice has the same effect as doing it once. They only work as a set: a retry of a write without idempotency can charge someone twice.

## The double click that opens two checkouts

Your **Buy** button calls a server action that creates a Stripe Checkout Session. The network is slow, nothing seems to happen, and the user clicks again. Now there are two sessions for one order, and if they finish both, two charges.

stripe-node already retries a failed request once, with its own idempotency key so the retry can't create a duplicate. But it can't know two clicks are one purchase. You do, so tell Stripe:

```ts
const session = await stripe.checkout.sessions.create(
  {
    mode: 'payment',
    line_items: lineItems,
    client_reference_id: order.id,
    success_url: `${origin}/orders/${order.id}`,
  },
  { idempotencyKey: `checkout-${order.id}` },
);
```

Stripe saves the first result for that key and returns it to every repeat, so the second click gets the same session. Both clicks have to land on the same order, so back the order with a unique constraint (a database rule that rejects a second row with the same value), as [data that stays correct](data-that-stays-correct.md) shows. The parameters have to match too, because Stripe rejects a reused key with different ones. Disabling the button is nice UX, not the guard.

## A timeout doesn't mean it failed

A request times out. Did it happen? Maybe it never arrived, or maybe it worked and the response got lost. From your side, those look identical. That's why the key has to be the same on every attempt. A fresh `crypto.randomUUID()` per call protects nothing.

## The defaults wait far too long

Node's `fetch` waits up to 5 minutes for a response to start. Vercel lets a function run 5 minutes by default, then kills it mid-work. A hung API holds your user on a spinner the whole time.

Set the deadline from the caller's patience, not the dependency's speed. If the page should respond in 3 seconds, every call inside it shares those 3 seconds. When the `signal`'s timer fires, the request is cancelled and stops holding a connection:

```ts
const res = await fetch(url, { signal: AbortSignal.timeout(3_000) });
```

The database needs a deadline too. Postgres's `statement_timeout` (the longest one query may run) is off by default, so a runaway query keeps going long after the user left. Set it once, in your database's SQL editor, on your app's role: the database user in your `DATABASE_URL`. Swap that name in for `app_user`:

```sql
ALTER ROLE app_user SET statement_timeout = '5s';
```

Leave the migration role alone. Migrations may be slow.

On Supabase, it's already set. `supabase-js` calls run as the `anon` role when signed out (3 seconds) and `authenticated` when signed in (8 seconds). Code using the connection string runs as `postgres` and stops at 2 minutes. To change one, run the line on that role and reload the API:

```sql
ALTER ROLE authenticated SET statement_timeout = '5s';
NOTIFY pgrst, 'reload config';
```

## Don't retry when a person is waiting

If a user is watching a spinner, your retry just makes them wait longer for the error. They can click again, and with idempotency, that's safe. So my default is one attempt, a tight timeout, and an error that says what to do.

Retry at one layer only, and know the retries your SDKs already do. The AI SDK retries twice by default, so one failing model call means three waits. For chat, lower `maxRetries`; [AI features in production](ai-features-in-production.md) covers the rest. If the browser, your route, and your client library each make 3 attempts, one click becomes 27 calls during an outage.

## Retry in the background, and only what's temporary

Retries belong where nobody is watching a spinner: cron jobs, queued work, and server-to-server syncs. Retry only failures that might pass on their own: network errors, timeouts, `429` (too many requests), and `502`–`504` (something upstream is down). Don't retry other `4xx` errors, like `404`. They mean "you asked wrong".

This helper stops after 3 attempts and waits a random, growing time between them, so failed clients don't all return at once:

```ts
const RETRYABLE = new Set([429, 502, 503, 504]);

// For reads, and for writes that send an idempotency key.
export async function fetchWithRetry(url: string, init: RequestInit = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok || !RETRYABLE.has(res.status) || attempt === 3) return res;
    } catch (error) {
      if (attempt === 3) throw error; // Timeout or network failure.
    }
    // Random wait: up to 400ms, then up to 800ms.
    await new Promise((r) => setTimeout(r, Math.random() * 200 * 2 ** attempt));
  }
}
```

## Make writes safe to repeat

"Set the email to x" is idempotent. "Add $20 to the balance" isn't. To make a write safe to repeat:

- **An idempotency key,** made once per operation and sent with every attempt, like the Stripe call above.
- **A unique constraint,** when the data already has an identity, like one reaction per user per post. The second insert fails harmlessly.
- **An update that checks first.** It only works once. The second attempt updates zero rows.

```sql
-- One reaction per user per post.
ALTER TABLE reactions ADD CONSTRAINT reactions_one_per_user UNIQUE (user_id, post_id);

-- Marks the order paid once. A repeat finds no pending row.
UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending';
```

Incoming webhooks are the same problem from the other side. [Background jobs and webhooks](background-jobs-and-webhooks.md) shows how to skip an event you've already handled.

## What I'd do

- Ask your agent: "Add `AbortSignal.timeout` to every `fetch` in this repo, sized from how long the user waits."
- Ask your agent: "Remove any retries in code a user waits on, and set `maxRetries: 1` on AI chat calls."
- Pass an `idempotencyKey` built from my own record's ID, like `checkout-${order.id}`, on every Stripe create call.
- Run the `ALTER ROLE` line above once in the SQL editor, for the app's database user (not needed on Supabase).
- Copy the retry helper into `lib/`, and call it only from cron jobs, queued work, and server-to-server calls.

I'd add a retry library only when I can point at a failure it would have prevented.

## Before you ship, check

Paste this to your agent before you merge:

- Every `fetch` and SDK call has a timeout.
- Code a user waits on doesn't retry, and no call retries at more than one layer.
- Every Stripe create call sends an idempotency key built from our record's ID.
- Background retries cover only network errors, timeouts, `429`, and `502`–`504`.
- The app's database role has a `statement_timeout`.
- Every write that might run twice has a key, a unique constraint, or a check in its `WHERE`.

## Sources

- [Stripe API: Idempotent requests](https://docs.stripe.com/api/idempotent_requests), for saved results, parameter checks, and the 24-hour pruning window
- [stripe-node README](https://github.com/stripe/stripe-node#configuration), for the default single retry with idempotency keys
- [AI SDK: `generateText` reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text), for `maxRetries` (default 2) and `abortSignal`
- [undici: Client options](https://github.com/nodejs/undici/blob/main/docs/docs/api/Client.md), for Node `fetch`'s default `headersTimeout`
- [Vercel: Configuring maximum duration](https://vercel.com/docs/functions/configuring-functions/duration)
- [PostgreSQL: `statement_timeout`](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-STATEMENT-TIMEOUT) and [Neon: Connection pooling](https://neon.com/docs/connect/connection-pooling), for role-level settings with a pooled connection
- [Supabase: Timeouts](https://supabase.com/docs/guides/database/postgres/timeouts), for the default role timeouts
- [AWS Architecture Blog: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [MDN: `AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)
