---
title: Deployment
description: Getting a change from your machine to users, and back out again if it's wrong.
---

**Triggered by:** changes to build, config, packaging, or release; schema changes; destructive data changes.

## Minimum bar

- The build is reproducible: a lockfile, a pinned runtime, one command.
- Config and secrets come from the environment and are documented. They're never committed.
- Know how you'd roll back, and what a rollback can't undo (data, sent emails, external calls).

## When stakes rise

- Smoke test the built artifact, not just the dev server.
- Release in a way you can stop: a feature flag, a staged rollout, or a quick revert.
- Write down the stop condition before you start: "if error rate passes X, roll back".
- Rehearse risky rollouts, especially ones that involve data changes.

## Common misses

- Works on my machine, because of a global tool or an untracked `.env`.
- A migration and a code change that must deploy together but can't.
- Production deployed by hand from a laptop with no record of what shipped.

## Learn more

- [Prefer reversible decisions](../principles.md#prefer-reversible-decisions)
- [Local first, then managed services](../guides/local-first-then-managed.md)
- [Secrets and safety when agents write your code](../guides/secrets-and-agent-safety.md)
- [Shipping changes you can undo](../guides/shipping-changes-you-can-undo.md)
- [Database changes without downtime](../guides/database-changes-without-downtime.md)
- [The side-project stack](../recipes/side-project-stack.md)
