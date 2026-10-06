---
title: API contracts
description: Is the interface other code depends on explicit, validated, and safe to change?
---

**Triggered by:** exposing an HTTP API, webhook, CLI, event, or file format that other code or people depend on.

## Minimum bar

- Define the request and response shapes in one place, with types or a schema.
- Validate input at the boundary and reject bad input with a clear 4xx and a useful message.
- Use consistent error shapes and status codes. A client should be able to tell "you sent bad data" from "we broke".
- Paginate any list that can grow.

## When stakes rise

- Make writes safe to retry: use an idempotency key or a natural unique constraint.
- Change contracts additively. Add fields; don't rename or remove them while clients still use them. Version when you must break.
- Document the contract where callers will find it, and test it from the caller's side.
- Set limits on payload size and rate.

## Common misses

- Returning a 200 with `{ "error": ... }` in the body.
- An unbounded list endpoint that's fine until it isn't.
- Renaming a field and breaking the mobile app that still uses the old name.
- Trusting IDs in the body without checking the caller owns them.

## Learn more

- [Timeouts, retries, and idempotency](../guides/timeouts-retries-idempotency.md)
- [Validate at the boundaries](../principles.md#validate-at-the-boundaries)
