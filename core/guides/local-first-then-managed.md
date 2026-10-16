---
title: Local first, then managed services
description: Start on your laptop with fast feedback, then add hosted services one at a time on free tiers as features need them.
domain: infrastructure
stage: build
freshness: evolving
status: reviewed
reviewed: 2026-10-06
track: 8
concerns: [deployment, cost, data, security]
---

This is day-one setup. Build on your laptop, where a change shows up in a second and nothing costs money. Add a hosted service only when a feature needs it, one at a time, on its free tier.

Every service you add is another account, another set of keys, and another pricing cliff. Adding them only as features ask keeps each one cheap to understand and to undo.

## Your laptop is the fastest feedback loop you'll ever have

Say you're building a habit tracker. On day one, you need a page, a database, and some fake habits to look at. You don't need auth, email, file uploads, or payments yet, because no feature uses them.

So day one is Next.js and Postgres on your machine, plus a seed script that fills in a few users and a month of check-ins. Week two adds sign-in. Week four adds reminder emails. Payments come when someone wants to pay.

## A fresh clone should run without calling you

A good setup lets a fresh clone run anywhere, including an agent's sandbox, from the README alone. Five things make that true:

- **A pinned runtime.** `.nvmrc` says which Node to use.
- **A committed lockfile.** `package-lock.json` records the exact version of every package, and `npm ci` installs exactly those.
- **A `.env.example`** listing every variable with no values. See [secrets and agent safety](secrets-and-agent-safety.md#secrets-live-in-exactly-two-places).
- **Seed data,** fake records a script loads, so a new database isn't an empty, broken-looking app.
- **One `check` script** that runs format, lint, types, and tests, the same one CI (the checks that run on every push) runs.

Postgres itself takes one line. Install Docker Desktop (or OrbStack on a Mac), which runs packaged apps called containers. Then run:

```bash
# -e sets the password, -p opens port 5432 on your laptop,
# -d runs it in the background, postgres:18 is the image to run.
docker run --name db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18
```

Your `DATABASE_URL` is then `postgresql://postgres:postgres@localhost:5432/postgres`. On Supabase, run `npx supabase init` once, then `npx supabase start`, which runs the database, auth, and storage locally and prints the URL and keys.

Your tables come from migrations: SQL files applied in order, each recorded so it runs once:

```sql
-- migrations/0001_create_habits.sql
CREATE TABLE habits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Then `package.json` does the rest. Notice `setup`: one command takes a fresh clone to a running app with data.

```json
{
  "scripts": {
    "setup": "npm ci && npm run db:migrate && npm run db:seed",
    "dev": "next dev",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx scripts/seed.ts",
    "check": "prettier --check . && eslint . && tsc --noEmit && vitest run"
  }
}
```

`db:migrate` runs your migration tool, like `drizzle-kit migrate` or `prisma migrate deploy`. On Supabase, migrations live in `supabase/migrations`, and `npx supabase db reset` rebuilds the local database from them and `supabase/seed.sql`.

Agents gain the most from this. One that can run `npm run setup` and `npm run check` can verify its own work. One that has to ask you for a database URL can't.

<details>
<summary>Going deeper: starting the database from the setup script</summary>

To make `setup` start Postgres too, define it in `compose.yaml` with a healthcheck, and begin `setup` with `docker compose up --wait db`. `--wait` blocks until the healthcheck (`pg_isready`) passes, so migrations don't race Postgres's startup.

```yaml
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_PASSWORD: postgres
    ports: ['5432:5432']
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'postgres']
      interval: 2s
```

</details>

## Add services in the order features need them

Each service leans on the ones before it:

1. **Database.** Everything else stores something.
2. **Auth.** Users are rows in the database.
3. **File storage.** Uploads need an owner and a record that points to them.
4. **Email.** Mostly sent about users and their stuff.
5. **Error tracking.** Matters once someone other than you is using it.
6. **Payments.** Last, because money brings webhooks, refunds, taxes, and the most ways to be wrong.

Each has a local stand-in and a free tier:

| Service  | Local stand-in                              | Managed free tier               |
| -------- | ------------------------------------------- | ------------------------------- |
| Database | Postgres in Docker, or `supabase start`     | Neon or Supabase                |
| Auth     | Better Auth on your local Postgres          | Better Auth on Neon, or Clerk   |
| Files    | A local folder, or Supabase Storage locally | Vercel Blob or Supabase Storage |
| Email    | Mailpit (a fake inbox), or the console      | A transactional email provider  |
| Errors   | Off, since the console is right there       | Sentry                          |
| Payments | Stripe test mode with the Stripe CLI        | Stripe test mode, then live     |

Stripe webhooks reach your laptop through `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, which prints the signing secret to put in `.env`.

## Dev, preview, and prod get separate data and separate keys

On Vercel, every environment variable is scoped to Development, Preview, or Production, so each gets its own keys. Every PR gets a preview deploy, its own URL running that PR's code, which needs a database. Neon's Vercel integration creates a branch, a throwaway copy of your database, for each preview. Turn on its cleanup of old branches, or you'll hit the Free plan's branch limit.

Never point a preview at production data. Preview code hasn't been reviewed, preview URLs get shared, and a build that runs migrations runs them against whatever database it's given.

Neon has a quieter version: a branch copies its parent's data, and the integration branches from production. Once you have users, every preview holds their personal data. Supabase preview branches start empty, and a seed file fills them.

<details>
<summary>Going deeper: branching Neon previews from seed data</summary>

Keep a Neon branch called `dev` that holds only seed data. Then create preview branches in CI (the checks GitHub runs on every push) with Neon's create-branch GitHub Action, setting `parent_branch: dev`, instead of through the Vercel integration.

</details>

Free tiers have cliffs, and the one that hurts is rarely the obvious limit. Read [the side-project stack's cliffs](../recipes/side-project-stack.md#what-it-costs) before you sign up, and upgrade when it lists a reason you can name.

## What I'd do

- **Laptop first.** Postgres in Docker, then ask your agent: "Set up this repo with [start-project](../../skills/start-project/SKILL.md)." It adds the pinned runtime, `.env.example`, seed data, and `check` script.
- **Then previews.** Connect the repo to Vercel and add Neon's Vercel integration. Once real users arrive, move preview branching to CI, as the details above show.
- **Then one service per feature,** in the order above. [The side-project stack](../recipes/side-project-stack.md) puts the whole thing together.

I'd pick Supabase instead of Neon when I want its auth and storage too, and I'd run `npx supabase start` locally to match.

## Before you ship, check

Paste this to your agent before you merge:

- A fresh clone runs from the README and `npm run setup` alone.
- `.nvmrc`, the lockfile, `.env.example`, and seed data are committed.
- CI runs the same `check` script as my laptop.
- Nothing local or in previews connects to the production database.
- Development, Preview, and Production each have their own keys.
- Every hosted service is one a shipped feature needs.

## Sources

- [Supabase: Local development with the CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) and [seeding your database](https://supabase.com/docs/guides/local-development/seeding-your-database)
- [Docker Hub: Official `postgres` image](https://hub.docker.com/_/postgres)
- [Supabase: Branching](https://supabase.com/docs/guides/deployment/branching) and [branching usage and billing](https://supabase.com/docs/guides/platform/manage-your-usage/branching)
- [Neon: Branching](https://neon.com/docs/introduction/branching) and [plans (branch and compute limits)](https://neon.com/docs/introduction/plans)
- [Neon: Neon-managed Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration) and [default branch behavior](https://neon.com/docs/manage/branches)
- [Neon: Create branch GitHub Action (`parent_branch`)](https://github.com/neondatabase/create-branch-action)
- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)
- [Stripe CLI reference](https://docs.stripe.com/stripe-cli/use-cli)
- [Docker: `docker compose up --wait`](https://docs.docker.com/reference/cli/docker/compose/up/)
