---
title: Timeouts, retries, and idempotency
description: Why every network call needs a deadline, when to try again and when to let the user, and how to make trying again safe.
domain: reliability
stage: design
freshness: durable
status: draft
track: 7
reviewed: 2026-10-06
concerns: [reliability, concurrency, api-contracts]
---

A network call can answer, fail, or never answer. **Timeouts** handle "never answers". **Retries** handle "failed, but might work next time". **Idempotency** makes repeats safe, because doing the thing twice has the same effect as doing it once. They only work as a set: a retry of a write without idempotency can charge someone twice.

## The double click that opens two checkouts

Your **Buy** button calls a server action that creates a Stripe Checkout Session. The network is slow, nothing seems to happen, and the user clicks again. Now there are two sessions for one order, and if they finish both, two charges.

stripe-node already protects you from part of this. It retries a failed request once by default and adds an idempotency key so the retry can't create a duplicate. But that only covers one call. It has no way to know two clicks are one purchase. You do, so tell Stripe:

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

Stripe returns the first result for that key to every repeat, so the second click gets the same session. Both clicks have to resolve to the same order, so find or create it with a unique constraint ([data that stays correct](data-that-stays-correct.md)). The parameters have to match too, because Stripe rejects a reused key with different ones. Disabling the button is nice UX, not the guard.

## A timeout doesn't mean it failed

A request times out. Did it happen? Maybe it never arrived, or maybe it worked and the response got lost. From your side, those look identical. That's why the key has to be the same on every attempt. A fresh `crypto.randomUUID()` per call protects nothing.

## The defaults wait far too long

Nothing here waits forever, but the defaults don't help. Node's `fetch` runs on undici, which waits up to 5 minutes for response headers and another 5 minutes between body chunks. Vercel's `maxDuration`, which defaults to 300 seconds with Fluid compute, is the real outer limit. So a hung API holds your user on a spinner for minutes, then Vercel kills the function mid-work.

Set the deadline from the caller's patience, not the dependency's speed. If the page should respond in 3 seconds, every call inside it shares those 3 seconds:

```ts
const res = await fetch(url, { signal: AbortSignal.timeout(3_000) });
```

The abort also cancels the request, so it stops holding a connection after you've given up.

The database needs a deadline too. Postgres's `statement_timeout` is off by default, so one runaway query keeps running and holding a connection long after the user gave up. Set it on the role your app connects as, since session-level `SET` doesn't stick through Neon's pooled connection:

```sql
ALTER ROLE app_user SET statement_timeout = '5s';
```

Leave the role that runs migrations alone. Migrations are allowed to be slow.

## Don't retry when a person is waiting

If a user is watching a spinner, your retry just makes them wait longer for the error. They can click again, and with idempotency, that's safe. So when a person is waiting, my default is no retries of my own: one attempt, a tight timeout, and an error that says what to do.

Know the retries your SDKs already do, so you don't stack yours on top. stripe-node retries once. The AI SDK retries twice by default, so a slow model call that fails can cost three attempts' worth of waiting before the user hears anything. For chat, I'd lower `maxRetries` and pass the request's abort signal through; [AI features in production](ai-features-in-production.md) covers the rest.

Retry at one layer only. If the browser, your route, and your client library each retry 3 times, one click becomes 27 calls during an outage.

## Retry in the background, and only what's temporary

Cron jobs, queued work, and server-to-server syncs have no one waiting, so retries earn their place there. Retry network errors, timeouts, `429`, and `502`–`504`. Don't retry other `4xx` errors: they mean "you asked wrong". Cap the attempts, and randomize the wait so failed clients don't all come back at once:

```ts
const RETRYABLE = new Set([429, 502, 503, 504]);

// For reads and keyed writes only.
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
    // Full jitter: a random wait up to a cap that doubles each attempt.
    await new Promise((r) => setTimeout(r, Math.random() * 200 * 2 ** attempt));
  }
}
```

It ignores `Retry-After`. Add that when a provider actually sends it.

## Make writes safe to repeat

"Set the email to x" is idempotent. "Add $20 to the balance" isn't. To make a write safe to repeat:

- **An idempotency key,** created once per logical operation and sent with every attempt, like the Stripe call above.
- **A unique constraint,** when the data already has an identity: one order per cart, one reaction per user per post. The second insert fails harmlessly.
- **A conditional update.** `UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending'` only works once. The second attempt updates zero rows.

Incoming webhooks are the same problem from the other side: senders deliver at least once, so you dedupe by event ID. [Background jobs and webhooks](background-jobs-and-webhooks.md) has the table and the order of operations.

## What the vibe-coded version misses

- **No deadline on `fetch`.** A third-party API hangs, and every request that touches it sits for minutes until Vercel kills it. The page looks down, though your code is fine.
- **A new idempotency key per attempt.** It looks like protection, so nobody checks it. The double click still opens two Checkout Sessions, and you find out from a refund request.
- **Retries where a user is waiting.** A failing call retried three times with backoff turns a 2-second error into a 20-second spinner, and the user clicks again anyway.
- **Retries stacked on SDK retries.** Your loop wraps a client that already retries, and an outage becomes a flood of calls against a service trying to recover.
- **No `statement_timeout`.** One slow query holds a connection, the next requests queue behind it, and the whole app times out over one bad plan.

## What I'd do

- `AbortSignal.timeout` on every `fetch`, sized from what the user will tolerate.
- No retries of my own in requests a user waits on. I let SDK defaults stand, and lower them for AI chat.
- An `idempotencyKey` derived from my own record's ID on every Stripe create call.
- `statement_timeout` on the app's database role.
- The retry helper only in cron jobs, queued work, and server-to-server calls.

I'd add circuit breakers, retry libraries, or an outbox table only when I can point at a failure they would have prevented.

## Sources

- [Stripe API: Idempotent requests](https://docs.stripe.com/api/idempotent_requests), for saved results, parameter checks, and the 24-hour pruning window
- [stripe-node README](https://github.com/stripe/stripe-node#configuration), for the default single retry with idempotency keys
- [AI SDK: `generateText` reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text), for `maxRetries` (default 2) and `abortSignal`
- [undici: Client options](https://github.com/nodejs/undici/blob/main/docs/docs/api/Client.md), for the default `headersTimeout` and `bodyTimeout`
- [Vercel: Configuring maximum duration](https://vercel.com/docs/functions/configuring-functions/duration)
- [PostgreSQL: `statement_timeout`](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-STATEMENT-TIMEOUT) and [Neon: Connection pooling](https://neon.com/docs/connect/connection-pooling), for role-level settings with a pooled connection
- [AWS Architecture Blog: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [MDN: `AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)
