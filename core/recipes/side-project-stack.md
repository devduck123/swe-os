---
title: The side-project stack
description: A full-stack web app on managed services that one person can ship this weekend, run for free, and grow without a rewrite.
domain: architecture
stage: design
freshness: fast-moving
status: draft
reviewed: 2026-10-06
track: 22
concerns: [deployment, cost, security, data]
prev:
  link: /guides/learning-with-agents/
  label: 'Track 21: Learning while agents write the code'
---

This is the stack I'd use to build a real web app alone: one Next.js app on Vercel, Postgres on Neon through Drizzle, hosted auth, file storage, and error tracking. Every piece is managed, so there's no server to patch. Every piece has a free tier, so it costs nothing until people show up. And every piece can grow a long way before you'd want to replace it.

It's also where the track comes together. Each stop taught one idea. This page shows where each idea lives in an app you can ship this weekend.

## The whole thing on one page

```text
                      Browser
                         |
                         | HTTPS
                         v
   +---------------- Vercel ----------------+
   |  One Next.js app (TypeScript)          |
   |  pages, server actions, route handlers | --- errors ---> Sentry
   |  Zod at every boundary                 |
   +----+---------------+---------------+---+
        |               |               |
        | SQL           | sessions      | uploads
        | (Drizzle,     |               |
        |  pooled URL)  |               |
        v               v               v
   Neon Postgres    Better Auth     Vercel Blob
                    (tables in Neon)
                    or Clerk
```

What moves along each arrow:

- **Browser to Vercel:** page requests and form submissions. Vercel serves static parts from its CDN and runs the rest as functions. [How a request travels](../guides/how-a-request-travels.md) follows one end to end.
- **App to Neon:** SQL queries, written in TypeScript with Drizzle, over Neon's pooled connection string.
- **App to auth:** "who is this?" on every request that needs a user. With Better Auth, that's a session lookup in your own Postgres. With Clerk, it's a token check against Clerk.
- **App to Blob:** uploaded files go to storage, and only the file's URL and owner go into Postgres.
- **App to Sentry:** exceptions from the server and the browser, tagged with the release.

## Why each piece is here

**Next.js on Vercel.** One app holds the UI, the server code, and the API routes, so there's one repo, one deploy, and one place to look. Vercel builds every PR into a preview and every merge to main into production, with instant rollback. If the app were mostly client-side and URL-driven, I'd look at TanStack Start instead.

**Postgres on Neon, through Drizzle.** Postgres gives you constraints, transactions, and indexes, which do the remembering your code forgets ([data that stays correct](../guides/data-that-stays-correct.md)). Neon scales to zero when idle and can branch the database per preview. Drizzle keeps the schema in TypeScript and generates migrations as plain SQL you can read. If I wanted auth, storage, and realtime from the same vendor, I'd pick Supabase instead.

**Better Auth or Clerk.** Never hand-roll auth. Better Auth is a free, open-source library that keeps users in your own Postgres. Clerk is hosted, with ready-made sign-in UI, and is faster to start. Clerk's free plan has no MFA or passkeys, so if I need those I'd pick Better Auth, not Clerk Pro. Either way, every query still checks that the user owns the row ([trust boundaries](../guides/trust-boundaries.md)).

**Vercel Blob.** Files don't belong in the database. Blob stores them, serves them from a CDN, and lets the browser upload directly so big files don't pass through your function. On Supabase, I'd use Supabase Storage. Once egress costs matter, I'd look at Cloudflare R2.

**Sentry.** It tells you something broke before a user does, with a stack trace and the deploy that caused it ([knowing it broke](../guides/knowing-it-broke.md)). If I also wanted product analytics, PostHog covers both.

**Zod.** Everything crossing a boundary gets parsed: form input, route params, webhook bodies, env vars at startup, and AI output. One schema gives you the runtime check and the TypeScript type.

**shadcn/ui with Tailwind.** Accessible components copied into your repo, so you own and can change them. Agents are good with it. It handles the keyboard and screen-reader basics, and you still check the rest ([accessibility in practice](../guides/accessibility-in-practice.md)).

## What it costs

Prices and limits from each provider's pricing page, checked 2026-10-06. "Monthly users" is a rough stand-in for usage. A thousand users who upload videos cost more than ten thousand who read text, so check your own usage dashboards before trusting any column.

| Piece                   | 0 users (building)                                                       | ~1,000 monthly users                           | ~10,000 monthly users                                                                                            |
| ----------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Vercel                  | Hobby, $0                                                                | Hobby $0 if non-commercial. Pro $20/mo if not. | Pro $20/mo, which includes $20 of usage credit. Usage past that is billed on demand: check pricing.              |
| Neon                    | Free, $0: 1 GB storage and 100 CU-hours of compute per project per month | Free, if compute stays under 100 CU-hours      | Launch: $0.106 per CU-hour plus $0.35 per GB-month, no minimum. The total depends on hours awake: check pricing. |
| Better Auth             | $0 (open source, runs in your app)                                       | $0                                             | $0                                                                                                               |
| Clerk, if chosen        | Free: up to 50,000 monthly retained users per app                        | Free                                           | Free, or Pro at $25/mo ($20/mo billed yearly) for MFA and passkeys                                               |
| Vercel Blob             | Hobby: 1 GB storage, 10 GB transfer per month                            | Hobby limits, or Pro usage                     | Pro: $0.023 per GB-month of storage. Transfer is priced by region: check pricing.                                |
| Sentry                  | Developer, $0: 1 user, 5,000 errors per month                            | Developer, $0                                  | Team from $26/mo (billed yearly), once errors pass 5,000 a month or you add a teammate                           |
| Domain                  | Not needed yet                                                           | Check pricing                                  | Check pricing                                                                                                    |
| **Total, before usage** | **$0**                                                                   | **$0 non-commercial, $20/mo commercial**       | **$20/mo, plus Neon usage, plus $25 for Clerk Pro and $26 for Sentry Team if you need them**                     |

The cliffs worth knowing before you hit them:

- **Vercel Hobby is non-commercial only.** Taking payments, showing ads, or getting paid to build or host the site all count as commercial, and those belong on Pro. Donations don't count. Hobby also has no option to pay for overages. Go over a limit and that feature stops until 30 days have passed.
- **Neon's free restore window is 6 hours.** Fine while it's your data. Once it's real users' data, a paid plan's multi-day window is the upgrade I'd make first ([when production breaks](../guides/when-production-breaks.md)).
- **Neon's compute meter runs while the database is awake.** Scale-to-zero after 5 idle minutes keeps a quiet app cheap. Anything that queries it every few minutes, like an uptime check, keeps it awake all month.
- **Vercel Pro notifies you about spend; it doesn't stop it.** By default the alert comes at $200 a month. Set your own amount and decide what happens when you hit it, like pausing the project. The [cost concern](../concerns/cost.md) has the checklist.

## What's deliberately missing

Each of these is a real tool with a real job. None is free to run, and each adds a place for things to break. Add one when its trigger happens, not because you might need it ([simple first](../guides/simple-first.md)).

- **A separate API service.** Add it when a second client needs a backend that the Next.js app can't serve, or the backend needs another language or long-running processes. A mobile app can call Next.js route handlers just fine.
- **A queue and background workers.** Add them when work can outlast a function's max duration (5 minutes on Hobby), must retry on its own schedule, or shouldn't make the user wait. For scheduled work, Vercel Cron comes first. See [background jobs and webhooks](../guides/background-jobs-and-webhooks.md).
- **A cache like Redis.** Add it when you've measured a slow read that an index or query fix can't solve, or you need rate limits shared across function instances ([performance and cost](../guides/performance-and-cost.md)).
- **Microservices.** Add them when separate teams need to deploy separately. One person is not separate teams.
- **Kubernetes.** Add it when you run your own containers at a scale that needs a platform team. Not in this recipe.
- **A staging environment.** Previews with their own Neon branch cover most of what staging does. Add one when a third party needs a fixed, long-lived URL, or you need to rehearse a migration on production-sized data.

## Getting it running

1. **Shape it, then start it.** Run [shape-project](../../skills/shape-project/SKILL.md) to get a first slice ([shape before you build](../guides/shape-before-you-build.md)). Then run [start-project](../../skills/start-project/SKILL.md). It scaffolds the app with the official CLI, writes `AGENTS.md` and `.env.example`, adds a secret scan, one `check` script, and CI.
2. **Run it locally.** Point `DATABASE_URL` at local Postgres or a Neon development branch, run the Drizzle migrations, seed some data, and `npm run dev`. Add auth, then storage, one at a time as features need them ([local first, then managed services](../guides/local-first-then-managed.md)).
3. **Get the first preview.** Connect the repo to Vercel and install Neon's Vercel integration, so each preview gets its own database branch. Turn on branch protection for main. Open a PR and click through the preview.
4. **Go to production.** Set production env vars with their own keys, never shared with previews ([secrets and safety](../guides/secrets-and-agent-safety.md)). Add Sentry, a health check, and an uptime monitor. Merge, smoke test the real URL, and know where the rollback button is ([shipping changes you can undo](../guides/shipping-changes-you-can-undo.md)).

## What the vibe-coded version misses

- **Ten services on day one.** A queue, Redis, a separate API, and three SaaS dashboards before the first user. Each one is a bill, a set of keys, and a new way to fail.
- **No idea what it costs at 1,000 users.** The free tier ends on a Friday night and the app stops, or the bill shows up a month later.
- **A paid product on Vercel Hobby.** It breaks the terms, and when a limit hits, there's no option to pay your way out.
- **Production deployed from a laptop.** No CI, no record of what shipped, nothing to roll back to.
- **No connection pooling.** Every serverless function opens its own database connection, and under load you run out. Use Neon's pooled connection string in the app.
- **Previews on the production database.** A test click on a branch edits real data.
- **Real users' data on a 6-hour restore window.** Someone notices the bad deletion on Monday, and Friday's data is gone.
- **No error tracking.** Users find the bugs first, and most leave without telling you.

## What I'd do

This stack, exactly, with nothing added until something real asks for it. The upgrades happen one at a time, each for a reason I can name:

- Vercel Pro the day it makes money.
- A paid Neon plan the day real users' data matters.
- Sentry Team when 5,000 errors a month isn't enough, which usually means I should fix the noisy bug first.
- Better Auth over Clerk Pro if I need MFA or passkeys.
- A queue, a cache, or staging only when its trigger above actually fires.

Before each upgrade, I'd know how I'd leave: Postgres exports with `pg_dump`, Blob files are plain objects, and Drizzle doesn't care who hosts the database. Whatever I add, I'd make sure I understand it myself instead of trusting that the agent got it working ([learning with agents](../guides/learning-with-agents.md)).

## What changes at scale

- **Paid tiers everywhere,** and usage-based bills become the main cost to watch.
- **The first missing piece usually arrives as a queue,** once background work outgrows functions.
- **Database load shows up before anything else.** Read replicas and query tuning come before a cache.
- **A second engineer changes more than traffic does.** Reviews, staging, and on-call matter sooner than microservices.

## Sources

Checked 2026-10-06.

- [Vercel pricing](https://vercel.com/pricing) and [Hobby plan](https://vercel.com/docs/plans/hobby)
- [Vercel fair use guidelines (commercial usage)](https://vercel.com/docs/limits/fair-use-guidelines)
- [Vercel Pro plan (credit, spend notifications)](https://vercel.com/docs/plans/pro-plan)
- [Vercel Blob pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Neon pricing](https://neon.com/pricing) and [plans](https://neon.com/docs/introduction/plans)
- [Neon-managed Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration)
- [Clerk pricing](https://clerk.com/pricing)
- [Better Auth pricing](https://www.better-auth.com/pricing)
- [Sentry pricing](https://sentry.io/pricing/)
- [Tommy's defaults](../../profile/defaults.md)
