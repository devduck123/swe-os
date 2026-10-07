---
title: Local first, then managed services
description: Start on your laptop with fast feedback, then add hosted services one at a time on free tiers as features need them.
domain: infrastructure
stage: build
freshness: evolving
status: draft
reviewed: 2026-10-06
track: 8
concerns: [deployment, cost, data, security]
---

This is day-one setup. Build on your laptop, where a change shows up in a second and nothing costs money. Add a hosted service only when a feature needs it, one at a time, on its free tier.

Every service you add is another account, another set of keys, another environment to keep in sync, and another pricing cliff. Adding them only as features ask keeps each one cheap to understand and to undo.

## Your laptop is the fastest feedback loop you'll ever have

Say you're building a habit tracker. On day one, you need a page, a database, and some fake habits to look at. You don't need auth, email, file uploads, or payments yet, because no feature uses them.

So day one is Next.js and Postgres on your machine, plus a seed script that fills in a few users and a month of check-ins. Week two adds sign-in. Week four adds reminder emails. Payments come when someone wants to pay.

## A fresh clone should run without calling you

A good local setup lets a fresh clone run on another machine, or in an agent's sandbox, from the README alone. Five things make that true:

- **A pinned runtime.** `.nvmrc` says which Node to use.
- **A committed lockfile,** installed with `npm ci`, so every machine gets the same versions.
- **A `.env.example`** listing every variable with no values. See [secrets and agent safety](secrets-and-agent-safety.md#secrets-live-in-exactly-two-places).
- **Seed data,** so a new database isn't an empty, broken-looking app.
- **One `check` script** that runs format, lint, types, and tests, the same one CI runs.

```json
{
  "scripts": {
    "setup": "npm ci && docker compose up --wait db && npm run db:migrate && npm run db:seed",
    "dev": "next dev",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx scripts/seed.ts",
    "check": "prettier --check . && eslint . && tsc --noEmit && vitest run"
  }
}
```

`--wait` blocks until the `db` healthcheck (`pg_isready`) passes, so migrations don't race Postgres's startup. Agents benefit from this setup more than people do. An agent that can run `npm run setup` and `npm run check` can verify its own work. An agent that has to ask you for a database URL can't.

## Add services in the order features need them

Each service leans on the ones before it:

1. **Database.** Everything else stores something.
2. **Auth.** Users are rows in the database.
3. **File storage.** Uploads need a record that points to them, and an owner.
4. **Email.** Mostly sent about users and their stuff.
5. **Error tracking.** Matters once someone other than you is using it.
6. **Payments.** Last, because money brings webhooks, refunds, taxes, and the most ways to be wrong.

Each one has a local stand-in and a managed free tier:

| Service  | Local stand-in                                | Managed free tier               |
| -------- | --------------------------------------------- | ------------------------------- |
| Database | Postgres in Docker, or `supabase start`       | Neon or Supabase                |
| Auth     | Better Auth on your local Postgres            | Better Auth on Neon, or Clerk   |
| Files    | A local folder, or Supabase Storage locally   | Vercel Blob or Supabase Storage |
| Email    | Mailpit, or log the email to the console      | A transactional email provider  |
| Errors   | Off locally, since the console is right there | Sentry                          |
| Payments | Stripe test mode with the Stripe CLI          | Stripe test mode, then live     |

Supabase local runs the whole stack in containers, so it needs Docker or a compatible runtime like OrbStack. And Stripe webhooks reach your laptop through `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, which prints the signing secret to put in `.env`.

## Dev, preview, and prod get separate data and separate keys

On Vercel, every environment variable is scoped to Development, Preview, or Production, and every PR gets a preview deploy. Previews need a database, which is where branching earns its keep. A Neon branch is a copy-on-write clone: it shares its parent's data and stores only what changes, so creating one is instant. Neon's Vercel integration creates a branch for each preview deployment. Two limits on Neon Free shape this: a project gets 10 branches, and every branch's compute counts toward the project's 100 CU-hours a month. Turn on the integration's cleanup of old preview branches, or you'll hit the branch limit. On Supabase, preview branches start with no data unless you seed them, and branch usage is billed by the hour outside the spend cap.

Never point a preview at production data. Preview code hasn't been reviewed, preview URLs get shared, and if your build runs migrations, a preview runs them against whatever database it's given. The quieter version of the same mistake: a branch copies its parent's data, and the integration always branches from the project's default branch, usually production. Once you have real users, previews hold their personal data, so branch previews in CI from a seeded dev branch instead. Neon's GitHub Action takes a `parent_branch`.

Free tiers have cliffs, and the one that hurts is rarely the obvious limit. Read [the side-project stack's cliffs](../recipes/side-project-stack.md#what-it-costs) before you sign up, and upgrade when it lists a reason you can name.

## What the vibe-coded version misses

- **It only runs on the author's laptop.** A global tool, an untracked `.env`, and an unpinned Node version mean nobody else can run it, including your next agent.
- **Developing against the production database.** One bad migration or test script and real users lose data.
- **No seed data.** Every new environment, preview, and teammate starts with an empty, broken-looking app, so bugs that only show with real-looking data ship.
- **Eight services on day one.** Eight dashboards, eight sets of keys, and eight cliffs for an app with no users.
- **A preview pointed at prod.** Unreviewed code with write access to real data, behind a URL anyone can be sent.
- **One set of keys everywhere.** A leak from a preview or a laptop is a leak in production.

## What I'd do

Laptop first: Next.js, Postgres in Docker, Drizzle, a seed script, and a `check` script. [start-project](../../skills/start-project/SKILL.md) sets up that half. Then Vercel for previews and Neon through its Vercel integration, moving preview branching to CI once real users arrive. After that, each managed service arrives with the feature that needs it, in the order above. [The side-project stack](../recipes/side-project-stack.md) puts the whole thing together.

I'd pick Supabase instead of Neon when I want its auth and storage too, and I'd run `supabase start` locally to match.

## Sources

- [Supabase: Local development with the CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase: Branching](https://supabase.com/docs/guides/deployment/branching) and [branching usage and billing](https://supabase.com/docs/guides/platform/manage-your-usage/branching)
- [Neon: Branching](https://neon.com/docs/introduction/branching) and [plans (branch and compute limits)](https://neon.com/docs/introduction/plans)
- [Neon: Neon-managed Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration) and [default branch behavior](https://neon.com/docs/manage/branches)
- [Neon: Create branch GitHub Action (`parent_branch`)](https://github.com/neondatabase/create-branch-action)
- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)
- [Stripe CLI reference](https://docs.stripe.com/stripe-cli/use-cli)
- [Docker: `docker compose up --wait`](https://docs.docker.com/reference/cli/docker/compose/up/)
