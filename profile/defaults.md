---
title: Defaults
description: What Tommy reaches for on side projects, the kind of tooling he likes, and his UI taste.
freshness: fast-moving
reviewed: 2026-10-06
---

This is what I reach for on my own projects. Treat it as a reference for the kind of tooling I like, not a lockfile: typed, managed, well documented, and pleasant to work with. I'm always open to something newer when the DX is genuinely better, and I haven't surveyed the agent-era tooling lately, so suggestions are welcome. Convex is an honorable mention I'd seriously consider. If you suggest a swap, say what it buys over the default. Versions and pricing move fast, so check current docs before relying on either.

Reuse whatever an existing project already does well.

## Stack

| Layer                | I start with                                                                                            | I change it when                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Web app              | Next.js (App Router), React, TypeScript                                                                 | The problem is a different shape: a CLI, a native app, a content site   |
| Content site         | A static-first framework, like Astro for this site                                                      | Pages need per-user or per-request data                                 |
| UI                   | Tailwind, shadcn/ui on Radix, Lucide icons                                                              | The project already has a design system                                 |
| Forms and validation | react-hook-form and Zod                                                                                 | The form is one input and a button                                      |
| Server data          | Server actions or TanStack Query, whichever fits the screen                                             | Never a hard rule; pick per feature                                     |
| Database             | Postgres: Neon when I only need the database, Supabase when I want its other services too, with Drizzle | The data isn't relational (see below)                                   |
| Auth                 | Clerk or Auth.js, whichever is easiest with the rest of the stack                                       | I need to own the user table or the cost changes                        |
| Files                | Supabase Storage or UploadThing                                                                         | Volume or cost points to S3-style storage                               |
| Hosting              | Vercel, or a free static host for static sites                                                          | Limits, cost, or a runtime I need outgrow it                            |
| Errors               | Sentry                                                                                                  | The project is too small to have users yet                              |
| Tests                | Vitest, plus Playwright for the flows that matter, once the codebase grows                              | Never skipped for anything with my name on it that people use           |
| App shape            | One Next.js app                                                                                         | Multiple clients or services that truly need to be separate. Rare here. |
| AI features          | A hosted model API                                                                                      | Cost, latency, or privacy calls for a different model or setup          |
| Building with AI     | Claude Code and Codex                                                                                   | Something better shows up                                               |

## Data: Postgres unless the shape says otherwise

Postgres is the default for anything relational. I've used DynamoDB, Firestore, MySQL, Mongo, Redis, and Google Sheets, and I switch when the data looks different:

- **Independent documents read by key:** the managed document or key-value store the platform makes easiest.
- **A tiny tool for people who already live in a spreadsheet:** the spreadsheet can be the database. My backpack-comparison app started that way.
- **Caching or rate limiting:** a managed Redis-style store, once something measured says you need it.

## UI taste

I don't design much by hand anymore. Agents go straight to code, and that's fine as long as the result has taste.

- **Product screens:** refined and minimal. Clear hierarchy, quiet surfaces, color used as an accent rather than decoration, small purposeful motion. [OpenPacks](https://backpacks-app.vercel.app/) shows the floor: AI-built and deliberately kept neutral. Clean is the minimum; aim for more character than that when the product allows it.
- **Personal and landing pages:** more character, still restrained. [My portfolio](https://www.ducktommy.com/) is the main reference: a big editorial serif, a dark, quiet palette, one focal visual with a soft glow and slow motion, small uppercase labels, and room to breathe. This site's landing page shows the more playful end: a little cute, a little animated.
- **References:** Mobbin for real-world patterns, Framer for polish and motion ideas.

Default framework styling shipped as-is isn't a design. Neither is decoration that fights the content.

## Watch the pricing cliff

Free tiers are fine until they aren't. Before picking a service, find its pricing cliff: the usage level where the bill or the limits jump. I'd rather run cheap experiments on managed services than operate infrastructure for fun.
