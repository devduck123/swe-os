---
title: How a request travels through your app
description: One click on a Next.js app traced from the browser to Postgres and back, so you know where your code runs, where state lives, and which hop broke.
domain: foundations
stage: understand
freshness: durable
status: draft
track: 2
reviewed: 2026-10-06
concerns: [performance, reliability, security]
---

A click is a chain of hops: browser, CDN, function, database, and back. Each hop can be slow, can fail, and can hold a copy of the answer. Learn the chain once, and most debugging becomes one question: which hop broke?

## One click, end to end

You have a habit tracker on Next.js, deployed to Vercel, with Postgres on Neon. A signed-in user taps **Dashboard**.

```
browser ──▶ CDN (near the user) ──▶ function (one region) ──▶ Postgres
   ▲         static files and           server components,
   │         cached pages stop here     route handlers, auth
   └──────────── HTML + RSC payload, streamed back ◀────────┘
```

1. **Getting there.** DNS turns your domain into an IP, and TLS proves the server is really yours. Both are cached after the first visit.
2. **CDN.** Vercel's network near the user serves static files and cached pages without touching your code.
3. **Function and database.** Anything dynamic runs in a function in one region. It queries Postgres and streams back HTML, which the browser paints and makes interactive.

## Put the function next to the database

Round trips matter far more than how fast your code is. New Vercel projects run functions in Washington, D.C. (`iad1`) by default. If your Neon database is in Frankfurt, a dashboard that runs five queries in a row crosses the Atlantic ten times before the user sees anything. Matching the function region to the database fixes more than any code tuning.

## Your code runs in two places, and one of them is public

In the App Router, components are **server components** by default. They run in the function, can read the database and secrets, and send only their rendered output to the browser.

A file marked `'use client'` is a **client component**. Its JavaScript ships to the browser so it can respond to clicks, along with everything it imports.

Anything that ships to the browser is public. That's how a `NEXT_PUBLIC_` variable leaks a key ([secrets and agent safety](secrets-and-agent-safety.md)). It runs the other way too: [server actions are public endpoints](trust-boundaries.md) anyone can call.

Put `import 'server-only'` at the top of any module that touches the database or secrets. If a client component ever imports it, the build fails instead of shipping your query code.

## State lives in more places than you think

"Where is this value stored?" answers most questions about stale, lost, and leaked data.

| Where                        | Survives a refresh? | Survives a deploy?    | Who can read or change it                |
| ---------------------------- | ------------------- | --------------------- | ---------------------------------------- |
| The URL                      | Yes                 | Yes                   | The user, and anyone they share it with  |
| React state                  | No                  | No                    | The user                                 |
| Cookies                      | Yes                 | Yes                   | The user can edit them; sign them        |
| `localStorage`               | Yes                 | Yes                   | Any script running on your page          |
| Server memory (module scope) | Sometimes           | No                    | Every request on that instance           |
| Next.js `use cache` entries  | Until they expire   | No, scoped per deploy | Everyone whose request hits the same key |
| The database                 | Yes                 | Yes                   | Only your server code                    |

Server memory is the tricky row. Instances come and go, so an in-memory counter quietly resets. And on Vercel's Fluid compute, on by default, several requests share one instance at once. A module-level `let currentUser` is shared between users who land on the same instance. Keep per-request data inside the request, and anything you'd miss in the database.

## Caching happens at every hop

- **The browser** keeps responses according to `Cache-Control: max-age`.
- **The CDN** keeps responses marked with `s-maxage`. Vercel skips the cache when the request carries an `Authorization` header, or the response sets a cookie, is marked `private`, or sends `Vary: Cookie`. A session cookie on the request alone doesn't stop it.
- **Next.js** caches what you mark `'use cache'`, once `cacheComponents: true` is set in `next.config.ts`. The function's arguments become the key, and on serverless the entries live in per-instance memory.

Stale data is almost always a cache you forgot. Check the `x-vercel-cache` response header to see whether the CDN answered, then work inward.

## Debug by asking which hop broke

- **Name not resolved or certificate warning:** DNS or TLS.
- **Slow only after a quiet period:** on this stack, probably Neon. It suspends after 5 minutes idle and takes a few hundred milliseconds to wake.
- **`504` or a function timeout:** the function was waiting on the database or an outside API.
- **CORS error:** the browser blocked your page from reading the response. The server usually answered fine.
- **Works locally, broken when deployed:** a missing environment variable, or a region far from the database.

## What the vibe-coded version misses

- **A personalized response cached for everyone.** A route returns the user's data with `Cache-Control: public, s-maxage=60`. The CDN serves the first user's dashboard to everyone else for a minute, and you find out when someone screenshots a stranger's habits.
- **Per-user data in module scope.** It leaks between users under concurrent load, and since it's intermittent, it passes every test you run alone.
- **CORS "fixed" with `*`.** A Next.js app calling its own API is same-origin and needs no CORS. Browsers refuse `*` with cookies, so the next "fix" echoes any origin with `Access-Control-Allow-Credentials: true`, and now any website can make signed-in requests as your users.
- **A function in one region and the database in another.** The page is slow no matter how good the code is, and you burn a weekend tuning queries that were never the problem.
- **A new database connection on every call.** Under load you hit Postgres's connection limit and requests fail. Copy the pooled setup from the [side-project stack](../recipes/side-project-stack.md).

## What I'd do

- One Next.js app, with the Vercel function region set to match Neon's.
- Server components for reading data, client components only where something is interactive.
- `import 'server-only'` in every module that touches the database or a secret.
- One connection pool at module scope, set up like the [recipe](../recipes/side-project-stack.md). Per-user data never goes there.
- `'use cache'` only for data that's the same for every user. Nothing personal gets cached at the CDN.
- When something breaks, walk the chain from the browser inward with the network tab before guessing.

## Sources

- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js: `use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache), for `cacheComponents`, cache keys, and in-memory entries on serverless
- [Vercel: Configuring regions for functions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel: CDN cache](https://vercel.com/docs/caching/cdn-cache), for the cacheable response criteria
- [Vercel: Fluid compute](https://vercel.com/docs/fluid-compute)
- [Neon: Scale to zero](https://neon.com/docs/introduction/scale-to-zero)
- [MDN: CORS and credentialed requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#credentialed_requests_and_wildcards)
