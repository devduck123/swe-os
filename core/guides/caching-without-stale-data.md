---
title: Caching without stale data
description: A cache is a second copy of your data that can be wrong. Add one only when you can say what clears it.
stage: design
track: 8
concerns: [performance, security]
freshness: durable
status: reviewed
---

A cache saves work by keeping a copy of an answer. The cost is that the copy can go stale, and nothing in the page says so. "I changed it and it still shows the old one" is almost always a cache, and usually one you didn't know you had.

## Easy to miss

- **Every cache needs an answer to "what clears it?"** Before adding one, name what changes the real data, and what updates the copy when it does. No answer means stale data bugs.
- **Your framework is probably caching already.** Frameworks like Next.js cache fetched data and whole pages by default, and those defaults change between versions. When a change doesn't show up, check the caches before the code, in the docs for the version you're on.
- **Clear it where you write.** Revalidate in the same code that saves the change, not in a separate job that can fail or run late.
- **A shared cache can serve one user's page to another.** A CDN, the network of servers in front of your site, keeps whatever the `Cache-Control` header allows. Nothing personal belongs there.
- **Permissions get cached too.** A cached page or a cached "is admin" keeps a removed user's access until it expires.
- **Expiry by time is a guess.** "Refresh every minute" means up to a minute of wrong data. Fine for a view count, wrong for a balance or a permission.
- **Measure before you cache.** Most slow pages are a missing index or a query in a loop. A cache hides that instead of fixing it ([performance and cost](performance-and-cost.md)).

**How I do it:** no cache until something is measurably slow, and none I can't explain. The agent looks up how my framework's current version caches instead of trusting what it remembers, and nothing per-user goes to the CDN.

**Ask your agent:** "List every cache this app relies on, including the framework's defaults, the CDN, and the browser. Check the current docs for the versions we use. For each, tell me what clears it when the data changes, and fix any that nothing clears."

## Go deeper

- [Next.js: caching and revalidating](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
- [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
