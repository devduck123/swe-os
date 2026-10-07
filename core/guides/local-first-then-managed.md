---
title: Local first, then managed services
description: Start on your laptop with fast feedback, then add hosted services one at a time on free tiers, and know when it's time to pay.
domain: infrastructure
stage: build
freshness: evolving
status: outline
track: 5
concerns: [deployment, cost, data, security]
---

**After this page, the reader can** get a project running locally in one command, add a database, auth, and storage one at a time, and spot the pricing cliff before they hit it.

## Start where feedback is fastest: your laptop

- Local dev is the fastest loop there is. Every service you add early slows it down.
- One command to run. Seed data so the app isn't empty. Fake or local stand-ins where possible.

## Make it reproducible on day one

- Pinned runtime (`.nvmrc`), a committed lockfile, `.env.example`, and a `check` script that runs format, lint, types, and tests.
- The test: a fresh clone runs on another machine, or in an agent's sandbox, without a call to you.

## Add one service at a time

- A sensible order: database, then auth, then file storage, then email, then error tracking, then payments last.
- For each: the local stand-in vs. the managed free tier, and what to check before signing up.
- Link [defaults](../../profile/defaults.md) for the picks.

## Branches, previews, and environments

- Dev, preview, and prod are different environments with different data and different keys.
- Preview deploys per PR. Database branches (Neon, Supabase) for previews.
- Never point a preview at production data.

## Read the pricing cliff before you sign up

- Free tiers have rules: limits, pausing inactive projects, non-commercial clauses, and no option to pay for overages.
- Spend caps and billing alerts.
- Link the [cost](../concerns/cost.md) concern and the cliffs in defaults.

## Upgrade when something real forces it

- Triggers: real users, real money, a limit you actually hit, a feature you need.
- Upgrade one piece at a time, and know how you'd get your data out.

## What the vibe-coded version misses

- Works only on the author's laptop.
- Developing against the production database.
- No seed data, so every new environment starts broken.
- Eight services signed up for on day one.
- The free tier paused the database the week before a demo.
- A side project that makes $5 breaking Vercel Hobby's terms.
- One set of keys everywhere.

## What I'd do

- Laptop first, then a Neon branch or Supabase local, then Vercel previews, adding each managed piece only when the feature needs it.
- The `start-project` skill sets up the local half.

## What changes at scale

- Infrastructure as code, a staging environment with production-like data, and migration pipelines.

## Sources to check before writing

- Current free-tier pages for Vercel, Neon, Supabase, Clerk, and Better Auth (see defaults). Neon and Supabase branching docs. Supabase local dev docs.
