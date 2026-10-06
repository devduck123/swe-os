---
title: Observability
description: When it breaks, can you tell what broke and why, without guessing?
---

**Triggered by:** calls to outside services, background work, deployments, payments.

## Minimum bar

- Errors carry enough context to find the cause: which operation, which record, what input. Leave out secrets and personal data.
- Background jobs log when they start, fail, and finish.
- You can tell whether the feature works in production without asking a user.

## When stakes rise

- Connect a user-facing failure to its logs, with a request ID or similar.
- Track a few outcome signals for critical paths: success rate, latency, queue depth.
- Alert on things a human must act on, and decide who that human is.
- Check that an alert fires when the thing actually breaks.

You don't need a monitoring platform for a side project. Structured logs and a health check go a long way.

## Common misses

- `catch (e) { console.log(e) }` with no context.
- Logging whole request bodies, including passwords and tokens.
- Alerts nobody reads, so the real one gets ignored too.

## Learn more

- [Make it operable](../principles.md#make-it-operable)
