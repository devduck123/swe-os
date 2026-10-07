---
title: The side-project stack
description: A full-stack web app on managed services that one person can ship this weekend, run for free, and grow without a rewrite.
domain: architecture
stage: design
freshness: fast-moving
status: outline
reviewed: 2026-10-06
track: 8
concerns: [deployment, cost, security, data]
prev:
  link: /guides/learning-with-agents/
  label: 'Track 7: Learning while agents write the code'
---

**After this page, the reader can** stand up the whole stack, explain why every piece is there, and name the moment each missing piece would become worth adding.

## The whole thing on one page

- One diagram: Next.js on Vercel, Postgres on Neon through Drizzle, Better Auth or Clerk, Vercel Blob for files, Sentry for errors.
- One sentence per arrow: what moves between the pieces.
- Source of truth for the picks: [defaults](../../profile/defaults.md).

## Why each piece is here

- For each piece: the job it does, why it's the simplest option that does that job, and the alternative you'd pick if the project were different.

## What it costs

- A table for 0, 1,000, and 10,000 monthly users, using current pricing pages.
- Which cliff you'd hit first, and what it costs to get past it.
- The non-commercial rule on Vercel Hobby, called out clearly.

## What's deliberately missing

- A separate API service, queues, a cache, background workers, microservices, Kubernetes, a staging environment.
- For each: the specific trigger that would make it worth adding. "We might need it" doesn't count.

## Getting it running

- Run `start-project`, then local dev, then the first preview deploy, then production.
- Link [local first, then managed services](../guides/local-first-then-managed.md) for the order services get added in.

## What the vibe-coded version misses

- Ten services on day one.
- No idea what it costs at 1,000 users.
- Production deployed from a laptop.
- A serverless app with no database connection pooling.
- No error tracking, so users find the bugs first.

## What I'd do

- This stack, with nothing added until something real asks for it.
- One upgrade at a time, each with an exit plan.

## Sources to check before writing

- The pricing and limits pages listed in defaults, checked again on the day this gets written.
