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

- **The agent's first fix is usually a cache.** Time each step first: the database calls, the outside APIs, the render. A slow list is often one query for the list plus one more for every row, hidden inside a loop (the N+1 problem). One query that fetches it all fixes it. A cache only makes the second visit fast.
- **Fine with 10 rows, unusable with 100,000.** Without an index, a sorted lookup the database keeps for a column, like the one at the back of a book, it reads every row to find the 50 you want. Tiny test data hides it. Postgres's `EXPLAIN` shows whether a query reads every row. And load anything that grows with your users a page at a time, say 50 rows, not all at once.
- **Every cache is a bet on staleness.** Know how stale the data can be and which changes to the data throw the cached copy away. Never cache a personalized response somewhere shared, or one user's dashboard gets served to the next.
- **Averages hide the slow visits.** A page that averages 300 ms can still take four seconds for one visit in twenty, and that's who leaves. Look at the slowest 5%, called p95.
- **An alert doesn't stop a bill.** A budget email at 2 a.m. doesn't stop a runaway loop. A spend cap that pauses the service does.
- **Estimate the bad month.** Multiply users by how often each one triggers a paid call by what a call costs, then by 10. Then price one bot at 10 requests a second for a day: 864,000 calls.

**How I do it:** when something's slow I measure and fix the query before touching caching, and before shipping anything billed per use, like AI calls or emails, I put the 10x estimate in the PR and set the provider's spend cap.

**Ask your agent:** "Before you add any cache, time each step of this slow page and show me the queries it runs, checking for a missing index or a query per row. Then list every service here that bills per use, estimate a bad month for each, and tell me where to set a hard spend cap."

## Go deeper

- [Use The Index, Luke](https://use-the-index-luke.com/)
- [web.dev: Web Vitals](https://web.dev/articles/vitals)
