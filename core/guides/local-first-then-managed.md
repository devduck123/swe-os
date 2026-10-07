---
title: Local first, then managed services
description: Start on your laptop with fast feedback, add hosted services one at a time on free tiers as features need them, and know when it's time to pay.
domain: infrastructure
stage: ship
freshness: evolving
status: draft
reviewed: 2026-10-06
track: 15
concerns: [deployment, cost, data, security]
---

Build on your laptop, where a change shows up in a second and nothing costs money. Add a hosted service only when a feature needs it, one at a time, on its free tier. Pay when something real forces you to.

Every service you add is another account, another set of keys, another environment to keep in sync, and another pricing cliff. Adding them in order, as features ask for them, keeps each one cheap to understand and cheap to undo.

## Your laptop is the fastest feedback loop you'll ever have

Say you're building a habit tracker. On day one, you need a page, a database, and some fake habits to look at. You don't need auth, email, file uploads, or payments yet, because no feature uses them.

So day one is Next.js and Postgres on your machine, with a seed script that fills in a few users and a month of check-ins. The app opens with real-looking data, so you're building against something that looks like production instead of an empty screen. Week two adds sign-in. Week four adds reminder emails. Payments come when someone wants to pay.

## A fresh clone should run without calling you

The test of a good local setup is that a fresh clone runs on another machine, or in an agent's sandbox, from the README alone. Five things make that true:

- **A pinned runtime.** `.nvmrc` says which Node to use.
- **A committed lockfile,** installed with `npm ci`, so every machine gets the same versions.
- **A `.env.example`** listing every variable with no values. See [secrets and agent safety](secrets-and-agent-safety.md#secrets-live-in-exactly-two-places).
- **Seed data,** so a new database isn't an empty, broken-looking app.
- **One `check` script** that runs format, lint, types, and tests, the same one CI runs.

```json
{
  "scripts": {
    "setup": "npm ci && docker compose up -d db && npm run db:migrate && npm run db:seed",
    "dev": "next dev",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx scripts/seed.ts",
    "check": "prettier --check . && eslint . && tsc --noEmit && vitest run"
  }
}
```

Agents benefit from this more than people do. An agent that can run `npm run setup` and `npm run check` can verify its own work. An agent that has to ask you for a database URL can't.

## Add services in the order features need them

Each service in this order leans on the ones before it:

1. **Database.** Everything else stores something.
2. **Auth.** Users are rows in the database.
3. **File storage.** Uploads need a record that points to them, and an owner.
4. **Email.** Mostly sent about users and their stuff.
5. **Error tracking.** Matters once someone other than you is using it.
6. **Payments.** Last, because money brings webhooks, refunds, taxes, and the most ways to be wrong.

For each one, there's a local stand-in and a managed free tier. Here's what I'd use:

| Service  | Local stand-in                                | Managed free tier               | Check before you sign up                                 |
| -------- | --------------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| Database | Postgres in Docker, or `supabase start`       | Neon or Supabase                | Supabase Free pauses idle projects. Neon scales to zero. |
| Auth     | Better Auth on your local Postgres            | Better Auth on Neon, or Clerk   | Clerk's free tier has no MFA or passkeys                 |
| Files    | A local folder, or Supabase Storage locally   | Vercel Blob or Supabase Storage | Egress pricing, if files get downloaded a lot            |
| Email    | Mailpit, or log the email to the console      | A transactional email provider  | Domain verification and daily sending caps               |
| Errors   | Off locally, since the console is right there | Sentry                          | The monthly event quota, and what happens past it        |
| Payments | Stripe test mode with the Stripe CLI          | Stripe test mode, then live     | Per-transaction fees start when you charge real cards    |

A few of these need a word:

- **Supabase local** runs the whole Supabase stack, including Studio and a Mailpit inbox, in containers, so it needs Docker or a compatible runtime like OrbStack.
- **Neon has no local emulator,** but Neon Local is a Docker proxy that creates a throwaway branch of your cloud database when the container starts and deletes it when the container stops. Plain Postgres in Docker works too, since Drizzle doesn't care where Postgres lives.
- **Better Auth** stores users in your own database, so the local and deployed setups run the same code. Clerk gives you separate development and production instances with their own keys.
- **Stripe webhooks** reach your laptop through `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, which prints the signing secret to put in `.env`.

## Dev, preview, and prod are three environments with three sets of keys

Each environment gets its own data and its own credentials. On Vercel, every environment variable is scoped to Development, Preview, or Production, and every PR gets a preview deploy.

Previews need a database, and this is where branching earns its keep. A Neon branch is a copy-on-write clone, so creating one is instant and only the changes take up space. Neon's Vercel integration can create a branch for each preview deployment. On Supabase, preview branches start with no data unless you seed them, and branch usage is billed by the hour outside the spend cap.

Never point a preview at production data. Preview code hasn't been reviewed, preview URLs get shared, and if your build runs migrations, a preview runs them against whatever database it's given. One catch: a Neon branch copies its parent's data. If you branch previews off production once real users exist, every preview holds their personal data. Branch previews from a seeded dev branch instead.

## Read the pricing cliff before you sign up

A free tier has rules, and the one that hurts is usually not the obvious limit. [Defaults](../../profile/defaults.md#cliffs-worth-knowing) keeps the current list. The ones that catch side projects:

- **Vercel Hobby** is non-commercial only. Go over a limit and that feature stops until the month resets, with no option to pay.
- **Supabase Free** pauses a project after a week without activity, which is how a demo database goes dark the day before the demo.
- **Neon Free** allows 10 branches per project and scales compute to zero after five minutes idle, so the first query after a quiet spell is slower.
- **Clerk Hobby** has no MFA or passkeys.

Turn on billing alerts or a spend cap wherever a provider offers one, and write down which service you'd hit first. The [cost](../concerns/cost.md) concern has the rest.

## Upgrade when something real forces it

Pay for a tier when you can name the reason:

- **You take money.** A project that makes even a little revenue has outgrown Vercel Hobby's terms.
- **You hit a limit** that the dashboard shows, not one you're imagining.
- **Users need a feature** the free tier doesn't have, like MFA.
- **Downtime would hurt real people.** A paused database is fine for a toy and not for someone's habit streak.
- **You need a longer restore window.** Neon's default restore history is 6 hours on Free and 1 day on paid plans.

Upgrade one piece at a time, and know how you'd get your data out first. Postgres is the safe bet here: `pg_dump` works the same on Neon, Supabase, or your laptop.

## What the vibe-coded version misses

- **It only runs on the author's laptop.** A global tool, an untracked `.env`, and an unpinned Node version mean nobody else can run it, including your next agent.
- **Developing against the production database.** One bad migration or test script and real users lose data.
- **No seed data.** Every new environment, preview, and teammate starts with an empty, broken-looking app.
- **Eight services on day one.** Eight dashboards, eight sets of keys, and eight cliffs for an app with no users.
- **A preview pointed at prod.** Unreviewed code with write access to real data, behind a URL anyone can be sent.
- **The paused database.** Supabase Free went to sleep the week before the demo.
- **A side project making $5 on Vercel Hobby.** It breaks the plan's terms.
- **One set of keys everywhere.** A leak anywhere is a leak in production.

## What I'd do

Laptop first: Next.js, Postgres in Docker, Drizzle, a seed script, and a `check` script. [start-project](../../skills/start-project/SKILL.md) sets up that half. Then I connect Vercel for previews and add Neon with the Vercel integration, branching previews from a seeded dev branch. After that, each managed service arrives with the feature that needs it, in the order above. [The side-project stack](../recipes/side-project-stack.md) puts the whole thing together.

I'd pick Supabase instead of Neon when I want its auth and storage too, and I'd run `supabase start` locally to match. I'd upgrade the moment the project takes money, or when a limit shows up in a dashboard, and not before.

## What changes at scale

- **Infrastructure as code,** so environments are defined in files and reviewed in PRs instead of clicked together.
- **A staging environment** with production-like, anonymized data, for changes a preview can't prove, like migrations on real volumes.
- **Migration pipelines** that run schema changes as their own step. See [database changes without downtime](database-changes-without-downtime.md).
- **Negotiated contracts** replace self-serve tiers, and the cliff becomes a line item someone owns.

## Sources

- [Supabase: Local development with the CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase: Branching](https://supabase.com/docs/guides/deployment/branching) and [branching usage and billing](https://supabase.com/docs/guides/platform/manage-your-usage/branching)
- [Neon: Branching](https://neon.com/docs/introduction/branching), [Neon Local](https://neon.com/docs/local/neon-local), and [plans](https://neon.com/docs/introduction/plans)
- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)
- [Clerk: Managing environments](https://clerk.com/docs/guides/development/managing-environments)
- [Stripe CLI reference](https://docs.stripe.com/stripe-cli/use-cli)
- Vercel, Supabase, and Clerk free-tier limits: see the sources in [defaults](../../profile/defaults.md#sources)
