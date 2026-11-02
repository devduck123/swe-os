---
title: Timeouts, retries, and idempotency
description: A network call can answer, fail, or never answer. Most bugs here come from treating "never answered" as "failed".
stage: design
track: 7
concerns: [reliability, concurrency, api-contracts]
freshness: durable
status: draft
---

Every call that leaves your code needs three things decided ahead of time: how long you'll wait, whether you'll try again, and what happens if the same thing runs twice. They only work as a set. A retry without the third is how someone gets charged twice.

## Easy to miss

- **A timeout doesn't mean it failed.** The request may have landed and only the answer got lost. Plan for "maybe it happened".
- **Most clients wait forever by default.** If you didn't choose a timeout, you don't have one.
- **A person waiting isn't a retry loop.** If someone's watching a spinner, try once and tell them honestly. Retries belong in background work.
- **Only retry what's temporary.** A timeout or a 503 might work next time. A 400 never will.
- **Retries multiply.** Three retries of a ten-second call is a forty-second request, and a thousand clients retrying in sync is an outage you caused.
- **The key has to be the same every time.** An idempotency key made fresh on each attempt protects nothing. Tie it to the thing that should happen once, like the order.
- **A disabled button is UX, not a guard.** Two tabs or a double click still send it twice. The server has to be the referee.

**How I do it:** a timeout on every outside call from day one, one attempt when someone's waiting, and idempotency keys on anything that charges money or sends a message.

## Go deeper

- [Amazon Builders' Library: timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)
- [Stripe: idempotent requests](https://docs.stripe.com/api/idempotent_requests)
