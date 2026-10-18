---
title: How a request travels through your app
description: One click on a Next.js app traced from the browser to Postgres and back, so you know where your code runs, where state lives, and which hop broke.
domain: foundations
stage: understand
freshness: durable
status: reviewed
track: 2
reviewed: 2026-10-06
concerns: [performance, reliability, security]
---

A click is a chain of hops: browser, CDN, function, database, and back. Each hop can be slow, can fail, and can hold a copy of the answer. Learn the chain once, and most debugging becomes one question: which hop broke?

## One click, end to end

You have a habit tracker on Next.js, deployed to Vercel, with Postgres on Neon. A signed-in user taps **Dashboard**. Only the function box runs your code.

```
browser ──▶ CDN (near the user) ──▶ function (one region) ──▶ Postgres
   ▲         static files and           server components,
   │         cached pages stop here     route handlers, auth
   └──────────── the rendered page, sent back ◀────────────┘
```

1. **CDN.** Vercel's servers near the user hand back static files and cached pages without running your code.
2. **Function and database.** Anything dynamic runs in a function in one region. It queries Postgres and sends back the rendered page.

## Debug by asking which hop broke

- **Slow only after a quiet period:** on this stack, probably Neon. It suspends after 5 minutes idle and takes a few hundred milliseconds to wake.
- **`504` (gateway timeout) or a function timeout:** the function was waiting on the database or an outside API.
- **CORS error:** the browser blocked your page from reading another site's response. The server usually answered fine.
- **Works locally, broken when deployed:** a missing environment variable, or a region far from the database.
- **Stale data:** a cache you forgot ([below](#caching-happens-at-every-hop)).

## Put the function next to the database

Round trips cost more than slow code. New Vercel projects run functions in Washington, D.C. (`iad1`) by default. If your Neon database is in Frankfurt, a dashboard that runs five queries in a row crosses the Atlantic ten times before the user sees anything.

To move it, open your Vercel project's **Settings → Functions → Function Regions** and pick the region closest to your database, or set `"regions": ["fra1"]` in `vercel.json`. On Supabase, each project is deployed to one region. Match that one.

## Your code runs in two places, and one of them is public

Components are **server components** by default. They run in the function, can read the database and secrets, and send only their rendered output to the browser.

A file marked `'use client'` is a **client component**. Its JavaScript ships to the browser, along with everything it imports, so it can respond to clicks.

Anything that ships to the browser is public. That's how a `NEXT_PUBLIC_` variable leaks a key ([secrets and agent safety](secrets-and-agent-safety.md)). It runs the other way too: [server actions are public endpoints](trust-boundaries.md) anyone can call.

Put `import 'server-only'` at the top of any module that touches the database or secrets. If a client component ever imports it, the build fails instead of shipping your query code.

## State lives in more places than you think

"Where is this value stored?" answers most questions about stale, lost, and leaked data.

- **The URL** survives refresh and deploys. Anyone it's shared with can read it.
- **React state** is gone on refresh. Only that tab has it.
- **Cookies** survive both. The user can edit them, so auth libraries sign theirs to spot edits.
- **`localStorage`** survives both. Any script running on your page can read it.
- **Server memory** sometimes survives a refresh, never a deploy. Every request on that instance shares it.
- **The database** survives everything. Only your server code reaches it.

Server memory is the tricky one. An instance is one running copy of your function, and Vercel starts and stops them as traffic changes, so an in-memory counter quietly resets. One instance also handles several requests at once. So a variable at module scope (declared at the top of a file, outside any function), like `let currentUser`, is shared by every user who lands on that instance.

Module scope is only for things that are the same for everyone, like the database client. It holds a pool of open connections that requests reuse, instead of opening a new one each time. Per-request data stays inside the request, and anything you'd miss goes in the database.

## Caching happens at every hop

`Cache-Control` is a response header (a note sent with the response) that says who may keep a copy, and for how long:

- **The browser** keeps a response for `max-age` seconds.
- **The CDN** keeps a response for `s-maxage` seconds, and hands it to everyone. The user's session cookie on the request doesn't stop that. Next.js adds `s-maxage` to pages it caches, like ones with `export const revalidate`, and agents add it by hand to route handlers, sometimes in a separate `CDN-Cache-Control` header that only CDNs read.

In the browser's Network tab, click the request and check its `x-vercel-cache` header: `HIT` means the CDN answered and your code never ran. Then work inward.

## How I do it

On my own side projects:

- Set the Vercel function region to match the database's, in **Settings → Functions**.
- Read data in server components, and add `'use client'` only where something is interactive.
- Create the database client once at module scope, copied from the [recipe](../recipes/side-project-stack.md). Nothing per-user goes there.
- Ask your agent: "Find every response that sets `s-maxage`, `public`, or a `CDN-Cache-Control` header, and every page that uses `revalidate`. Tell me whether any of them depends on who's signed in."
- Give every database and outside call a timeout, so a slow hop fails fast instead of hanging ([timeouts, retries, and idempotency](timeouts-retries-idempotency.md)).
- When something breaks, read the failing request's status, timing, and `x-vercel-cache` header in the Network tab before guessing.

## The standard

- **A latency budget per main page, and a load test before a launch,** as in [performance and cost](performance-and-cost.md#the-standard). Once real users wait on these pages.
- **Tracing shows how long one request spent at each hop.** Do it once you can't tell which call makes a page slow ([knowing it broke](knowing-it-broke.md)).

## Before you ship, check

Paste this to your agent before you merge:

- Nothing that depends on who's signed in is cached with `s-maxage`, `public`, `CDN-Cache-Control`, or `revalidate`.
- No per-user data lives in a variable at module scope.
- The function region matches the database's.
- The database client is created once at module scope, not per request.
- Every module that touches the database or a secret starts with `import 'server-only'`.

## Sources

- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Vercel: Configuring regions for functions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel: CDN cache](https://vercel.com/docs/caching/cdn-cache), for the cacheable response criteria and `s-maxage`
- [Next.js: Incremental Static Regeneration](https://nextjs.org/docs/app/guides/incremental-static-regeneration), for `revalidate` adding `Cache-Control` headers
- [Vercel: Fluid compute](https://vercel.com/docs/fluid-compute), for several requests sharing one instance
- [Neon: Scale to zero](https://neon.com/docs/introduction/scale-to-zero)
- [Supabase: Regions](https://supabase.com/docs/guides/platform/regions)
