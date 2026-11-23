---
title: 'Performance and cost: scale from evidence'
description: Find the one slow or expensive thing with a number, fix that thing, and put a cap on anything strangers can spend.
stage: operate
track: 24
concerns: [performance, cost]
freshness: durable
status: reviewed
---

Performance work is finding the one slow thing and fixing that thing. Cost work does the same for the bill. Both start with a number, not a hunch. Optimize the wrong thing and you've added complexity to a page that's just as slow.

## Easy to miss

- **The agent's first fix is usually a cache.** Time each step first: the database calls, the outside APIs, the render. A slow list is often one query for the list plus one more for every row, hidden inside a loop (the N+1 problem). One query that fetches it all fixes it. A cache only makes the second visit fast, and brings [its own bugs](caching-without-stale-data.md).
- **Fine with 10 rows, unusable with 100,000.** Tiny test data hides a missing index ([data that stays correct](data-that-stays-correct.md)). Load anything that grows with your users a page at a time, say 50 rows, not all at once.
- **Averages hide the slow visits.** A page that averages 300 ms can still take four seconds for one visit in twenty, and that's who leaves. Look at the slowest 5%, called p95.
- **An alert doesn't stop a bill.** A budget email at 2 a.m. doesn't stop a runaway loop. A spend cap that pauses the service does.
- **Estimate the bad month.** Multiply users by how often each one triggers a paid call by what a call costs, then by 10. Then price one bot at 10 requests a second for a day: 864,000 calls.

**How I do it:** when something's slow, I have the agent measure it and fix the query before anyone touches caching.

**Ask your agent:** "What's the slowest page in this app, and what's the most a bad month could cost?"

## Go deeper

- [Use The Index, Luke](https://use-the-index-luke.com/)
- [web.dev: Web Vitals](https://web.dev/articles/vitals)
