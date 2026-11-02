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

- **Vercel's free plan is non-commercial.** Taking payments or running ads counts, so move to Pro before you charge anyone. Its cron (scheduled jobs) runs only once a day.
- **Free tiers stop; paid tiers bill.** Over a free limit, a feature usually turns off until the period resets, which is an outage. On a paid plan it keeps running and billing, so set a spend cap, not just an alert.
- **A database that never sleeps burns the free compute.** Neon's free plan counts hours awake, and sleeps when idle. A health check or scheduled job that queries it every few minutes keeps it awake, and the free hours run out mid-month. Supabase's free plan has the opposite trap: it pauses a project that sits quiet.
- **Listing files is metered.** Blob counts uploads and every request for a list of your files against a small monthly allowance. Save each file's URL in Postgres on upload and read it from there.
- **Serverless runs many copies of your app at once.** Each copy has its own memory, so a rate limit kept there, like five login attempts a minute, is really five per copy. Keep counts like that in Postgres, where every copy sees one count.
- **Email limits bite on launch day.** Free email plans cap sends per day, and verification emails fail past it. Supabase's built-in email only reaches your own team.
- **Free backups go back hours, or not at all.** Once it's real users' data, longer backup history is the first upgrade I'd pay for.
- **Your vendor accounts are the real way in.** Whoever gets into GitHub, Vercel, the database, Stripe, email, or your domain registrar skips every check in your code. Turn on MFA (a second step after the password) on each before the first real user.

**How I do it:** this stack with MFA everywhere from day one, then one upgrade at a time for a reason I can name. Before each, I know how I'd leave: `pg_dump`, Postgres's standard export, moves the data anywhere, and Drizzle doesn't care who hosts it.

**Ask your agent:** "Check this app against the free-tier limits of every service it uses and tell me which breaks first if a thousand people show up tomorrow. Then list every account that needs MFA, and where to set a spend cap on each."

## Go deeper

- [Vercel Hobby plan limits](https://vercel.com/docs/plans/hobby)
- [Vercel Blob usage and pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Neon plans: compute hours and suspension](https://neon.com/docs/introduction/plans)
- [Supabase pricing: free tier, pausing, and Pro](https://supabase.com/pricing)
