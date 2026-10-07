---
title: Cost
description: What this will cost to run, where the pricing cliffs are, and what stops a surprise bill.
---

**Triggered by:** usage-billed services, uploads, calls to paid APIs, background work, payments.

## Minimum bar

- List every billed resource the feature uses: storage, bandwidth, API calls, AI tokens, compute.
- Find the free-tier limits and the price after them, from the provider's current pricing page. Don't guess numbers.
- Pick the simplest option that's cheap to operate, not just cheap to start.

## When stakes rise

- Bound usage: size limits, rate limits, retry caps, retention periods.
- Estimate a normal month and a bad one, like a bot hammering your upload endpoint.
- Set a billing alert or hard cap, and decide who gets the alert.
- Write down the usage level where you'd switch provider or architecture.

## Common misses

- Retry loops that multiply API spend during an outage.
- Storing every upload forever because nobody set a retention rule.
- Choosing a service for its free tier without checking the cliff.

## Learn more

- [Local first, then managed services](../guides/local-first-then-managed.md)
- [Simple first: when complexity earns its place](../guides/simple-first.md)
- [AI features](ai-features.md), for capping model spend
- [Performance and cost: scale from evidence](../guides/performance-and-cost.md)
- [The side-project stack](../recipes/side-project-stack.md)
- [AI features in production](../guides/ai-features-in-production.md)
