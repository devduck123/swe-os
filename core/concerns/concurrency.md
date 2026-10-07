---
title: Concurrency
description: What happens when two things touch the same data at the same time, or the same work runs twice.
---

**Triggered by:** multiple writers to the same state, background jobs, payments.
**Floor:** payments always get "when stakes rise".

## Minimum bar

- Name the shared state and who writes to it.
- Avoid read-then-write. Use an atomic update (`UPDATE ... SET count = count + 1`), a unique constraint, or a transaction.
- Assume any job or request can run twice. Make the second run harmless.

## When stakes rise

- Use an idempotency key for side effects like charges, emails, and webhooks.
- Write a test where two updates race, and check the result.
- Decide what happens if the process crashes between two steps.
- Be suspicious of any "exactly once" or "in order" claim. Find out what actually guarantees it.

## Common misses

- Two tabs saving the same form, and the last one silently wins.
- A webhook handler that charges again when the provider retries.
- A cron job that overlaps with its previous run.
- Inventory checked, then decremented, with a gap in between.

## Learn more

- [Timeouts, retries, and idempotency](../guides/timeouts-retries-idempotency.md)
- [Data that stays correct](../guides/data-that-stays-correct.md)
- [Background jobs and webhooks](../guides/background-jobs-and-webhooks.md)
