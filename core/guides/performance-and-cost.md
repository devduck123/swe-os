---
title: 'Performance and cost: scale from evidence'
description: Find the one slow or expensive thing with a number, fix that thing, and put a cap on anything strangers can spend.
stage: operate
track: 20
concerns: [performance, cost]
freshness: durable
status: draft
---

Performance work is finding the one slow thing and fixing that thing. Cost work does the same for the bill. Both start with a number, not a hunch. Optimize the wrong thing and you've added complexity to a page that's just as slow.

## Easy to miss

- **The agent's first fix is usually a cache.** Time each step first. A slow page is often an N+1: one query for the list, then one more per row, hidden by the ORM inside a loop. One join fixes it. A cache would make the second visit fast and leave the first one slow.
- **Fine with 10 rows, unusable with 100,000.** Small data hides a missing index, so the database reads every row to find 50, and lists that never stop growing. Ask the database how it runs the slow query, and paginate anything that grows with user data.
- **Every cache is a bet on staleness.** Know how stale the data can be and which writes clear it. Never cache a personalized response somewhere shared, or one user's dashboard gets served to the next.
- **Averages hide the slow visits.** A page that averages 300 ms can still take four seconds for one visit in twenty, and that's who leaves. Look at the slowest 5%, called p95.
- **An alert doesn't stop a bill.** A budget email at 2 a.m. doesn't stop a runaway loop. A cap that pauses spending does.
- **An outage can cost more than a busy day.** A retry loop against a failing paid API pays for every attempt. Cap the attempts, and watch spend while something's down.
- **Estimate the bad month.** Users times actions times cost, at 10x. Then one bot at 10 requests a second for a day: 864,000 calls.

**How I do it:** when something's slow I measure and fix the query before touching caching, and before shipping anything usage-billed I put the 10x estimate in the PR and set the provider's spend limit.

## Go deeper

- [Use The Index, Luke](https://use-the-index-luke.com/)
- [web.dev: Web Vitals](https://web.dev/articles/vitals)
