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

Performance work is finding the one slow thing and fixing that thing. Cost work is the same discipline applied to the bill. Both start with a number, not a hunch.

A slow app usually has one or two real bottlenecks, and everything else is noise. Optimize the wrong thing and you add complexity to a page that's exactly as slow as before. Skip the cost math and you find out at the end of the month.

## The cache that would have hidden the bug

Your SaaS dashboard takes four seconds to load. You ask an agent to fix it, and it suggests adding Redis. Sounds reasonable.

Instead, you measure. The server timing shows 3.6 of those seconds in the database. The query log shows 51 queries for one page load: one to get the team's 50 projects, then one per project to fetch its owner. That's an N+1, and the ORM hid it inside a loop. One join turns 51 round trips into one, and the page loads in well under a second.

Redis would have made the second visit fast and left the first one slow. It would also have added a new service to run and a new class of bug: owners who changed their name and still show the old one.

## Slow is a number, not a feeling

For what users feel in the browser, Google's Core Web Vitals are the common yardstick. Each is judged at the 75th percentile of page loads, split by mobile and desktop:

- **Largest Contentful Paint (LCP):** the main content shows up within 2.5 seconds.
- **Interaction to Next Paint (INP):** the page responds to clicks and taps within 200 milliseconds. INP replaced First Input Delay as a Core Web Vital in 2024. It measures every interaction on the page, not just the first.
- **Cumulative Layout Shift (CLS):** 0.1 or less, meaning content doesn't jump around as it loads.

Lighthouse runs on your machine and is good for before-and-after comparisons. Field data from real users on real phones is what counts. Vercel Speed Insights or PageSpeed Insights show it once you have traffic.

For the server, measure latency per route at p95, not the average. An average of 200ms can hide one user in twenty waiting three seconds. To see where the time goes inside a request, add a `Server-Timing` header. The browser's Network panel shows it next to the request:

```ts
const start = performance.now();
const projects = await getProjects(teamId);
const dbMs = (performance.now() - start).toFixed(1);
return Response.json(projects, {
  headers: { 'Server-Timing': `db;dur=${dbMs}` },
});
```

## When to care, and when not to

Before launch, avoid the obvious traps in the misses list below and stop there. You can't tune for traffic you don't have.

Start real performance work when a number crosses a line you care about: a Core Web Vital goes red, a route's p95 passes your budget, or users complain. Start cost work earlier. Before you ship anything usage-billed, know what it costs and what stops it from costing more.

## The bottleneck is usually one of four things

- **A database query.** A missing index, so Postgres reads the whole table. An N+1, where code loops over rows and queries for each. `SELECT *` pulling large text or JSON columns you never display.
- **A huge payload.** An API that returns 5,000 rows when the screen shows 20, or every field of every object.
- **An unoptimized image.** A 4 MB photo resized by CSS on a phone. `next/image` serves a resized version. See [complete frontend features](complete-frontend-features.md#reserve-space-so-nothing-jumps).
- **Too much client JavaScript.** A big charting, date, or editor library shipped to every page, which delays both LCP and INP.

For a slow query, ask Postgres how it runs it:

```sql
EXPLAIN ANALYZE
SELECT id, number, total FROM invoices
WHERE team_id = 42 ORDER BY created_at DESC LIMIT 50;
-- "Seq Scan on invoices" means it read every row to find 50.

CREATE INDEX invoices_team_created_idx ON invoices (team_id, created_at DESC);
-- Run EXPLAIN ANALYZE again. You want an Index Scan that touches about 50 rows.
```

For an N+1, fetch related rows in the same query with a join, or with Drizzle's relational queries, which compile to one SQL statement. To find one, log queries in development and count them per page. If the count grows with the rows on screen, that's it. [Data that stays correct](data-that-stays-correct.md) covers indexes.

## Every cache is a bet on staleness

A cache saves work by serving an old answer. Each layer trades freshness for speed.

- **Browser.** `Cache-Control: max-age` lets the browser skip the request. Great for hashed static assets. You can't take it back until it expires.
- **CDN.** `s-maxage` caches at the edge for everyone. Never do this for a personalized response, or one user's dashboard gets served to the next. Mark those `private`.
- **Framework cache.** In Next.js 16, `fetch` isn't cached by default, but a page that reads no request data can still be prerendered at build time. You opt in to data caching with `'use cache'` or `fetch` options and invalidate with tags. The cost is remembering to invalidate on every write path.
- **An in-memory store like Redis.** Fast and flexible, and another stateful service to run, secure, and pay for.
- **The database itself.** An index or a materialized view is often the cheapest "cache", because it stays correct.

Before adding a cache, answer two questions. How stale can this data be before someone gets hurt? What invalidates it? If you can't answer the second, you're shipping a stale-data bug on a timer. [Simple first](simple-first.md) is the longer argument.

## Bound the work

- **Paginate every list.** `LIMIT` and `OFFSET` are fine to start. Deep pages get slower, because Postgres still reads and throws away every skipped row. Switch to keyset pagination (`WHERE created_at < $cursor ORDER BY created_at DESC LIMIT 50`) when people actually page deep.
- **Select only the columns you show.** Especially on tables with big text or JSON columns.
- **Watch the bundle.** Run `next experimental-analyze` (Next.js 16.1 and later). Check a library's size before adding it. Do heavy rendering like Markdown or syntax highlighting in Server Components, so the library never ships to the browser.
- **Put compute next to your data.** A function running at the edge near the user, talking to a database in one region, pays a cross-continent round trip on every query. Run your functions in the same region as your database. Vercel now recommends Node.js over its Edge runtime, and Next.js 16.3 dropped `runtime = 'edge'`.

## Know what you're billed for

**List the billed resources** for each feature: function time, bandwidth, image optimizations, database compute and storage, file storage and egress, emails, and AI tokens. The [cost concern](../concerns/cost.md) has the checklist.

**Know the cliffs.** Free tiers end abruptly: a project pauses, a feature stops, or you're forced onto a per-seat plan. The ones in my stack are under [cliffs worth knowing](../../profile/defaults.md#cliffs-worth-knowing).

**Set a cap that actually stops spending.** An alert email at 2 a.m. doesn't stop a runaway bill. Vercel's Spend Management on Pro can pause your production deployments when you hit a budget. It checks every few minutes, so set the budget below your real ceiling. Anthropic's Console lets you set a monthly spend limit below your tier's cap, and requests fail once you reach it. Check whether your provider's limit is a hard stop or just a notification.

**Assume someone will find your AI endpoint.** An unauthenticated route that calls a model API is a way for strangers to spend your money. Require a session, rate-limit per user, cap input size and `max_tokens`, and keep a provider spend limit as the backstop. [AI features in production](ai-features-in-production.md) goes deeper.

**Estimate at 10x before you need to.** Multiply it out: users, times actions per user per day, times 30, times the cost per action from the pricing page. Say 200 users each run 5 AI summaries a day. That's 30,000 calls a month. Now do 2,000 users. Then do the bad month: one bot sending 10 requests a second for a day is 864,000 calls. If either number scares you, add the limit now.

## What the vibe-coded version misses

- **A cache before a measurement.** The real bottleneck stays, and now there's stale data too.
- **N+1 queries hidden by an ORM.** Fine with 5 rows in dev, 500 queries per page in production.
- **`SELECT *` of large rows.** Megabytes of JSON leave the database for a list that shows names.
- **No pagination.** The endpoint is fast until a customer has 50,000 records, then it times out for them alone.
- **A big client library on every page.** The whole app pays for a chart on one screen.
- **No spend cap on a model API.** One scraper can burn a month's budget overnight.
- **Finding the bill at the end of the month.** By then the money's gone, and you can't tell which feature spent it.

## What I'd do

I'd start with Vercel Speed Insights for real-user Web Vitals, `Server-Timing` on slow routes, and query logging in development. When something's slow, I'd read the query plan and fix the query before touching caching. Functions go in the same region as the Neon or Supabase database. Before shipping anything usage-billed, I'd put the 10x estimate in the PR, set the provider's spend limit, and turn on Vercel Spend Management once I'm on Pro.

I'd add a cache when a measured hot path is still too slow after the query is fixed, and the data can be stale for a known window. I'd add Redis only when the framework's cache and the database can't do the job.

## What changes at scale

- **Performance budgets in CI.** Bundle size and Lighthouse scores checked on every PR, so regressions fail before they ship.
- **Load testing** before big launches, to find what breaks first.
- **Read replicas** once reads, not your code, are what the database is drowning in.
- **Cost per customer.** Attribute spend to features and customers, so you can price plans on real numbers.

## Sources

- [web.dev: Web Vitals](https://web.dev/articles/vitals)
- [MDN: Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing)
- [Drizzle: Relational queries](https://orm.drizzle.team/docs/rqb)
- [Next.js: Caching without Cache Components](https://nextjs.org/docs/app/guides/caching-without-cache-components)
- [Next.js: Optimizing package bundling](https://nextjs.org/docs/app/guides/package-bundling)
- [Vercel: Edge runtime](https://vercel.com/docs/functions/runtimes/edge)
- [Vercel: Spend Management](https://vercel.com/docs/spend-management)
- [Anthropic: Rate limits and spend limits](https://platform.claude.com/docs/en/api/rate-limits)
