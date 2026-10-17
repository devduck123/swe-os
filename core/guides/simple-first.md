---
title: 'Simple first: when complexity earns its place'
description: Why one app and one database beat what an agent proposes by default, what a separate API, a state store, extra layers, caches, and queues actually buy, and the trigger that justifies each.
domain: architecture
stage: design
freshness: durable
status: reviewed
reviewed: 2026-10-06
track: 4
concerns: [performance, reliability, cost, dependencies]
---

Build the simplest thing that fully solves today's problem. For most new web apps, that's one app talking to one database. Every service, layer, store, or package you add after that has to name the problem it solves and the evidence that it's real. Each piece is something to deploy, secure, upgrade, keep in sync, and debug at 2 a.m., and you pay that whether or not it earns it.

## The 50-user app an agent overbuilds

You're building a booking app for a friend's yoga studio. About 50 regulars book classes, cancel, and get a confirmation email. You ask an agent to set it up properly, and what comes back looks like every tutorial at once. Ask what each piece solves here.

- **A separate Express API next to Next.js.** Next.js already runs server code. Server components read the database, and server actions handle writes. A second server means two deploys, and two copies of what a booking looks like that slowly stop matching.
- **A Zustand store (shared state in the browser) that copies bookings from the API.** Bookings live in Postgres. A client copy is a second source of truth, and every mutation has to update both or someone sees a class that's already full.
- **`BookingRepository`, `BookingService`, and `BookingController`.** That's the classic layered pattern: one file runs queries, one holds rules, one handles requests, each behind an interface (a contract that lets you swap in a different implementation). Every change touches four files, and an agent reads three before finding the query. You're never swapping Postgres out, so the interfaces buy nothing.
- **Upstash Redis to rate-limit every route.** That caps how often one caller can hit it, but nobody has abused the app yet. The limiter is another account, another secret, and another network hop on every request. The limits you do need from day one, on sign-in and AI routes, are in [trust boundaries](trust-boundaries.md).
- **Docker Compose running Postgres, Redis, and the API.** Production is Vercel and Neon. A container stack that only exists on your laptop drifts from what actually runs. One Postgres container for local dev is fine ([local first, then managed](local-first-then-managed.md)).
- **Twelve packages for the booking form.** Each one is code you didn't read, can break on update, and ships to the browser if a client component imports it. A native date input and one date library cover this form.

For this app, I'd pick one Next.js app on Vercel, Postgres on Neon, and an email provider, with a folder per feature like `bookings/` and `email/`, each holding one file of queries that checks who's asking.

## Every piece adds a way to fail

Two servers means a network between them, so you need timeouts, retries, and a plan for when one is down. A cache (a saved copy of a result, so you skip redoing the work) or a client store means two copies of the truth that can disagree. A queue (a list of work your app does later, in the background) means work can run twice or sit stuck.

Layers and packages cost less each but add up. A layer is one more file to read before the code that matters, for you and every agent after you. A package is a dependency to keep current and trust ([dependencies](../concerns/dependencies.md)). As Dan McKinley's "Choose Boring Technology" says, spend your new and unfamiliar tools on what makes your product different.

## Adding is cheap later, removing is a rewrite

Adding a cache to a working app is a small change, made the week you need it. Folding a separate API back into the app, or deleting three layers from every feature, touches everything. When you're unsure, take the path you can still change cheaply ([prefer reversible decisions](../principles.md#prefer-reversible-decisions)). Martin Fowler's "MonolithFirst" makes the same case for a monolith (one app that does everything): you rarely know the right boundaries at the start.

## What earns each piece

Every trigger below is a measurement or a fact about today. "We might get big" isn't one ([scale from evidence](../principles.md#scale-from-evidence)).

- **Cache.** Earned by a page you timed as slow even with the right [indexes](data-that-stays-correct.md#index-the-queries-you-actually-run) (lookups that skip reading every row), that's read often, and where slightly old data is fine.
- **Queue or job system.** Earned by work that's slow or flaky, doesn't need to finish before the response, and must not be lost.
- **Separate API.** Earned by a native mobile app or outside developers calling it, once route handlers in the same app no longer fit.
- **Client state store.** Earned by browser-only state shared across distant components, like an editor or canvas. Never a copy of server data.
- **Repository layers.** Earned by the same query copied in three places, or a second data source you actually have.

## How I do it

On my own side projects, my default is the [side-project stack](../recipes/side-project-stack.md): the architecture above, with Drizzle and managed auth. On Supabase, the shape is the same: one Next.js app and one Supabase project.

Before I add anything else, I write in `PROJECT.md` the problem it solves and the number that proves it, like "the bookings page takes 3 seconds, and 2.5 of that is one query." To get it, time the page in the Network tab, then ask your agent: "Log how long each database query takes on this page."

When an agent proposes a new piece, ask it: "What problem does this solve today, and what's the evidence?"

When a trigger above fires, here's what I'd reach for:

- **A cache:** Next.js caching first, Redis after.
- **A job system:** [background jobs and webhooks](background-jobs-and-webhooks.md) covers which one.
- **A second service,** once one part needs a different runtime, like a Python worker for a model.

## The standard

- **Every new piece gets a short written decision that another engineer reviews.** Do it when a second engineer joins.
- **Each service has a billing alert, and a cost estimate for a bad month.** Do it once real money is on the line ([cost](../concerns/cost.md)).
- **Dependencies get updated on purpose,** with Dependabot or Renovate and an audit in CI. Do it once real users depend on it ([dependencies](../concerns/dependencies.md)).
- **Each service has an exit plan:** how you'd export the data, and what a swap would touch. Do it once real users' data lives there.

## Before you ship, check

Paste this to your agent before you merge:

- Every new service, layer, store, or package names today's problem and its evidence.
- Server data lives in the database only, not copied into a client store.
- No separate API serves only this one web app.
- Any cache was added after a timed page stayed slow with the right indexes.
- No package does what the platform already does, like a native date input.

## Sources

- [Dan McKinley, "Choose Boring Technology" (2015)](https://mcfunley.com/choose-boring-technology)
- [Martin Fowler, "MonolithFirst" (2015)](https://martinfowler.com/bliki/MonolithFirst.html)
