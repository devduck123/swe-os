---
title: 'Performance and cost: scale from evidence'
description: Measure before you optimize, fix the one bottleneck you actually have, know what every cache costs you, and keep the bill boring as usage grows.
domain: architecture
stage: operate
freshness: evolving
status: draft
track: 20
reviewed: 2026-10-06
concerns: [performance, cost]
---

Performance work is finding the one slow thing and fixing that thing. Cost work does the same for the bill. Both start with a number, not a hunch. Optimize the wrong thing and you add complexity to a page that's just as slow. Skip the cost math and you find out at the end of the month.

## The cache that would have hidden the bug

Your SaaS dashboard takes four seconds to load. You ask an agent to fix it, and it suggests Redis. Sounds reasonable.

Instead, you measure. The server timing shows 3.6 of those seconds in the database. The query log shows 51 queries for one page load: one to get the team's 50 projects, then one per project to fetch its owner. That's an N+1, and the ORM hid it inside a loop. One join turns 51 round trips into one, and the page loads in well under a second.

Redis would have made the second visit fast and left the first one slow. It would also have added a service to run and a new bug: owners who renamed themselves still showing the old name.

## Slow is a number, not a feeling

In the browser, Google's Core Web Vitals are the yardstick, judged at the 75th percentile of page loads: the main content shows within 2.5 seconds (LCP), every tap gets a response within 200 milliseconds (INP), and layout shift stays at 0.1 or less (CLS). Lighthouse is fine for before-and-after checks, but field data from real phones is what counts, and Vercel Speed Insights shows it once you have traffic.

On the server, measure each route at p95, not the average. An average of 200ms can hide one user in twenty waiting three seconds. To see where the time goes, add a `Server-Timing` header, which the browser's Network panel shows next to the request:

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

- **A database query.** A missing index, so Postgres reads the whole table. An N+1. `SELECT *` pulling big JSON columns you never display.
- **A huge payload.** 5,000 rows returned when the screen shows 20.
- **An unoptimized image.** A 4 MB photo resized by CSS on a phone. `next/image` serves a resized version. See [complete frontend features](complete-frontend-features.md).
- **Too much client JavaScript.** A big chart or editor library shipped to every page.

For a slow query, ask Postgres how it runs it:

```sql
EXPLAIN ANALYZE
SELECT id, number, total FROM invoices
WHERE team_id = 42 ORDER BY created_at DESC LIMIT 50;
-- "Seq Scan on invoices" means it read every row to find 50.

CREATE INDEX invoices_team_created_idx ON invoices (team_id, created_at DESC);
-- Run EXPLAIN ANALYZE again. You want an Index Scan that touches about 50 rows.
```

To find an N+1, log queries in development and count them per page. If the count grows with the rows on screen, that's it. Fix it with a join, or with Drizzle's relational queries, which compile to one SQL statement.

## Every cache is a bet on staleness

A cache saves work by serving an old answer. Before adding one, answer two questions. How stale can this data be before someone gets hurt? What invalidates it? If you can't answer the second, you're shipping a stale-data bug on a timer.

In Next.js 16, data isn't cached unless you opt in with Cache Components: set `cacheComponents: true` in `next.config.ts`, mark a function `'use cache'`, and give it a `cacheTag`. Then every write to that data has to invalidate the tag, with `updateTag` in a server action or `revalidateTag` in a route handler. Miss one write path and users see old data. On Vercel, plain `'use cache'` mostly feeds the prerendered page, because request-time entries live in one instance's memory. A cache shared across requests needs `'use cache: remote'`, which adds a network hop and a bill.

Never cache a personalized response somewhere it's shared, or one user's dashboard gets served to the next. Often the cheapest "cache" is an index, because it stays correct. [Simple first](simple-first.md) covers when Redis earns its place.

## Bound the work

- **Paginate every list.** `LIMIT` and `OFFSET` are fine to start. Switch to keyset pagination (`WHERE created_at < $cursor ORDER BY created_at DESC LIMIT 50`) when people page deep, because `OFFSET` still reads every skipped row.
- **Watch the bundle.** Run `next analyze` to see what ships to each route. Render heavy things like Markdown or syntax highlighting in Server Components, so the library never reaches the browser.
- **Put compute next to your data.** A function near the user, talking to a database in another region, pays a cross-continent round trip on every query. Run functions in the database's region. Next.js has deprecated `runtime = 'edge'`: it still runs, with a warning, and Node.js is the default.

## Know what you're billed for

**List the billed resources** for each feature: function time, bandwidth, image optimizations, database compute and storage, file storage, emails, and AI tokens. The [cost concern](../concerns/cost.md) has the checklist. Free tiers end abruptly, and the [cliffs in my stack](../recipes/side-project-stack.md#what-it-costs) are in the recipe.

**Set a cap that actually stops spending.** An alert email at 2 a.m. doesn't stop a runaway bill. Vercel's Spend Management on Pro pauses production at a budget, but only with that action turned on. Otherwise it just notifies you. It checks every few minutes, so set it below your real ceiling. Anthropic's Console lets you set a monthly spend limit, and requests fail once you reach it. Check whether each provider's limit is a hard stop or just an email.

**Assume someone will find your AI endpoint.** An open route that calls a model API lets strangers spend your money. Require a session, [rate-limit it](trust-boundaries.md), cap input size and `max_tokens`, and keep a provider spend limit as the backstop.

**Estimate at 10x before you need to.** Users, times actions per user per day, times 30, times the cost per action. Say 200 users each run 5 AI summaries a day. That's 30,000 calls a month. Now do 2,000 users. Then do the bad month: one bot sending 10 requests a second for a day is 864,000 calls. If either number scares you, add the limit now.

## What the vibe-coded version misses

- **A cache before a measurement.** The real bottleneck stays, and now there's stale data too.
- **N+1 queries hidden by an ORM.** Fine with 5 rows in dev, 500 queries per page in production.
- **No pagination.** The endpoint is fast until a customer has 50,000 records, then it times out for them alone.
- **No spend cap on a model API.** One scraper can burn a month's budget overnight.
- **Finding the bill at the end of the month.** By then the money's gone, and you can't tell which feature spent it.

## What I'd do

I'd start with Vercel Speed Insights, `Server-Timing` on slow routes, and query logging in development. When something's slow, I'd read the query plan and fix the query before touching caching. Before shipping anything usage-billed, I'd put the 10x estimate in the PR, set the provider's spend limit, and turn on Vercel Spend Management once I'm on Pro.

I'd add a cache when a measured hot path is still too slow after the query is fixed, and the data can be stale for a known window.

## Sources

- [web.dev: Web Vitals](https://web.dev/articles/vitals)
- [MDN: Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing)
- [Drizzle: Relational queries](https://orm.drizzle.team/docs/rqb)
- [Next.js: `use cache` (runtime caching on serverless)](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Next.js: `updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [Next.js CLI: `next analyze`](https://nextjs.org/docs/app/api-reference/cli/next#next-analyze-options)
- [Next.js: Edge runtime deprecated](https://nextjs.org/docs/messages/edge-runtime-deprecated)
- [Vercel: Spend Management](https://vercel.com/docs/spend-management)
- [Anthropic: Rate limits and spend limits](https://platform.claude.com/docs/en/api/rate-limits)
