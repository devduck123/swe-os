---
title: 'Simple first: when complexity earns its place'
description: Why one app and one database beat what an agent proposes by default, what a separate API, a state store, extra layers, caches, and queues actually buy, and the trigger that justifies each.
domain: architecture
stage: design
freshness: durable
status: draft
track: 4
concerns: [performance, reliability, cost, dependencies]
---

Build the simplest thing that fully solves today's problem. For most new web apps, that's one app talking to one database. Every piece you add after that, whether it's a service, a layer, a store, or a package, has to name the problem it solves and point at evidence that the problem is real. Each piece is something to deploy, secure, upgrade, keep in sync, and debug at 2 a.m., and you pay that every day whether or not it earns it.

## The 50-user app an agent overbuilds

You're building a booking app for a friend's yoga studio. About 50 regulars book classes, cancel, and get a confirmation email. You ask an agent to set it up properly, and what comes back looks like every tutorial at once. Go piece by piece and ask what each one solves for this app.

- **A separate Express or tRPC API next to Next.js.** Next.js already runs server code. Server components read the database, and server actions handle writes. A second server means two deploys, CORS, and types that drift between them.
- **A Zustand store that copies bookings from the API.** Bookings live in Postgres. A client copy is a second source of truth, and every mutation has to update both or someone sees a class that's already full.
- **`BookingRepository`, `BookingService`, and `BookingController`, each with an interface.** Every change touches four files, and an agent reads three before finding the query. Each interface has one implementation, and you're never swapping Postgres out.
- **Upstash Redis to rate-limit every route.** Nobody has abused the app, so the limiter is sized for traffic nobody has seen. It's another account, another secret, and another network hop on every request. The limits you do need from day one, on sign-in and AI routes, are in [trust boundaries](trust-boundaries.md).
- **Docker Compose running Postgres, Redis, and the API.** Production is Vercel and Neon. A container stack that only exists on your laptop drifts from what actually runs. One Postgres container for local dev is fine ([local first, then managed](local-first-then-managed.md)).
- **Twelve packages for the booking form.** Each one is code you didn't read, can break on update, and ships to the browser if a client component imports it. A native date input and one date library cover this form.

The right architecture is one Next.js app on Vercel, Postgres on Neon, and an email provider, with a folder per feature like `bookings/` and `email/`, each holding one file of queries that checks who's asking.

## Every piece adds a way to fail

Two servers means a network between them, so you need timeouts, retries, and a plan for when one is down. A cache or a client store means two copies of the truth that can disagree. A queue means work can run twice or sit stuck.

Layers and packages cost less each but add up. A layer is one more file to read before the code that matters, for you and every agent after you. A package is a dependency to keep current and trust ([dependencies](../concerns/dependencies.md)).

Dan McKinley's "Choose Boring Technology" puts it well: adding a technology is easy, and living with it is hard. Spend your few "innovation tokens" on what makes your product different.

## Adding is cheap later, removing is a rewrite

Adding a cache to a working app is a small change you can make the week you need it. Folding a separate API back into the app, or deleting three layers from every feature, touches everything. When you're unsure, take the path you can still change cheaply ([prefer reversible decisions](../principles.md#prefer-reversible-decisions)). Martin Fowler's "MonolithFirst" adds that you rarely know the right boundaries at the start, and they're much cheaper to move between folders than between servers.

## What each piece buys, and what earns it

Add a piece when you have its problem and can point at the evidence.

| Piece               | What it actually buys                                                     | The trigger that earns it                                                                                      |
| ------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Cache               | Skips repeating expensive work for data that's read often                 | A read you measured as slow after checking indexes, that's hot and tolerates staleness                         |
| Queue or job system | Moves work out of the request and retries it until it succeeds            | Work that's slow or flaky, doesn't need to finish before the response, and must not be lost                    |
| Separate API        | A stable contract for clients that aren't your web app                    | A native mobile app or outside developers calling it, and route handlers in the same app no longer fit         |
| Client state store  | Shared state that only exists in the browser                              | Client-only state used across distant components, like an editor or canvas. Never a copy of server data        |
| Repository layers   | One place to change how data is fetched                                   | The same query copied in three places, or a second data source you actually have                               |
| Microservices       | Teams that deploy and scale their part without coordinating with everyone | Several teams stepping on each other in one codebase, or one part with very different runtime or scaling needs |

Microservices mostly solve an organizational problem: many people changing one system at once. Kubernetes is the same story one level down. If you're one person with an agent, you don't have that problem. And every trigger is a measurement or a fact about today. "We might get big" isn't one ([scale from evidence](../principles.md#scale-from-evidence)).

## What the vibe-coded version misses

- **Server data copied into a client store.** After a failed mutation the store and the database disagree, and a user books a class that's already full. You debug it by diffing two copies of the truth.
- **A separate API for a single web app.** Every feature is two PRs and two deploys, and the types drift until a renamed field breaks production.
- **A cache before anyone measured.** The slow page was a missing index. Now you have the index and a stale-data bug, in two systems instead of one.
- **Packages for what the platform already does.** Each one is a supply-chain risk and a heavier page, and its next major version breaks a form you haven't touched in months.

## What I'd do

My default is the [side-project stack](../recipes/side-project-stack.md): one Next.js app on Vercel, Postgres on Neon with Drizzle, managed email and auth, server actions instead of a separate API, and one data access file per feature instead of three layers. Before I add anything else, I write the problem it solves and the number that proves it in `PROJECT.md`.

What would change my mind:

- **A cache,** once a measured read is slow after indexing. Next.js caching first, Redis after.
- **A job system,** once work outlasts a request or has to survive a crash. [Background jobs and webhooks](background-jobs-and-webhooks.md) covers which one.
- **A second service,** once one part needs a different runtime, like a Python worker for a model.

## Sources

- [Dan McKinley, "Choose Boring Technology" (2015)](https://mcfunley.com/choose-boring-technology)
- [Martin Fowler, "MonolithFirst" (2015)](https://martinfowler.com/bliki/MonolithFirst.html)
