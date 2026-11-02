---
title: The side-project stack
description: One app on managed services that a single person can ship this weekend, run for free, and grow without a rewrite, as long as you know where each free tier ends.
stage: design
track: 22
concerns: [deployment, cost, security, data]
freshness: fast-moving
reviewed: 2026-11-01
status: draft
prev:
  link: /guides/learning-with-agents/
  label: 'Track 21: Learning while agents write the code'
---

This is the stack I'd use to build a real web app alone. Every piece is managed, starts free, and grows a long way before you'd want to replace it. Free tiers end abruptly, though, and rarely where you'd guess, so most of this page is about where. No separate API, queue, Redis, or staging environment until something real asks for one ([simple first](../guides/simple-first.md)).

## What I pick

| Layer    | My pick                                       | Why                                                                           |
| -------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| App      | One Next.js app on Vercel                     | One repo, one deploy, a preview per PR                                        |
| Database | Postgres on Neon through Drizzle, or Supabase | Rules in the database catch what code forgets. Supabase adds auth and storage |
| Auth     | Better Auth, or Clerk for hosted sign-in fast | Never hand-roll it. Better Auth keeps users in my Postgres                    |
| Files    | Vercel Blob, or Supabase Storage              | Files stay out of the database. Postgres keeps URL and owner                  |
| Email    | A transactional email API, from my own domain | Auth needs it from the first sign-up                                          |
| Payments | Stripe Checkout, built in test mode first     | Stripe handles the card. A signed webhook says it was paid                    |
| Errors   | Sentry                                        | It tells me something broke before a user does                                |
| Input    | Zod                                           | Parse everything from outside, AI output included                             |

## Easy to miss

- **Vercel's free plan is non-commercial.** Taking payments or running ads counts. Its cron also runs only once a day.
- **Free tiers stop; paid tiers bill.** Over a free limit, a feature usually turns off until the period resets, which is an outage. On a paid plan it keeps running and billing, so set a spend cap, not just an alert.
- **A database that never sleeps burns the free compute.** Neon sleeps when idle. A health check or polling cron that queries it every few minutes keeps it awake, and the free hours run out mid-month. Supabase's free plan has the opposite trap: it pauses a project that sits quiet.
- **Listing files is metered.** Blob counts uploads and list calls against a small monthly allowance. Read file URLs from Postgres instead of listing the store on each page view.
- **Serverless runs many copies of your app at once.** Each copy has its own memory, so a login limit kept in memory is really one per copy. Keep counts like that in Postgres.
- **Email limits bite on launch day.** Free email plans cap sends per day, and verification emails fail past it. Supabase's built-in email only reaches your own team.
- **Free backups are hours deep, or nothing.** Once it's real users' data, longer history is the first upgrade I'd pay for.
- **Your vendor accounts are the real perimeter.** Whoever gets into GitHub, Vercel, the database, Stripe, email, or the registrar skips every check in your code. Turn on MFA (a second step after the password) on each before the first real user.

**How I do it:** this stack with MFA everywhere from day one, then one upgrade at a time for a reason I can name, knowing before each how I'd leave: `pg_dump` exports Postgres, and Drizzle doesn't care who hosts it.

## Go deeper

- [Vercel Hobby plan limits](https://vercel.com/docs/plans/hobby)
- [Vercel Blob usage and pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Neon plans: compute hours and suspension](https://neon.com/docs/introduction/plans)
- [Supabase pricing: free tier, pausing, and Pro](https://supabase.com/pricing)
