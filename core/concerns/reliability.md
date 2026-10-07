---
title: Reliability
description: What happens when the things you depend on are slow, down, or only half-finished.
---

**Triggered by:** calls to services you don't own, background work, stored data, payments.
**Floor:** payments always get "when stakes rise".

## Minimum bar

- Every network call has a timeout you chose. Browser `fetch`, axios, and many other clients have none by default.
- Retry only operations that are safe to repeat, a few times at most, with backoff.
- Show failures to the user honestly. Don't spin forever or pretend it worked.
- Tell transient failures (timeout, 503, 429) apart from permanent ones (400, 404). Don't retry the permanent ones.

## When stakes rise

- Give the whole operation a deadline and split it between attempts. Three retries of a 10-second timeout is a 40-second request.
- Add jitter to backoff so clients don't retry in sync.
- Respect `Retry-After` when a service sends it.
- Test the slow, failing, and recovering cases on purpose.
- Reach for queues, circuit breakers, or fallbacks only when you can name the failure they handle.

## Common misses

- `fetch()` with no timeout inside a request handler.
- Retrying a non-idempotent POST and creating duplicates.
- Infinite retry loops that turn one outage into a self-inflicted one.
- Catching an error and logging it, then carrying on as if it succeeded.

## Learn more

- [Timeouts, retries, and idempotency](../guides/timeouts-retries-idempotency.md)
- [Design for failure](../principles.md#design-for-failure)
- [How a request travels through your app](../guides/how-a-request-travels.md)
- [Simple first: when complexity earns its place](../guides/simple-first.md)
- [AI features in production](../guides/ai-features-in-production.md)
- [Background jobs and webhooks](../guides/background-jobs-and-webhooks.md)
- [Knowing it broke before your users do](../guides/knowing-it-broke.md)
- [When production breaks anyway](../guides/when-production-breaks.md)
