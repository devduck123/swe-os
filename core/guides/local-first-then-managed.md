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

Five things let a fresh clone run from the README alone, even in an agent's sandbox:

- **A pinned runtime.** `.nvmrc` says which Node to use.
- **A committed lockfile.** `package-lock.json` records the exact version of every package, and `npm ci` installs exactly those.
- **A `.env.example`** listing every variable with no values. See [secrets and agent safety](secrets-and-agent-safety.md#secrets-live-in-exactly-two-places).
- **Seed data,** fake records a script loads, so a new database isn't an empty, broken-looking app.
- **One `check` script** that runs format, lint, types, and tests, the same one CI (the checks that run on every push) runs.

Next, the database. Are you on Supabase?

**On Supabase,** run `npx supabase init` once, then `npx supabase start`. It runs the database, auth, and storage locally and prints the URL and keys. Migrations go in `supabase/migrations`, and `npx supabase db reset` rebuilds the local database from them and `supabase/seed.sql`. That reset replaces `db:migrate` and `db:seed` below.

**Otherwise, run Postgres in Docker.** Install Docker Desktop (or OrbStack on a Mac), which runs packaged apps called containers. Then run:

```bash
# -e sets the password, -p opens port 5432 on your laptop,
# -d runs it in the background, postgres:18 is the image to run.
docker run --name db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18
```

Your `DATABASE_URL` is then `postgresql://postgres:postgres@localhost:5432/postgres`.

Your tables come from migrations: SQL files applied in order, each recorded so it runs once. You write the SQL by hand, or Drizzle or Prisma generates it from your schema. The SQL file is what gets reviewed and run.

```sql
-- migrations/0001_create_habits.sql
CREATE TABLE habits (
  -- Postgres numbers each new row 1, 2, 3, and you never set it yourself.
  -- PRIMARY KEY makes that number unique and required.
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- uuid: a long random ID, the kind auth gives each user.
  user_id uuid NOT NULL,
  name text NOT NULL,
  -- timestamptz: an exact moment, right in every time zone.
  created_at timestamptz NOT NULL DEFAULT now()
);
```

In `package.json`, `setup` takes a fresh clone to a running app with data in one command.

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

`db:migrate` runs your migration tool, like `drizzle-kit migrate` or `prisma migrate deploy`.

An agent that can run `npm run setup` and `npm run check` can verify its own work. One that has to ask you for a database URL can't.

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

## Dev, preview, and prod get separate data and separate keys

On Vercel, every environment variable is scoped to Development, Preview, or Production, so each gets its own keys. Every PR gets a preview deploy, its own URL running that PR's code, which needs a database. Neon's Vercel integration creates a branch, a throwaway copy of your database, for each preview. Turn on its cleanup of old branches, or you'll hit the Free plan's branch limit.

Never point a preview at production data. Preview code hasn't been reviewed, and preview URLs get shared. If your Vercel build command runs migrations, every preview build runs them against whatever database it's given, so an unreviewed PR can change production's tables.

Neon's integration adds another risk: each preview branch copies production's data. Once you have users, every preview holds their personal data. Supabase preview branches start empty, and a seed file fills them.

<details>
<summary>Going deeper: branching Neon previews from seed data</summary>

Keep a Neon branch called `dev` that holds only seed data. Then create preview branches in CI (the checks GitHub runs on every push) with Neon's create-branch GitHub Action, setting `parent_branch: dev`, instead of through the Vercel integration.

</details>

Free tiers have cliffs, rarely where you'd expect. Read [the side-project stack's cliffs](../recipes/side-project-stack.md#what-it-costs) before you sign up.

## How I do it

On my own side projects:

- **Laptop first.** `npx supabase start` on Supabase, Postgres in Docker otherwise. Then ask your agent: "Set up this repo with [start-project](../../skills/start-project/SKILL.md)."
- **Then previews.** Connect the repo to Vercel, then add Neon's integration.
- **Then one service per feature,** in the order above. [The side-project stack](../recipes/side-project-stack.md) puts it all together.

I pick Supabase over Neon when I want its auth and storage too.

## The standard

- **Previews branch from seed data, never from production,** as in the Going deeper above. Adopt it once real users' data is in production.
- **Backups, and a restore you've practiced.** Adopt them once users have data you can't recreate.
- **A billing alert or hard cap on every service, and a written usage level where you'd switch.** Adopt it once a card is on file.
- **A smoke test of the built app, and a release you can stop with a flag or a quick revert.** Adopt it once a second engineer ships or users would notice a bad deploy. More in [deployment](../concerns/deployment.md).

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
