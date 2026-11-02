---
title: How a request travels through your app
description: A click is a chain of hops, and each one can be slow, fail, or hold a copy of the answer. Most debugging is asking which hop broke.
stage: understand
track: 2
concerns: [performance, reliability, security]
freshness: durable
status: draft
---

One tap goes from the browser to a CDN, to a function, to the database, and back. The CDN is a network of servers near your users that hands out stored copies of responses. The function is your server code, running in one region, a data center you pick. Each hop remembers something different: the CDN keeps copies, the function keeps almost nothing, and the database keeps everything. Know that, and "it's broken" becomes a question you can answer.

## Easy to miss

- **Round trips cost more than slow code.** A round trip is one request out and its answer back. With the function on one coast and the database on the other, five queries in a row cross that distance ten times. Set the function's region to match the database's.
- **Anything that ships to the browser is public.** That includes every file marked `"use client"`, everything it imports, and every environment variable starting with `NEXT_PUBLIC_`. It runs the other way too: [server actions are public endpoints](trust-boundaries.md).
- **A shared cache doesn't know who's signed in.** A CDN hands its copy of a response to everyone, session cookie or not. Cache a per-user page and one user sees another's data. Tell the CDN not to store anything that depends on who's asking.
- **Server memory is shared and temporary.** An instance is one running copy of your server code. One instance serves many users at once, so a variable at the top of a file is shared by all of them. Instances start and stop with traffic, so an in-memory counter or rate limit quietly resets.
- **Slow only after a quiet period is a cold start.** A function or database that scales to zero, shutting down when nobody's using it, has to boot again before it can answer.
- **Works locally, broken when deployed** is usually a missing environment variable. Check that before the code.

**How I do it:** I match the function's region to the database's, mark code for the browser only where something's interactive, and read the failing request's status, timing, and cache header (whether the CDN answered with a stored copy) in the Network tab before I guess.

**Ask your agent:** "Show me which region my functions and my database run in, and line them up if they don't match. Then find anything shipping to the browser that shouldn't, and any page that depends on who's signed in that the CDN could cache."

## Go deeper

- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Vercel: CDN cache](https://vercel.com/docs/caching/cdn-cache)
