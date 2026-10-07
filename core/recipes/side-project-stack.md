---
title: The side-project stack
description: A full-stack web app on managed services that one person can ship this weekend, run for free, and grow without a rewrite.
domain: architecture
stage: design
freshness: fast-moving
status: reviewed
reviewed: 2026-10-06
track: 22
concerns: [deployment, cost, security, data]
prev:
  link: /guides/learning-with-agents/
  label: 'Track 21: Learning while agents write the code'
---

This is the stack I'd use to build a real web app alone: one Next.js app on Vercel, Postgres on Neon through Drizzle, auth, file storage, email, payments, and error tracking. Every piece is managed, starts free, and grows a long way before you'd want to replace it. You'll see why each one is here and exactly where its free tier ends, because those limits end abruptly. It's also where the track comes together: each stop taught one idea, and here's where it lives.

## The whole thing on one page

```text
                            Browser
                               |
                               | HTTPS
                               v
   +-------------------- Vercel ---------------------+
   |  One Next.js app (TypeScript)                   |
   |  pages, server actions, route handlers          | --- errors ---> Sentry
   |  Zod at every boundary                          |
   +----+---------+---------+---------+---------+----+
        |         |         |         |         ^
        | SQL     | session | uploads | send    | checkout out,
        |         |         |         |         | webhooks in
        v         v         v         v         v
      Neon      Better    Vercel    Email     Stripe
    Postgres   Auth or     Blob    provider
                Clerk
```

Two arrows need a closer look:

- **Session:** "who is this?" on every request that needs a user. Better Auth looks the session up in your own Postgres. With Clerk, your server checks the signature on a short-lived session token locally, without calling Clerk. The token lasts 60 seconds, and Clerk's browser SDK refreshes it in the background.
- **Stripe:** you create a Checkout session, and Stripe tells you it was paid through a signed webhook.

## Why each piece is here

**Next.js on Vercel.** One app holds the UI, the server code, and the API routes: one repo, one deploy, one place to look. Every PR gets a preview, and production gets instant rollback. If the app were mostly client-side and URL-driven, I'd look at TanStack Start instead.

**Postgres on Neon, through Drizzle.** Postgres's constraints and transactions do the remembering your code forgets ([data that stays correct](../guides/data-that-stays-correct.md)). Neon scales to zero when idle and branches the database per preview. Drizzle keeps the schema in TypeScript and generates migrations as plain SQL. If I wanted auth, storage, and realtime from one vendor, I'd pick Supabase instead, knowing its free projects pause after a week without activity.

**Better Auth or Clerk.** Never hand-roll auth. Better Auth is a free library that keeps users in your own Postgres. Clerk is hosted, with ready-made sign-in UI, and is faster to start, but its free plan has no MFA or passkeys. Either way, every query still checks that the user owns the row ([trust boundaries](../guides/trust-boundaries.md)).

**Vercel Blob.** Files don't belong in the database. Blob stores them, serves them from a CDN, and lets the browser upload directly. Postgres keeps only each file's URL and owner.

**A transactional email provider,** such as Resend or Postmark. Auth needs it from the first sign-up, for verification and password resets. Locally, log the email to the console.

**Stripe,** once someone wants to pay. Build the whole flow in test mode, and use `stripe listen` to forward webhooks to your laptop. Handle the webhook the way [background jobs and webhooks](../guides/background-jobs-and-webhooks.md) describes.

**Sentry.** It tells you something broke before a user does ([knowing it broke](../guides/knowing-it-broke.md)).

**Zod.** Everything crossing a boundary gets parsed: form input, route params, webhook bodies, env vars, and AI output.

## One pool, created once

Pick one driver and use it everywhere: `pg` with Neon's pooled connection string, through `drizzle-orm/node-postgres`. A Vercel function instance serves many requests, so create the pool once at module scope and let them share it. `attachDatabasePool` closes idle connections before the instance suspends, so they don't leak. Transactions work exactly as they do locally.

```ts
// lib/db.ts
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Neon's pooled URL, with -pooler in the host
  idleTimeoutMillis: 5_000,
});
attachDatabasePool(pool);

export const db = drizzle({ client: pool });
```

Migrations are the exception. They run over the direct URL, from the Vercel build ([shipping changes you can undo](../guides/shipping-changes-you-can-undo.md#run-migrations-in-the-vercel-build)).

## Rate-limit auth in the database

Login, sign-up, and password reset need rate limits from day one ([trust boundaries](../guides/trust-boundaries.md)). Better Auth's limiter counts in memory by default, which its docs say may not suit serverless, because each function instance counts on its own. Store the counts in Postgres, and run Better Auth's migration to create the table:

```ts
export const auth = betterAuth({
  // ...
  rateLimit: { storage: 'database' },
});
```

## What it costs

Checked 2026-10-06. "Monthly users" is a rough stand-in for usage, so trust your own dashboards over any column.

| Piece                   | 0 users (building)                                      | ~1,000 monthly users                                                                     | ~10,000 monthly users                                                                    |
| ----------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Vercel                  | Hobby, $0                                               | Hobby $0 if non-commercial. Pro $20/mo if not.                                           | Pro $20/mo, which includes $20 of usage credit                                           |
| Neon                    | Free: 1 GB storage, 100 CU-hours a month per project    | Free only if it sleeps most of the day. Awake all month: Launch, about $19/mo (estimate) | Launch: $0.106 per CU-hour plus $0.35 per GB-month, no minimum                           |
| Better Auth             | $0                                                      | $0                                                                                       | $0                                                                                       |
| Clerk, if chosen        | Free: up to 50,000 monthly retained users per app       | Free                                                                                     | Free, or Pro at $25/mo ($20/mo billed yearly) for MFA and passkeys                       |
| Vercel Blob             | Hobby: 1 GB storage, 10 GB transfer, 2,000 advanced ops | Hobby limits, or Pro usage                                                               | Pro: storage and operations billed by usage. Transfer falls under Pro's flat-rate CDN    |
| Email (Resend)          | Free: 3,000 emails a month, 100 a day                   | Free, while sign-ups stay under 100 a day                                                | Pro $20/mo for 50,000 a month                                                            |
| Stripe                  | Test mode, $0                                           | 2.9% + 30¢ per US card charge, no monthly fee                                            | Same                                                                                     |
| Sentry                  | Developer, $0: 1 user, 5,000 errors per month           | Developer, $0                                                                            | Team from $26/mo (billed yearly)                                                         |
| **Total, before usage** | **$0**                                                  | **$0 to about $40/mo, depending on Vercel's terms and Neon's hours**                     | **$20/mo plus Neon usage, plus Resend Pro, Clerk Pro, and Sentry Team if you need them** |

Pro's flat-rate CDN, once you turn it on in billing, covers 1 TB of transfer a month, including Blob downloads. Apps where media or file downloads are most of the bandwidth don't qualify.

The cliffs, in the order I'd expect to hit them:

- **Neon Free's 100 CU-hours run out if the database never sleeps.** Every branch's compute counts toward it. Neon suspends a database after 5 idle minutes, which keeps a quiet app well inside, unless something queries every few minutes: a health check that hits the database, a polling cron, a dashboard left open. The smallest compute (0.25 CU) awake all month uses about 182 CU-hours and runs out around day 17. Then Neon suspends compute until the next billing period, and every query fails. On Launch, that compute comes to about $19 a month by my math (182.5 × $0.106), plus storage.
- **Vercel Hobby is non-commercial only.** Taking payments, showing ads, or getting paid to build the site all count as commercial. Hobby also can't pay for overages: go over a limit and that feature stops until 30 days have passed.
- **Vercel Hobby cron runs once a day,** anywhere within the hour you set. A more frequent schedule fails the deploy.
- **Vercel Blob Hobby allows 2,000 advanced operations a month.** Every `put()`, `copy()`, and `list()` counts, and so does browsing the store in the dashboard. That's about 66 uploads a day. Go over and Blob is unavailable until 30 days have passed.
- **Resend Free sends 100 emails a day.** A good launch day can use that up, and verification emails fail until the quota resets.
- **Neon Free keeps 6 hours of restore history.** Once it's real users' data, that's the first upgrade I'd make ([when production breaks](../guides/when-production-breaks.md)).
- **Vercel Pro alerts on spend; it doesn't stop it** unless you set an action. See [performance and cost](../guides/performance-and-cost.md).

## What's deliberately missing

No separate API, queue, Redis, microservices, Kubernetes, or staging environment. Each is a real tool with a real job, a bill, and a new way to fail. [Simple first](../guides/simple-first.md) lists what earns each one.

## Getting it running

1. [shape-project](../../skills/shape-project/SKILL.md), then [start-project](../../skills/start-project/SKILL.md).
2. [Local first, then managed services](../guides/local-first-then-managed.md) for the laptop setup and the order to add services.
3. [Shipping changes you can undo](../guides/shipping-changes-you-can-undo.md) for CI, previews, migrations, and rollback.
4. [Knowing it broke](../guides/knowing-it-broke.md) for Sentry, a health check, and uptime.

## What the vibe-coded version misses

- **A new database client per request.** Nothing gets reused, so under load the database runs out of connections, and the ones left open leak when the instance suspends.
- **No idea where the free tier ends.** The database goes dark on day 17, or uploads stop for a month, and you find out from users.
- **Calling `list()` to render a gallery.** Every page view spends an advanced operation. Store each file's URL in Postgres and query that.
- **Better Auth's in-memory rate limiter on serverless.** Each instance counts on its own, so a credential-stuffing run can stay under the limit everywhere.

## What I'd do

This stack, with nothing added until something real asks for it. Upgrades come one at a time, each for a reason I can name:

- Vercel Pro the day it makes money, needs cron more than once a day, or gets anywhere near 2,000 uploads a month.
- Neon Launch the day real users' data matters, or the database has to stay awake.
- Sentry Team when 5,000 errors a month isn't enough, which usually means I should fix the noisy bug first.
- Better Auth over Clerk Pro if I need MFA or passkeys.

Before each upgrade, I'd know how I'd leave: `pg_dump` exports Postgres, Blob files are plain objects, and Drizzle doesn't care who hosts the database.

## Sources

Checked 2026-10-06.

- [Vercel pricing](https://vercel.com/pricing), [Hobby plan](https://vercel.com/docs/plans/hobby), and [Pro plan](https://vercel.com/docs/plans/pro-plan)
- [Vercel fair use guidelines (commercial usage)](https://vercel.com/docs/limits/fair-use-guidelines)
- [Vercel Cron Jobs usage and pricing (Hobby: once a day)](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel Blob pricing (advanced operations, Hobby limits)](https://vercel.com/docs/vercel-blob/usage-and-pricing) and [Flat Rate CDN](https://vercel.com/docs/pricing/flat-rate-cdn)
- [Vercel: `attachDatabasePool`](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package) and [connection pooling with functions](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [Drizzle: Get started with PostgreSQL (node-postgres)](https://orm.drizzle.team/docs/get-started-postgresql)
- [Neon pricing](https://neon.com/pricing), [plans (CU-hours, suspension, branches)](https://neon.com/docs/introduction/plans), and [connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Clerk: How Clerk works (session tokens)](https://clerk.com/docs/guides/how-clerk-works/overview) and [pricing](https://clerk.com/pricing)
- [Better Auth: Rate limit](https://www.better-auth.com/docs/concepts/rate-limit)
- [Supabase pricing (free project pausing)](https://supabase.com/pricing)
- [Resend pricing](https://resend.com/pricing)
- [Stripe pricing](https://stripe.com/pricing) and [Stripe CLI](https://docs.stripe.com/stripe-cli/use-cli)
- [Sentry pricing](https://sentry.io/pricing/)
- [Tommy's defaults](../../profile/defaults.md)
