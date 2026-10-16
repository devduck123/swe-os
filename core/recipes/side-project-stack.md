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

This is the stack I'd use to build a real web app alone: one Next.js app on Vercel, Postgres on Neon through Drizzle, auth, file storage, email, payments, and error tracking. Every piece is managed, starts free, and grows a long way before you'd want to replace it. You'll see why each one is here and exactly where its free tier ends, because those limits are abrupt.

## The whole thing on one page

Notice that every arrow starts or ends at the one app:

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
        | SQL     | session | uploads | send    | checkouts out,
        |         |         |         |         | webhooks in
        v         v         v         v         v
      Neon      Better    Vercel    Email     Stripe
    Postgres   Auth or     Blob    provider
                Clerk
```

Two arrows need a closer look:

- **Session:** "who is this?" on every request that needs a user. Better Auth looks the session up in your own Postgres. With Clerk, your server checks a short-lived signed token itself, without calling Clerk.
- **Stripe:** you create a Checkout session, and Stripe tells you it was paid through a signed webhook.

## Why each piece is here

**Next.js on Vercel.** One app holds the UI, the server code, and the API routes: one repo, one deploy, one place to look. Every PR gets a preview, and production gets instant rollback. If the app were mostly client-side and URL-driven, I'd look at TanStack Start instead.

**Postgres on Neon, through Drizzle.** Postgres's constraints (rules like "email is unique") and transactions (writes that all happen or none do) do the remembering your code forgets ([data that stays correct](../guides/data-that-stays-correct.md)). Neon sleeps when idle and gives each preview its own copy of the database. Drizzle keeps the schema in TypeScript and generates migrations, the SQL files that change your tables.

**Better Auth or Clerk.** Never hand-roll auth. Better Auth is a free library that keeps users in your own Postgres. Clerk is hosted, with ready-made sign-in UI, and is faster to start, but its free plan has no MFA or passkeys. Either way, every query still checks that the user owns the row ([trust boundaries](../guides/trust-boundaries.md)).

**Vercel Blob.** Files don't belong in the database. Blob stores them, serves them from servers near your users, and lets the browser upload directly. Postgres keeps only each file's URL and owner.

**A transactional email provider,** such as Resend or Postmark. Auth needs it from the first sign-up, for verification and password resets. Locally, log the email to the console.

**Stripe,** once someone wants to pay. Build the whole flow in test mode, and use `stripe listen` to forward webhooks to your laptop. Handle the webhook the way [background jobs and webhooks](../guides/background-jobs-and-webhooks.md) describes.

**Sentry.** It tells you something broke before a user does ([knowing it broke](../guides/knowing-it-broke.md)).

**Zod.** Everything crossing a boundary gets parsed: form input, route params, webhook bodies, env vars, and AI output.

**Already on Supabase?** Stay. It's the same Postgres, with auth and storage from one vendor: Supabase Auth replaces Better Auth, and Supabase Storage replaces Blob. The rest still applies, and its cliffs are below.

## Connect to the database once

Create the database client once, in `lib/db.ts`, and import it everywhere. Each client holds open connections, and Postgres allows only so many, so a client per request runs out under load. With supabase-js, queries go over HTTP, so there's nothing to set up.

<details>
<summary>Going deeper: the pool setup on Vercel and Neon</summary>

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

</details>

## Rate-limit auth in the database

Login, sign-up, and password reset need rate limits from day one ([trust boundaries](../guides/trust-boundaries.md)). Better Auth's limiter counts in memory by default, and on Vercel each running copy of your function keeps its own count. Store the counts in Postgres with one setting, then run Better Auth's migration to create the table:

```ts
export const auth = betterAuth({
  // ...
  rateLimit: { storage: 'database' },
});
```

On Supabase Auth, rate limits are built in. Adjust them under **Authentication > Rate Limits**.

## What it costs

Checked 2026-10-06, Supabase on 2026-10-15. Each line is the free tier, then the first paid step.

- **Vercel:** Hobby is $0, non-commercial only. Pro is $20/mo, which includes $20 of usage credit.
- **Neon:** Free gives 1 GB storage and 100 CU-hours of compute a month per project. A CU (compute unit) is about 4 GB of RAM plus CPU, and the smallest database is a quarter CU. Launch bills $0.106 per CU-hour plus $0.35 per GB-month, no minimum.
- **Supabase:** Free gives a 500 MB database, 1 GB of file storage, 5 GB of egress (data sent out), and 2 active projects. Pro is $25/mo for an 8 GB database and 7 days of backups, with $10 of compute credit included.
- **Better Auth:** $0.
- **Clerk:** Free up to 50,000 monthly retained users per app. Pro is $25/mo ($20/mo billed yearly) for MFA and passkeys.
- **Vercel Blob:** Hobby gives 1 GB storage, 10 GB transfer, and 2,000 advanced operations a month. Pro bills storage and operations by usage.
- **Email (Resend):** Free sends 3,000 a month, 100 a day. Pro is $20/mo for 50,000 a month.
- **Stripe:** $0 in test mode. Live, 2.9% + 30¢ per US card charge, no monthly fee.
- **Sentry:** Developer is $0 for 1 user and 5,000 errors. Team starts at $26/mo, billed yearly.

At 0 users, the stack is $0. Around 1,000 monthly users, it's $0 to about $40 a month (about $45 with Supabase Pro), depending on Vercel's terms and how long the database stays awake. Around 10,000, expect $20 a month plus database usage, plus any email, Clerk, or Sentry upgrades. Trust your own dashboards over these guesses.

The cliffs, in the order I'd expect to hit them:

- **Neon Free's compute runs out if the database never sleeps.** Neon suspends it after 5 idle minutes, which keeps a quiet app well inside. Something that queries every few minutes (a database health check, a polling cron, an open dashboard) keeps it awake, and the smallest database runs out around day 17. Then every query fails until next month.
- **Supabase Free pauses a project after a week of inactivity.** A quiet app can be down when someone finally visits.
- **Supabase Auth's built-in email sends 2 emails an hour.** Set up custom SMTP (your email provider's sending server) under Authentication in the Supabase dashboard before launch, or sign-up emails stop.
- **Vercel Hobby is non-commercial only.** Taking payments, showing ads, or getting paid to build the site all count as commercial. Hobby also can't pay for overages: go over a limit and that feature stops until 30 days have passed.
- **Vercel Hobby cron runs once a day,** anywhere within the hour you set. A more frequent schedule fails the deploy.
- **Vercel Blob Hobby allows 2,000 advanced operations a month.** Every `put()`, `copy()`, and `list()` counts, and so does browsing the store in the dashboard. That's about 66 uploads a day. Go over and Blob is unavailable until 30 days have passed.
- **Resend Free sends 100 emails a day.** A good launch day uses that up, and verification emails fail until it resets.
- **Supabase Free goes read-only at 500 MB.** Every write fails until you upgrade or delete data.
- **Free backups are thin.** Neon Free keeps 6 hours of history, and Supabase Free has none. Once it's real users' data, that's the first upgrade I'd make ([when production breaks](../guides/when-production-breaks.md)).
- **Spend caps differ.** Vercel Pro only alerts on spend unless you set an action ([performance and cost](../guides/performance-and-cost.md)). Supabase Pro's spend cap is on by default, so going over a quota stops that usage until the next billing cycle.

<details>
<summary>Going deeper: Neon compute math and Blob transfer on Pro</summary>

Every Neon branch's compute counts toward the 100 CU-hours. The smallest compute (0.25 CU) awake all month uses about 182 CU-hours, which is why it runs out around day 17. Then Neon suspends compute until the next billing period. On Launch, that always-awake compute comes to about $19 a month by my math (182.5 × $0.106), plus storage.

Blob transfer on Pro falls under Pro's flat-rate CDN. Once you turn it on in billing, it covers 1 TB of transfer a month, including Blob downloads. Apps where media or file downloads are most of the bandwidth don't qualify.

</details>

## What's deliberately missing

No separate API, queue, Redis, microservices, Kubernetes, or staging environment. Each is a real tool with a real job, a bill, and a new way to fail. [Simple first](../guides/simple-first.md) lists what earns each one.

## Getting it running

1. [shape-project](../../skills/shape-project/SKILL.md), then [start-project](../../skills/start-project/SKILL.md).
2. [Local first, then managed services](../guides/local-first-then-managed.md) for the laptop setup and the order to add services.
3. [Shipping changes you can undo](../guides/shipping-changes-you-can-undo.md) for CI, previews, migrations, and rollback.
4. [Knowing it broke](../guides/knowing-it-broke.md) for Sentry, a health check, and uptime.

## What the vibe-coded version misses

- **A new database client per request.** Under load, Postgres runs out of connections.
- **No idea where the free tier ends.** The database goes dark on day 17 or read-only at 500 MB, and you hear it from users.
- **Calling `list()` to render a gallery.** Every page view spends one of 2,000 monthly Blob operations.
- **An in-memory rate limiter on serverless.** Each copy counts alone, so password guessing stays under the limit.
- **Supabase's built-in auth email in production.** At 2 an hour, sign-ups stall on launch day.

## What I'd do

This stack, with nothing added until something real asks for it. Upgrades come one at a time, each for a reason I can name:

- Vercel Pro the day it makes money, needs cron more than once a day, or gets anywhere near 2,000 uploads a month.
- Neon Launch or Supabase Pro the day real users' data matters, or the database has to stay awake.
- Sentry Team when 5,000 errors a month isn't enough, which usually means I should fix the noisy bug first.
- Better Auth over Clerk Pro if I need MFA or passkeys.
- On Supabase, custom SMTP before the first real user.

Before each upgrade, I'd know how I'd leave: `pg_dump` exports Postgres, Blob files are plain objects, and Drizzle doesn't care who hosts the database.

## Sources

Checked 2026-10-06, Supabase on 2026-10-15.

- [Vercel pricing](https://vercel.com/pricing), [Hobby plan](https://vercel.com/docs/plans/hobby), and [Pro plan](https://vercel.com/docs/plans/pro-plan)
- [Vercel fair use guidelines (commercial usage)](https://vercel.com/docs/limits/fair-use-guidelines)
- [Vercel Cron Jobs usage and pricing (Hobby: once a day)](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel Blob pricing (advanced operations, Hobby limits)](https://vercel.com/docs/vercel-blob/usage-and-pricing) and [Flat Rate CDN](https://vercel.com/docs/pricing/flat-rate-cdn)
- [Vercel: `attachDatabasePool`](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package) and [connection pooling with functions](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [Drizzle: Get started with PostgreSQL (node-postgres)](https://orm.drizzle.team/docs/get-started-postgresql)
- [Neon pricing](https://neon.com/pricing), [plans (CU-hours, suspension, branches)](https://neon.com/docs/introduction/plans), and [connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Clerk: How Clerk works (session tokens)](https://clerk.com/docs/guides/how-clerk-works/overview) and [pricing](https://clerk.com/pricing)
- [Better Auth: Rate limit](https://www.better-auth.com/docs/concepts/rate-limit)
- [Supabase pricing (free tier, Pro, project pausing)](https://supabase.com/pricing), [database size (read-only mode)](https://supabase.com/docs/guides/platform/database-size), and [cost control (spend cap)](https://supabase.com/docs/guides/platform/cost-control)
- [Supabase: Auth rate limits (built-in email limit)](https://supabase.com/docs/guides/auth/rate-limits) and [connecting to Postgres (Data API)](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase: Database backups](https://supabase.com/docs/guides/platform/backups)
- [Resend pricing](https://resend.com/pricing)
- [Stripe pricing](https://stripe.com/pricing) and [Stripe CLI](https://docs.stripe.com/stripe-cli/use-cli)
- [Sentry pricing](https://sentry.io/pricing/)
- [Tommy's defaults](../../profile/defaults.md)
