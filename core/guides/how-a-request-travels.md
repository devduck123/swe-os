---
title: How a request travels through your app
description: A click is a chain of hops, and each one can be slow, fail, or hold a copy of the answer. Most debugging is asking which hop broke.
stage: understand
track: 2
concerns: [performance, reliability, security]
freshness: durable
status: draft
---

One tap goes from the browser to a CDN near the user, to a function in one region, to the database, and back. Only the function runs your code. Know where each hop is and what it remembers, and "it's broken" becomes a question you can answer.

## Easy to miss

- **Round trips cost more than slow code.** With the function on one coast and the database on the other, five queries in a row cross that distance ten times. Put the function in the database's region.
- **Anything that ships to the browser is public.** That includes everything a client component imports and every public-prefixed environment variable. It runs the other way too: [server actions are public endpoints](trust-boundaries.md).
- **A shared cache doesn't know who's signed in.** A CDN hands its copy of a response to everyone, session cookie or not. Cache a per-user page and one user sees another's data.
- **Server memory is shared and temporary.** One instance serves many users at once, so a variable at the top of a file is shared by all of them. Instances come and go with traffic, so an in-memory counter or rate limit quietly resets.
- **A CORS error is the browser talking.** The server usually answered fine. The browser just won't let your page read a response from another site.
- **Slow only after a quiet period is a cold start.** A function or database that scales to zero has to wake up first.
- **Works locally, broken when deployed** is usually a missing environment variable. Check that before the code.

**How I do it:** I match the function's region to the database's, mark code for the browser only where something's interactive, and read the failing request's status, timing, and cache header in the Network tab before I guess.

## Go deeper

- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Vercel: CDN cache](https://vercel.com/docs/caching/cdn-cache)
