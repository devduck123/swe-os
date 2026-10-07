---
title: Defaults
description: What Tommy reaches for on side projects, how he works with agents, and his UI taste.
freshness: fast-moving
reviewed: 2026-10-06
---

This is what I reach for on my own projects. Treat it as a reference for the kind of tooling I like, not a lockfile: typed, managed, well documented, pleasant to work with, and easy for an agent to drive. I'm open to something newer when the DX is genuinely better, so suggest it, and say what it buys over the default. Versions and pricing move fast, so check current docs before relying on either.

In an existing repo, its stack wins. In a work repo, the project's own rules and stack win over everything here.

## Stack

| Layer                | I start with                                                                                                           | I change it when                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Web app              | Next.js (App Router), React, TypeScript                                                                                | It's mostly client-side and URL-driven: TanStack Start once it's stable                                                                      |
| Content site         | A static-first framework, like Astro for this site                                                                     | Pages need per-user or per-request data                                                                                                      |
| UI                   | Tailwind, shadcn/ui, Lucide icons. New shadcn projects use Base UI by default, and I keep that                         | The project already has a design system                                                                                                      |
| Forms and validation | react-hook-form and Zod                                                                                                | TanStack Form v2 lands and the project is on TanStack                                                                                        |
| Server data          | Server actions or TanStack Query, whichever fits the screen                                                            | Pick per feature, not as a rule                                                                                                              |
| Database             | Postgres: Neon for just the database, Supabase for its other services too, Drizzle                                     | The data isn't relational (see below)                                                                                                        |
| Auth                 | Better Auth when I want users in my own Postgres, Clerk for hosted UI fast                                             | Clerk's free tier lacks MFA and passkeys, so those push me to Better Auth                                                                    |
| Rate limiting        | On auth and AI routes from day one, with counts stored in Postgres or Redis. In-memory limits don't hold on serverless | Postgres counters become measurable load: a managed Redis                                                                                    |
| Payments             | Stripe Checkout, tested in a Stripe sandbox with test cards and the Stripe CLI forwarding webhooks                     | The hosted Checkout page can't do the flow: Stripe Elements                                                                                  |
| Email                | A transactional email API, sending from my own verified domain. I haven't settled on a provider                        | Once one earns it, it goes here                                                                                                              |
| Background work      | In the request, or in `after()` when the user shouldn't wait                                                           | It needs retries or outlasts the function: a hosted job service (Inngest, Trigger.dev, or Vercel Workflows). Hobby cron runs only once a day |
| Files                | Supabase Storage on Supabase, Vercel Blob on Vercel                                                                    | Egress or limits matter: Cloudflare R2                                                                                                       |
| Hosting              | Vercel                                                                                                                 | The project makes money: Vercel Hobby is non-commercial only                                                                                 |
| Errors               | Sentry                                                                                                                 | I also want product analytics: PostHog covers both                                                                                           |
| Tests                | Vitest for logic, plus Playwright for the flows that would hurt to break                                               | It's a throwaway spike nobody else uses: a manual check until someone does                                                                   |
| App shape            | One Next.js app                                                                                                        | Multiple clients or truly separate services. Rare here.                                                                                      |
| AI features          | A hosted model API behind my own server route                                                                          | Cost, latency, or privacy needs a different model or setup                                                                                   |

**Honorable mention: Convex.** It has the best agent tooling of any backend I've looked at, with the whole backend in TypeScript and live queries built in. I'd try it on a realtime or collaborative app. It's a poor fit for relational or reporting-heavy data, since there's no SQL and there are per-query scan limits, and its paid plan is priced per developer.

**Retired:** Auth.js now lives inside Better Auth and only gets security fixes, so I keep it only in apps that already use it. UploadThing's last release was 7.7.4 in August 2025.

## Data: Postgres unless the shape says otherwise

Postgres is the default for anything relational. I've used DynamoDB, Firestore, MySQL, Mongo, Redis, and Google Sheets, and I switch when the data looks different:

- **Independent documents read by key:** the managed document or key-value store the platform makes easiest.
- **A tiny tool for people who already live in a spreadsheet:** the spreadsheet can be the database. My backpack-comparison app started that way.
- **Caching:** a managed Redis-style store, once something measured says you need it.

## Working with agents

- **Who builds:** Claude Code and Codex, both for planning and building. Claude Code leads on UI and design work.
- **Git:** light trunk-based development. A short-lived feature branch and a PR for everything, then merge to main. Vercel gives every PR a preview deploy.
- **Pick agent-friendly tools.** When choosing between two tools, prefer the one an agent can drive: types end to end, schema and config in code, a CLI for everything, errors that say how to fix them, and docs an agent can load (llms.txt or an official MCP server).
- **Connect the agent tooling per project.** Most of this stack ships MCP servers or agent skills: shadcn, Next.js devtools, Vercel, Playwright, Sentry, Supabase, Neon, and Convex. Point database tools at development data, or run them read-only against production.

## Cliffs worth knowing

Free tiers are fine until they aren't. Before picking a service, find its pricing cliff: the usage level where the bill or the limits jump. The current cliffs for this stack live in [the side-project stack](../core/recipes/side-project-stack.md#what-it-costs).

## UI taste

I don't design much by hand anymore. Agents go straight to code, and that's fine as long as the result has taste.

- **Product screens:** refined and minimal. Clear hierarchy, quiet surfaces, color used as an accent rather than decoration, small purposeful motion. [OpenPacks](https://backpacks-app.vercel.app/) shows the floor: AI-built and deliberately kept neutral. Clean is the minimum; aim for more character than that when the product allows it.
- **Personal and landing pages:** more character, still restrained. [My portfolio](https://www.ducktommy.com/) is the main reference: a big editorial serif, a dark, quiet palette, one focal visual with a soft glow and slow motion, small uppercase labels, and room to breathe. This site's landing page shows the more playful end: a little cute, a little animated.
- **References:** Mobbin for real-world patterns, Framer for polish and motion ideas.

Default framework styling shipped as-is isn't a design. Neither is decoration that fights the content.

## Sources

- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby) and [cron job limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Next.js `after`](https://nextjs.org/docs/app/api-reference/functions/after) and [Vercel Workflows](https://vercel.com/docs/workflows)
- [Clerk pricing](https://clerk.com/pricing)
- [Better Auth rate limiting](https://www.better-auth.com/docs/concepts/rate-limit)
- [Stripe sandboxes](https://docs.stripe.com/sandboxes) and [testing](https://docs.stripe.com/testing)
- [Convex pricing](https://www.convex.dev/pricing) and [limits](https://docs.convex.dev/production/state/limits)
- [Auth.js joins Better Auth](https://www.better-auth.com/blog/authjs-joins-better-auth)
- [shadcn/ui: Base UI as the default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- [UploadThing on npm](https://www.npmjs.com/package/uploadthing?activeTab=versions)
