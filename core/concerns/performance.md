---
title: Performance
description: Is it fast enough for the people using it, with real data, and do you have the numbers to prove it?
---

**Triggered by:** a stated latency, size, or throughput budget; uploads; UI on slow devices or networks.

## Minimum bar

- Bound the work: limit payload sizes, page lists, and cap loops over user data.
- Avoid the obvious traps: N+1 queries, loading a whole table to show ten rows, shipping huge images.
- Measure before you optimize. Guessing at bottlenecks is usually wrong.

## When stakes rise

- Set a budget ("search responds in under 300ms at p95") and measure against it with realistic data.
- Check the query plan for slow queries before adding a cache.
- Test under expected load and see what breaks first.
- Add caching or capacity only for a bottleneck you measured.

## Common misses

- Fine with 10 rows in dev, unusable with 100,000 in production.
- A cache added before anyone measured, now a source of stale-data bugs.
- A 4MB hero image on a mobile landing page.

## Learn more

- [Scale from evidence](../principles.md#scale-from-evidence)
- [How a request travels through your app](../guides/how-a-request-travels.md)
- [Simple first: when complexity earns its place](../guides/simple-first.md)
- [Data that stays correct](../guides/data-that-stays-correct.md)
- [What a complete frontend feature includes](../guides/complete-frontend-features.md)
- [Performance and cost: scale from evidence](../guides/performance-and-cost.md)
