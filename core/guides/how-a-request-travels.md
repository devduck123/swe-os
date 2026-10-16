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
   └──────────── HTML + RSC payload, streamed back ◀────────┘
```

1. **Getting there.** DNS turns your domain into an IP address, and TLS (the padlock) proves the server is really yours.
2. **CDN.** Vercel's servers near the user hand back static files and cached pages without running your code.
3. **Function and database.** Anything dynamic runs in a function in one region. It queries Postgres and streams back HTML plus the RSC payload, React's compact description of the rendered components.

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

| Where          | Survives refresh, deploy? | Who can read or change it               |
| -------------- | ------------------------- | --------------------------------------- |
| The URL        | Yes, yes                  | The user, and anyone they share it with |
| React state    | No, no                    | The user                                |
| Cookies        | Yes, yes                  | The user; signing them catches edits    |
| `localStorage` | Yes, yes                  | Any script running on your page         |
| Server memory  | Sometimes, no             | Every request on that instance          |
| The database   | Yes, yes                  | Only your server code                   |

Server memory is the tricky row. An instance is one running copy of your function, and Vercel starts and stops them as traffic changes, so an in-memory counter quietly resets. One instance also handles several requests at once. So a variable at module scope (declared at the top of a file, outside any function), like `let currentUser`, is shared by every user who lands on that instance.

Module scope is only for things that are the same for everyone, like the database client. It holds a pool of open connections that requests reuse, instead of opening a new one each time. Per-request data stays inside the request, and anything you'd miss goes in the database.

## Caching happens at every hop

- **The browser** keeps a response for as long as its `Cache-Control: max-age` says.
- **The CDN** keeps a response, and hands it to everyone, when `Cache-Control` sets `s-maxage` (the lifetime for shared caches). The user's session cookie on the request doesn't stop that.

Stale data is almost always a cache you forgot. In the browser's Network tab, click the request and check the `x-vercel-cache` response header: `HIT` means the CDN answered and your code never ran. Then work inward.

## Debug by asking which hop broke

- **Name not resolved or certificate warning:** DNS or TLS.
- **Slow only after a quiet period:** on this stack, probably Neon. It suspends after 5 minutes idle and takes a few hundred milliseconds to wake.
- **`504` or a function timeout:** the function was waiting on the database or an outside API.
- **CORS error:** the browser blocked your page from reading the response. The server usually answered fine.
- **Works locally, broken when deployed:** a missing environment variable, or a region far from the database.

## What the vibe-coded version misses

- **A personal page cached with `s-maxage`:** strangers see the first user's dashboard for a minute.
- **Per-user data in module scope:** it leaks between users under load, and passes every test you run alone.
- **The function and database in different regions:** you burn a weekend tuning queries that were never the problem.
- **A new database connection per request:** under load Postgres runs out of connections and requests fail.

## What I'd do

- Set the Vercel function region to match the database's, in **Settings → Functions**.
- Read data in server components. Add `'use client'` only where something is interactive.
- Put `import 'server-only'` at the top of every module that touches the database or a secret.
- Create the database client once at module scope, copied from the [recipe](../recipes/side-project-stack.md). Nothing per-user goes there.
- Ask your agent: "Find every response that sets `s-maxage` or `public`, and tell me whether any of them depends on who's signed in."
- When something breaks, open the browser's Network tab, click the failing request, and read its status code, its timing, and its `x-vercel-cache` header before guessing.

## Sources

- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Vercel: Configuring regions for functions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel: CDN cache](https://vercel.com/docs/caching/cdn-cache), for the cacheable response criteria
- [Vercel: Fluid compute](https://vercel.com/docs/fluid-compute), for several requests sharing one instance
- [Neon: Scale to zero](https://neon.com/docs/introduction/scale-to-zero)
- [Supabase: Regions](https://supabase.com/docs/guides/platform/regions)
