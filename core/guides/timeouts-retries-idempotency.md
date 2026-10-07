---
title: Timeouts, retries, and idempotency
description: Why every network call needs a deadline, which failures deserve another try, and how to make trying again safe.
domain: reliability
stage: design
freshness: durable
status: draft
track: 7
concerns: [reliability, concurrency, api-contracts]
---

When you call something over a network, three things can happen. It answers. It fails. Or it never answers at all.

**Timeouts** handle "never answers". **Retries** handle "failed, but might work next time". **Idempotency** makes retries safe, because doing the thing twice has the same effect as doing it once.

They only work as a set. A retry without a timeout can wait forever. A retry of a write without idempotency can charge someone twice.

## A timeout doesn't mean it failed

Here's the trap that makes this topic matter. You send "charge $20" to a payment API. Your request times out. Did the charge happen?

You don't know. Maybe the request never arrived. Maybe it arrived, the charge went through, and the response got lost on the way back. From your side, those two look identical.

If you retry, you might charge twice. If you don't, you might not charge at all. The way out of this is idempotency, and it's why these three ideas belong in one guide.

## When you need this, and when you don't

You need timeouts on **every call that crosses a network**: third-party APIs, your own other services, your database driver, your cache. Most HTTP clients wait minutes or forever by default. In the browser and in Node, `fetch` has no timeout option at all. You add one with an `AbortSignal`.

You need retries when failures are **temporary and the work is safe to repeat**: a flaky API, a dropped connection, a `503` during a deploy.

You need idempotency when a **write might happen twice**: your retries, a user double-clicking Submit, a job that crashes halfway and restarts, or a webhook the sender re-delivers. Payment providers and most webhook senders deliver at least once, so duplicates aren't an edge case. They're in the contract.

You can skip retries when a person is waiting and can just click again, or when the failure is permanent. A `404` will still be a `404` in 200 milliseconds.

## Pick timeouts from a budget, not a vibe

A timeout is a ceiling on how long you'll wait before you give up and do something else.

Start from the caller's patience, not the dependency's speed. If your page should load in 3 seconds, every call inside it shares that 3 seconds. That total is the **deadline**. Each attempt gets a slice of what's left.

The math catches people. Three attempts with a 10-second timeout each is a 30-second request, plus the waits in between. If your own caller gives up after 5 seconds, everything after second 5 is wasted work.

A reasonable starting point: set each attempt's timeout a bit above the dependency's normal slow response (its p99 latency, if you can measure it). Keep the total under your caller's deadline.

When a timeout fires, **cancel the work**. Abort the request so the connection is freed. Otherwise the call keeps holding resources after you've stopped waiting for it.

## Retry only what is temporary and safe

Retry these: network errors, timeouts, `429 Too Many Requests`, `502`, `503`, and `504`.

Don't retry these: `400`, `401`, `403`, `404`, `422`. They mean "you asked wrong", and asking the same way again won't help. A `500` is a judgment call. Retry it only if the operation is idempotent.

Then follow three rules:

1. **Cap the attempts.** Three total is a common default. Infinite retries turn the other service's outage into yours.
2. **Back off, with jitter.** Wait longer after each failure, and randomize the wait. Without randomness, every client that failed at the same moment retries at the same moment, and the struggling service gets hit by the same wave again. "Full jitter" waits a random time between zero and an exponentially growing cap.
3. **Respect `Retry-After`.** If the server tells you when to come back, listen, as long as it fits your deadline.

**Retry at one layer only.** If your frontend retries 3 times, your API retries 3 times, and your database client retries 3 times, one user click can turn into 27 database calls during an outage. Pick the layer closest to the failure and let the others fail fast.

## Make writes safe to repeat

An operation is **idempotent** if doing it twice leaves the world the same as doing it once.

Some operations already are. Under HTTP semantics, `GET`, `PUT`, and `DELETE` are defined as idempotent. "Set the user's email to x" is idempotent. "Add $20 to the balance" is not. `POST` usually isn't.

To make a non-idempotent write safe, use one of these:

**An idempotency key.** The client makes a unique ID (a UUID) for each _logical operation_ and sends it with every attempt, usually in an `Idempotency-Key` header. The server stores the key with the result. If the same key comes again, it returns the stored result instead of doing the work twice. Stripe made this pattern popular, and an IETF draft standardizes the header.

The key must be created once per operation and reused across retries. A new key per attempt defeats the purpose.

**A natural unique constraint.** Often the data already has an identity. One order per cart, one reaction per user per post. A unique index makes the second insert fail harmlessly.

**A conditional update.** `UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending'` only works once. The second attempt updates zero rows.

**Dedupe on the receiving side.** Webhook senders include an event ID. Record it in a table with a unique index, in the same transaction as the work it triggers:

```sql
CREATE TABLE processed_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Inside the same transaction as the work:
INSERT INTO processed_events (event_id) VALUES ($1)
ON CONFLICT DO NOTHING;
-- 0 rows inserted means you've already handled this event. Skip it.
```

Insert first and let the unique index decide. If you check "have I seen this?" and then insert, two simultaneous deliveries can both pass the check.

## What goes wrong

- **No timeout.** A slow dependency holds every connection and worker you have. Your service stops answering, though nothing in it is broken.
- **Timeout without cancellation.** You stopped waiting, but the request is still running and holding resources.
- **Retry storms.** Clients retry in sync without jitter and keep a recovering service down.
- **Retry amplification.** Several layers each retry, and the load multiplies.
- **Retried non-idempotent writes.** Duplicate charges, emails, or orders.
- **A new idempotency key per attempt.** It looks safe and isn't.
- **Side effects outside the transaction.** The dedupe row and the database work commit together, but the email you sent can't roll back. Send external side effects after commit, or use an outbox table that a worker drains.

## What I'd do

For a side project calling a flaky third-party API:

- Put an `AbortSignal.timeout` on every `fetch`, inside an overall deadline that matches what the user will tolerate.
- Retry up to 3 total attempts, with full jitter, only for network errors, timeouts, `429`, and `502`–`504`, and only for reads or keyed writes.
- Use the provider's idempotency key support for anything involving money.
- Dedupe incoming webhooks by event ID with a unique index.
- Skip circuit breakers, queues, and retry libraries until I can point at a failure they would fix.

Here's the whole thing for a read, in about 30 lines of plain JavaScript:

```js
const RETRYABLE = new Set([429, 502, 503, 504]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getJson(
  url,
  { deadlineMs = 3000, maxAttempts = 3 } = {},
) {
  const deadline = Date.now() + deadlineMs;
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      // Full jitter: a random wait up to a cap that doubles each attempt.
      await sleep(Math.random() * Math.min(1000, 100 * 2 ** attempt));
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(remaining) });
    } catch (error) {
      lastError = error; // Timeout or network failure. Worth another try.
      continue;
    }
    if (response.ok) return response.json();
    lastError = new Error(`GET ${url} returned ${response.status}`);
    if (!RETRYABLE.has(response.status)) throw lastError; // Permanent. Stop now.
  }
  throw new Error(`GET ${url} failed within ${deadlineMs}ms`, {
    cause: lastError,
  });
}
```

It doesn't read `Retry-After`. Add that when a provider actually sends it.

## What changes at scale

- **Retry budgets.** Instead of a fixed count per request, cap retries as a share of total traffic. Google's SRE book describes a client-side budget of about 10%, so retries can't multiply load during an incident.
- **Deadline propagation.** Pass the remaining deadline downstream (gRPC does this natively), so deep services stop work the caller has already abandoned.
- **Circuit breakers and load shedding.** Stop calling a dependency that's clearly down, and reject excess work early instead of queueing it forever.
- **Idempotency key storage.** Keys need a retention window and their own table or store. Stripe, for example, keeps them for at least 24 hours.
- **Outbox pattern.** Write side effects to a table in the same transaction, then let a worker deliver them at least once to systems that dedupe.

## Sources

- [RFC 9110, section 9.2.2: Idempotent methods](https://www.rfc-editor.org/rfc/rfc9110#section-9.2.2)
- [AWS Architecture Blog: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Stripe API: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [IETF draft: The Idempotency-Key HTTP header field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
- [Google SRE book: Handling overload](https://sre.google/sre-book/handling-overload/)
- [MDN: AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)
