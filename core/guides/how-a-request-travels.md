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

A click is a chain of hops. The browser finds your server, opens a secure connection, reaches a nearby edge, wakes up a function, asks the database, and paints what comes back. Each hop can be slow, can fail, and can hold a copy of the answer.

Learn the chain once and most debugging turns into one question: which hop broke? It also tells you where your code runs, which decides what's public, what's slow, and what survives a refresh.

## One click, seven hops

Here's the running example. You have a habit tracker on Next.js, deployed to Vercel, with Postgres on Neon. A signed-in user taps **Dashboard**, which loads `/dashboard` and shows their habits for the week.

```
browser ─① DNS─▶ resolver: "what IP is app.example.com?"
   │
   ├─② TCP + TLS─▶ ③ CDN / edge (near the user)
   │                    │  static files and cached pages stop here
   │                    ▼
   │               ④ function (one region) ─⑤ SQL─▶ Postgres
   │                    │
   ◀──── ⑥ HTML + RSC payload, streamed ──┘
   │
   ⑦ browser renders, downloads JS, hydrates client components
```

1. **DNS.** The browser asks a resolver for the IP behind your domain. After the first visit, it's usually cached.
2. **TCP and TLS.** The browser opens a connection and does a TLS handshake. The certificate proves the server really is `app.example.com`, and the two sides agree on encryption keys.
3. **CDN or edge.** The request lands on Vercel's network near the user. Static files and cached pages are served from here without touching your code.
4. **Function.** Anything dynamic goes to a function in one region. By default, new Vercel projects run functions in Washington, D.C. (`iad1`). Your server components, route handlers, and session checks run here.
5. **Database.** The function sends SQL to Postgres over the network, waits, and gets rows back.
6. **Response.** The function streams back HTML plus the RSC payload, which React uses to rebuild the page in the browser.
7. **Render.** The browser paints the HTML, downloads the JavaScript for any client components, and hydrates them so buttons work.

## Distance costs more than code

Orders of magnitude are enough. Reading memory takes around a hundred nanoseconds. A round trip inside one data center is around half a millisecond. A packet from California to the Netherlands and back is around 150 milliseconds. Hardware has changed since these numbers were published. The gaps haven't.

So in a typical web app, round trips matter far more than how fast your code is. If your function runs in Washington and your database sits in Frankfurt, every query crosses the Atlantic. A dashboard that runs five queries one after another pays that trip five times before the user sees anything. Moving the function next to the database fixes more than any amount of code tuning.

Every hop can also hang, which is why every network call needs a deadline. See [timeouts, retries, and idempotency](timeouts-retries-idempotency.md).

## Your code runs in two places, and one of them is public

In the Next.js App Router, components are **server components** by default. They run in the function, they can read the database and secret environment variables, and they send only their rendered output to the browser.

A file marked `'use client'` is a **client component**. It still renders once on the server for the first paint, but its JavaScript ships to the browser so it can respond to clicks. Next.js includes everything that file imports in the client bundle too.

Anything that ships to the browser is public. Anyone can open dev tools and read it. Two rules follow:

- **Environment variables with `NEXT_PUBLIC_` are inlined into the JavaScript bundle at build time.** If an agent "fixes" an undefined key by adding the prefix, that key is now on every user's machine. Variables without the prefix stay on the server.
- **Server actions are public endpoints.** They run on the server, but the browser calls them with a `POST`. Anyone can call them with any arguments, so each one checks the session and permissions itself.

To make the boundary hard to cross by accident, put `import 'server-only'` at the top of any module that touches the database or secrets. If a client component ever imports it, the build fails instead of shipping your query code.

## State lives in more places than you think

"Where is this value stored?" answers most questions about stale data, lost data, and leaked data.

| Where                        | Survives a refresh? | Survives a deploy?    | Who can read or change it                |
| ---------------------------- | ------------------- | --------------------- | ---------------------------------------- |
| The URL                      | Yes                 | Yes                   | The user, and anyone they share it with  |
| React state                  | No                  | No                    | The user                                 |
| Cookies                      | Yes                 | Yes                   | The user can edit them; sign them        |
| `localStorage`               | Yes                 | Yes                   | Any script running on your page          |
| Server memory (module scope) | Sometimes           | No                    | Every request on that instance           |
| Next.js `use cache` entries  | Until they expire   | No, scoped per deploy | Everyone whose request hits the same key |
| The database                 | Yes                 | Yes                   | Only your server code                    |

Server memory is the tricky row. Serverless instances get created and thrown away, so a counter or in-memory rate limit quietly resets. And on Vercel's Fluid compute, which is on by default for new projects, several requests can share one instance at the same time. A module-level `let currentUser` is shared between users who happen to land on the same instance. Keep per-request data inside the request.

Only the database survives everything and follows the user to another device. If losing it would matter, it goes there.

## Caching happens at every hop

Each hop can answer from a copy instead of doing the work:

- **The browser** keeps responses according to `Cache-Control: max-age`.
- **The CDN** keeps responses marked with `s-maxage`. Vercel won't cache a response that sets a cookie or is marked `private`. A session cookie on the request isn't on that list, so the response headers decide.
- **Next.js** caches what you mark with `'use cache'`. The function's arguments become the cache key. On serverless, entries live in per-instance memory by default, so they may not survive between requests.
- **Postgres** keeps hot data in memory on its own. You rarely manage this one.

A stale-data bug is almost always a cache you forgot about. If the dashboard still shows the old habit after an update, one of these layers answered. Check `x-vercel-cache` in the response headers to see whether the CDN served it, then work down the chain.

## Debug by asking which hop broke

- **Name not resolved:** DNS. The domain is misconfigured or hasn't propagated.
- **Certificate warning:** TLS. Wrong domain on the certificate, or it expired.
- **Slow only after a quiet period:** a cold start at the function.
- **`504` or a function timeout:** the function was waiting on the database or an outside API.
- **CORS error in the console:** the browser blocked your page from reading the response. The server usually answered fine.
- **Old data:** a cache. Find which one.
- **Works locally, broken when deployed:** a missing environment variable, or a region far from the database.

## What the vibe-coded version misses

- **Secrets in the client bundle.** The agent adds `NEXT_PUBLIC_` to make an "undefined" error go away, and the API key ships to every browser.
- **A new database connection on every call.** Each invocation opens its own Postgres connection, and under load you hit the connection limit and requests fail. A pool keeps a few connections open and lends them out. Use Neon's pooled connection string (the `-pooler` hostname), create the pool once at module scope, and register it with Vercel's `attachDatabasePool` so idle connections close before the instance is suspended.
- **CORS "fixed" with `*`.** A Next.js app calling its own API is same-origin and doesn't need CORS at all. `*` lets every website read your API's responses, and browsers refuse it for requests with cookies anyway. So the next "fix" is echoing back any origin with `Access-Control-Allow-Credentials: true`, and now any website can make signed-in requests as your users.
- **A personalized response cached for everyone.** A route handler returns the user's data with `Cache-Control: public, s-maxage=60`. The CDN stores the first user's dashboard and serves it to the next person for a minute.
- **A function in one region and the database in another.** Every query crosses a continent or an ocean, and the page is slow no matter how good the code is.
- **Per-user data in module scope.** It works with one tester and leaks between users once instances serve concurrent requests.
- **Auth only in the UI.** The button is hidden, but the route or server action behind it doesn't check anything. See [trust boundaries](trust-boundaries.md).

## What I'd do

- One Next.js app, with the Vercel function region set to match the Neon region.
- Server components for reading data. Client components only where something needs to be interactive.
- `import 'server-only'` in every module that touches the database or a secret, and no `NEXT_PUBLIC_` variable that I'd mind seeing on a billboard.
- Neon's pooled connection string, with one pool at module scope. The pool belongs there. Per-user data never does.
- `'use cache'` only for data that's the same for every user, like a public list of habit templates. Anything personal stays uncached at the CDN.
- When something breaks, walk the chain from the browser inward with the network tab before guessing.

I'd add more only when a real number says so. If users far from the region complain about speed, I'd cache public pages at the CDN first, then look at read replicas closer to them.

## What changes at scale

- **More regions.** Functions run near users, so the database needs read replicas near them too, and writes still go to one primary.
- **Caching on purpose.** Each cache gets a key, a lifetime, and a plan for invalidating it, written down.
- **Connection limits become a real ceiling.** Pooling stops being a fix and becomes something you monitor.

## Sources

- [Next.js: Environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js: Caching](https://nextjs.org/docs/app/getting-started/caching)
- [Vercel: Configuring regions for functions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel: CDN cache](https://vercel.com/docs/caching/cdn-cache)
- [Vercel: Fluid compute](https://vercel.com/docs/fluid-compute)
- [Vercel: Connection pooling with functions](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [Neon: Connection pooling](https://neon.com/docs/connect/connection-pooling)
- [MDN: CORS and credentialed requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#credentialed_requests_and_wildcards)
- [Latency numbers every programmer should know](https://gist.github.com/jboner/2841832)
