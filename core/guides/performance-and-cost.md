---
title: 'Performance and cost: scale from evidence'
description: Measure before you optimize, fix the one bottleneck you actually have, know what every cache costs you, and keep the bill boring as usage grows.
domain: architecture
stage: operate
freshness: evolving
status: reviewed
track: 20
reviewed: 2026-10-06
concerns: [performance, cost]
---

Performance work is finding the one slow thing and fixing that thing. Cost work does the same for the bill. Both start with a number, not a hunch. Optimize the wrong thing and you add complexity to a page that's just as slow.

## The cache that would have hidden the bug

Your SaaS dashboard takes four seconds to load. You ask an agent to fix it, and it suggests Redis. Sounds reasonable.

Instead, you measure. The server timing shows 3.6 of those seconds in the database. The query log shows 51 queries for one page load: one to get the team's 50 projects, then one per project to fetch its owner. That's an N+1, and the ORM (the library that writes your SQL) hid it inside a loop. One join (a single query that fetches the projects and their owners together) turns 51 trips to the database into one, and the page loads in well under a second.

Redis would have made the second visit fast and left the first one slow. It would also have added a service to run and a new bug: owners who renamed themselves still showing the old name.

## Slow is a number, not a feeling

In the browser, Google's Core Web Vitals are the yardstick: the main content shows within 2.5 seconds, every tap responds within 200 milliseconds, and the layout doesn't jump as it loads. Lighthouse in Chrome DevTools is fine for before-and-after checks, but real phones are what count, and Vercel Speed Insights shows them once you have traffic.

On the server, measure each route's p95, the time 95 out of 100 requests beat, not the average. An average of 200ms can hide one user in twenty waiting three seconds. To see where the time goes, add a `Server-Timing` header. Notice it times only the database call. The browser's Network panel shows the result:

```ts
const start = performance.now();
const projects = await getProjects(teamId);
const dbMs = (performance.now() - start).toFixed(1);
return Response.json(projects, {
  headers: { 'Server-Timing': `db;dur=${dbMs}` },
});
```

Start performance work when a number crosses a line you care about. Start cost work before you ship anything usage-billed.

## The bottleneck is usually one of four things

- **A database query.** A missing index (a sorted lookup Postgres can jump into, like a book's index), so it reads the whole table. An N+1. `SELECT *` pulling big JSON columns you never display.
- **A huge payload.** 5,000 rows returned when the screen shows 20.
- **An unoptimized image.** A 4 MB photo resized by CSS on a phone. `next/image` serves a resized version. See [complete frontend features](complete-frontend-features.md).
- **Too much client JavaScript.** A big chart or editor library shipped to every page.

For a slow query, ask Postgres how it runs it in your database's SQL editor (Neon and Supabase both have one). Notice how it finds the rows before and after the index:

```sql
EXPLAIN ANALYZE
SELECT id, number, total FROM invoices
WHERE team_id = 42 ORDER BY created_at DESC LIMIT 50;
-- "Seq Scan on invoices" means it read every row to find 50.

CREATE INDEX invoices_team_created_idx ON invoices (team_id, created_at DESC);
-- Run EXPLAIN ANALYZE again. You want an Index Scan that touches about 50 rows.
```

To find an N+1, log queries in development and count them per page. In Drizzle, pass `{ logger: true }` to `drizzle()`. With supabase-js, look for a query inside a loop or a `.map()`. If the count grows with the rows on screen, that's it. Fix it with a join, or with Drizzle's relational queries, which compile to one SQL statement.

## Every cache is a bet on staleness

A cache saves work by serving an old answer. Before adding one, answer two questions. How stale can this data be before someone gets hurt? What invalidates it? If you can't answer the second, you're shipping a stale-data bug on a timer.

In Next.js 16, data isn't cached unless you opt in, and then every write to that data has to clear the cached copy. Miss one write path and users see old data.

Never cache a personalized response somewhere it's shared, or one user's dashboard gets served to the next. Often the cheapest "cache" is an index, because it stays correct. [Simple first](simple-first.md) covers when Redis earns its place.

<details>
<summary>Going deeper: the Next.js 16 cache APIs</summary>

Opt in with Cache Components: set `cacheComponents: true` in `next.config.ts`, mark a function `'use cache'`, and give it a `cacheTag`. Invalidate the tag on every write, with `updateTag` in a server action or `revalidateTag` in a route handler. On Vercel, plain `'use cache'` mostly feeds the prerendered page, because request-time entries live in one instance's memory. A cache shared across requests needs `'use cache: remote'`, which adds a network hop and a bill.

</details>

## Bound the work

- **Paginate every list.** `LIMIT 50 OFFSET 100` (skip 100, take 50) is fine to start. When people page deep, switch to a cursor (`WHERE created_at < $last_seen ORDER BY created_at DESC LIMIT 50`), because `OFFSET` still reads every skipped row.
- **Watch the bundle,** the JavaScript each page sends to the browser. Run `next analyze` to see it per route. Render heavy things like Markdown or syntax highlighting in Server Components, so the library never reaches the browser.
- **Put compute next to your data.** A function talking to a database on another continent pays that distance on every query. Vercel runs functions in Washington, D.C. (`iad1`) by default. Set **Settings > Functions > Function Regions** to your database's region.

## Know what you're billed for

**List the billed resources** for each feature: function time, bandwidth, image optimizations, database compute and storage, file storage, emails, and AI tokens. The [cost concern](../concerns/cost.md) has the checklist. Free tiers end abruptly, and the [cliffs in my stack](../recipes/side-project-stack.md#what-it-costs) are in the recipe.

**Set a cap that actually stops spending.** An alert email at 2 a.m. doesn't stop a runaway bill. Vercel's Spend Management on Pro pauses production at a budget, but only with that action turned on. Otherwise it just emails you. It checks every few minutes, so set it below your real ceiling. Anthropic's Console has a monthly spend limit, and requests fail once you reach it.

**Assume someone will find your AI endpoint.** An open route that calls a model API lets strangers spend your money. Require a session, [rate-limit it](trust-boundaries.md), cap the input size and the reply length (`max_tokens`), and keep a provider spend limit as the backstop.

**Estimate at 10x before you need to.** Users, times actions per user per day, times 30, times the cost per action. Say 200 users each run 5 AI summaries a day. That's 30,000 calls a month. Now do 2,000 users. Then do the bad month: one bot sending 10 requests a second for a day is 864,000 calls. If either number scares you, add the limit now.

## What the vibe-coded version misses

- **A cache before a measurement.** The real bottleneck stays, plus stale data.
- **An N+1 hidden by the ORM.** Fast with 5 rows in dev, 500 queries per page in production.
- **No pagination.** It times out for your biggest customer alone.
- **No spend cap on a model API.** One scraper burns a month's budget overnight.
- **No cost estimate.** You find out from the bill, and can't tell which feature spent it.

## What I'd do

- Ask your agent: "Install `@vercel/speed-insights` and add `<SpeedInsights />` to the root layout."
- Match the Vercel function region to the database.
- Log queries in development, and add `Server-Timing` to any route that feels slow.
- When something's slow, run `EXPLAIN ANALYZE` and fix the query before touching caching.
- Before shipping anything usage-billed, put the 10x estimate in the PR and set the provider's spend limit. On Vercel Pro, turn on Spend Management with the pause action.

I'd add a cache when a measured slow path is still too slow after the query is fixed, and the data can be stale for a known window.

## Sources

- [web.dev: Web Vitals](https://web.dev/articles/vitals)
- [MDN: Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing)
- [Drizzle: Relational queries](https://orm.drizzle.team/docs/rqb)
- [Next.js: `use cache` (runtime caching on serverless)](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Next.js: `updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [Next.js CLI: `next analyze`](https://nextjs.org/docs/app/api-reference/cli/next#next-analyze-options)
- [Vercel: Configuring function regions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel: Speed Insights quickstart](https://vercel.com/docs/speed-insights/quickstart)
- [Drizzle: Logging](https://orm.drizzle.team/docs/goodies)
- [Vercel: Spend Management](https://vercel.com/docs/spend-management)
- [Anthropic: Rate limits and spend limits](https://platform.claude.com/docs/en/api/rate-limits)
