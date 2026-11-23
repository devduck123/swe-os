---
title: The side-project stack
description: One app on managed services that a single person can ship this weekend, run for free, and grow without a rewrite, as long as you know where each free tier ends.
track: 27
concerns: [deployment, cost, security, data]
freshness: fast-moving
reviewed: 2026-11-01
status: reviewed
prev:
  link: /guides/learning-with-agents/
  label: 'Track 26: Learning while agents write the code'
---

This is the stack I'd use to build a real web app alone. Every piece is managed, starts free, and grows a long way before you'd want to replace it. Free tiers end abruptly, though, and rarely where you'd guess, so most of this page is about where. No separate API server, job queue, cache server like Redis, or staging copy of the site until something real asks for one ([simple first](../guides/simple-first.md)).

## What I pick

| Layer    | My pick                                                         | Why                                                                                                                                               |
| -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| App      | One Next.js app on Vercel                                       | One repo, one deploy, a preview per PR                                                                                                            |
| Database | Postgres on Neon through Drizzle, or Supabase                   | Constraints, rules Postgres checks on every write, catch what code forgets. Drizzle is the TypeScript query layer. Supabase adds auth and storage |
| Auth     | Better Auth, or Clerk for hosted sign-in fast                   | Never hand-roll it. Better Auth keeps users in my Postgres                                                                                        |
| Files    | Vercel Blob, or Supabase Storage                                | Files stay out of the database. Postgres keeps URL and owner                                                                                      |
| Email    | An email API for sign-up and receipt emails, from my own domain | Auth needs it from the first sign-up                                                                                                              |
| Payments | Stripe Checkout, built in test mode first                       | Stripe handles the card and calls my app when it's paid, signed so I can check it's really Stripe                                                 |
| Errors   | Sentry                                                          | It tells me something broke before a user does                                                                                                    |
| Input    | Zod                                                             | Check the shape of everything from outside, AI output included                                                                                    |

## Easy to miss

- **A free plan can rule out what you're building.** Some hosts' free plans are non-commercial, and payments or ads count. Some run scheduled jobs (cron) only a few times a day. Check the current terms first.
- **Free tiers stop; paid tiers bill.** Over a free limit, a feature usually turns off until the period resets, which is an outage. On a paid plan it keeps running and billing, and only a spend cap stops it ([performance and cost](../guides/performance-and-cost.md)).
- **Free databases meter time awake, or pause when idle.** A health check every few minutes can use up the free hours mid-month, and a quiet week can get a project paused. Know which yours does.
- **File storage meters operations, not just bytes.** Uploads and requests for a list of your files can count against a small monthly allowance. Save each file's URL in Postgres on upload and read it from there.
- **Email limits bite on launch day.** Free email plans cap sends per day, and verification emails fail past it. A backend's built-in auth email may be meant for testing only.
- **Free backups go back hours, or not at all.** Once it's real users' data, longer backup history is the first upgrade I'd pay for.
- **Your vendor accounts are the real way in.** Whoever gets into GitHub, Vercel, the database, Stripe, email, or your domain registrar skips every check in your code. Turn on MFA (a second step after the password) on each before the first real user.

**How I do it:** this stack with MFA everywhere from day one, then one upgrade at a time for a reason I can name. Before each, I know how I'd leave: `pg_dump`, Postgres's standard export, moves the data anywhere, and Drizzle doesn't care who hosts it.

**Ask your agent:** "Which free-tier limit breaks first if a thousand people show up tomorrow?"

## Go deeper

- [Vercel Hobby plan limits](https://vercel.com/docs/plans/hobby)
- [Vercel Blob usage and pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Neon plans: compute hours and suspension](https://neon.com/docs/introduction/plans)
- [Supabase pricing: free tier, pausing, and Pro](https://supabase.com/pricing)
