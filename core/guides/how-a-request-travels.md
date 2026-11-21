---
title: How a request travels through your app
description: A click is a chain of hops, and each one can be slow, fail, or hold a copy of the answer. Most debugging is asking which hop broke.
stage: understand
track: 2
concerns: [performance, reliability, security]
freshness: durable
status: reviewed
---

One tap goes from the browser to a CDN, to a function, to the database, and back. The CDN is a network of servers near your users that hands out stored copies of responses. The function is your server code, running in one region, a data center you pick. Each hop remembers something different: [the CDN keeps copies](caching-without-stale-data.md), the function keeps almost nothing, and the database keeps everything. Know that, and "it's broken" becomes a question you can answer.

## Easy to miss

- **Round trips cost more than slow code.** A round trip is one request out and its answer back. With the function on one coast and the database on the other, five queries in a row cross that distance ten times. Set the function's region to match the database's.
- **Anything that ships to the browser is public.** That includes client code, everything it imports, and any environment variable your framework exposes to the browser, usually marked by a name prefix. It runs the other way too: [functions the browser can call are public endpoints](trust-boundaries.md).
- **Server memory is shared and temporary.** An instance is one running copy of your server code. One instance serves many users at once, so a variable at the top of a file is shared by all of them. Instances start and stop with traffic, so an in-memory counter or rate limit quietly resets.
- **Slow only after a quiet period is a cold start.** A function or database that scales to zero, shutting down when nobody's using it, has to boot again before it can answer.
- **Works locally, broken when deployed** is usually a missing environment variable. Check that before the code.

**How I do it:** I match the function's region to the database's, and when a deployed page breaks, I hand the symptom to an agent.

**Ask your agent:** "Show me which regions my functions and my database run in, and anything shipping to the browser that shouldn't."

## Go deeper

- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Chrome DevTools: the Network panel](https://developer.chrome.com/docs/devtools/network)
