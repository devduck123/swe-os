---
title: 'Simple first: when complexity earns its place'
description: Why one app and one database beat a diagram full of boxes, what queues, caches, microservices, and Kubernetes actually buy, and the trigger that justifies each.
domain: architecture
stage: design
freshness: durable
status: draft
track: 4
concerns: [performance, reliability, cost]
---

Build the simplest thing that fully solves today's problem. For most new web apps, that's one app talking to one database. Every piece you add after that, like a cache, a queue, or another service, has to name the problem it solves and point at evidence that the problem is real.

The reason is cost, and it isn't the hosting bill. Every piece is something to deploy, monitor, secure, upgrade, pay for, and debug at 2 a.m. You pay that every day, whether or not the piece ever earns it.

## The 50-user app with seven boxes

You're building a booking app for a friend's yoga studio. About 50 regulars book classes, cancel, and get a confirmation email. You ask an agent to design the architecture, and it comes back with:

- a Next.js frontend and a separate API service
- an auth microservice and a booking microservice
- Redis to cache the class schedule
- a queue and workers to send emails
- an event bus so services can react to "booking created"
- all of it on Kubernetes

None of that is wrong in general. Large companies run exactly this. So go box by box and ask what problem each one solves for this app.

- **Redis for the schedule.** The schedule is a few dozen rows. Postgres returns that in about the time of one network round trip. Nothing has been measured as slow, so there's nothing for a cache to fix, and now there's a second copy of the schedule that can go stale.
- **A queue for emails.** Sending one confirmation through an email API is one HTTP call. If you don't want the user waiting on it, Next.js's `after()` runs work after the response is sent. A queue would buy durable retries, and a missed yoga confirmation isn't worth a new system.
- **Microservices.** There's one developer. Splitting auth from bookings turns a function call into a network call that can time out, and a database transaction into something you have to coordinate by hand.
- **An event bus.** There's one thing that reacts to a booking: the email. You can call it directly.
- **Kubernetes.** Running a cluster is a job, and nobody here has that job. Vercel already runs the app.

The right architecture is one Next.js app on Vercel, Postgres on Neon, and an email provider. It's three pieces, and two of them are managed by someone else.

## What complexity actually costs

Every extra piece adds failure modes the simple version doesn't have. Two services means a network between them, so you need timeouts, retries, and a plan for when one is up and the other is down. A cache means two copies of the truth, so you need a plan for when they disagree. A queue means work can run twice or sit stuck, so you need idempotent consumers and something watching the backlog.

Dan McKinley's "Choose Boring Technology" makes the same argument from the operations side. Adding a technology is easy, and living with it is hard. He suggests thinking of a team as having only a few "innovation tokens" to spend on unfamiliar things, so spend them on what makes your product different, not on plumbing. Boring tools have failure modes that are already documented, searchable, and known to your agent.

Reversibility settles it. Adding a cache to a working app is a small, contained change you can make the week you need it. Removing microservices you didn't need is a rewrite. When you're unsure, take the path you can still change cheaply (see [prefer reversible decisions](../principles.md#prefer-reversible-decisions)).

## One app and one database go further than you think

A monolith is one deployable app. It isn't the same as a mess. You can keep clean modules inside it, like `bookings/`, `auth/`, and `email/`, with clear boundaries between folders instead of between servers. Martin Fowler's "MonolithFirst" points out that you rarely know the right service boundaries at the start, and that boundaries are much cheaper to move inside one codebase.

Postgres covers more than people expect. It has JSON columns, full-text search, and row locking that can run a basic job queue:

```sql
-- Each worker claims one pending job. SKIP LOCKED means two workers
-- never grab the same row, and neither waits on the other.
UPDATE jobs SET status = 'running', started_at = now()
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'pending'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING *;
```

That isn't a reason to never use a real queue. It's a reason to wait until you know what you need from one.

## What each piece buys, and what earns it

Each of these is the right answer to a specific problem. Add it when you have that problem, and you can point at the evidence.

| Piece         | What it actually buys                                                               | The trigger that earns it                                                                                      |
| ------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Cache         | Skips repeating expensive work for data that's read often and can be a little stale | A read you measured as slow, after you checked the query plan and indexes, that's hot and tolerates staleness  |
| Queue         | Moves work out of the request, retries it until it succeeds, smooths out spikes     | Work that's slow or unreliable, doesn't need to finish before the response, and must not be lost               |
| Microservices | Teams that deploy and scale their part without coordinating with everyone else      | Several teams stepping on each other in one codebase, or one part with very different scaling or runtime needs |
| Kubernetes    | Scheduling, scaling, and restarting many containers on infrastructure you control   | Many services, people whose job is running the platform, and needs a managed host can't meet                   |
| Event bus     | Many consumers reacting to one event without the producer knowing about them        | Several independent consumers of the same event, owned by different people                                     |

Notice how many triggers mention teams. Microservices and Kubernetes mostly solve organizational problems: many people changing one system at once. If you're one person with an agent, you don't have that problem yet.

Notice also that every trigger is a measurement or a fact about today. "We might get big" isn't one. See [scale from evidence](../principles.md#scale-from-evidence).

## What the vibe-coded version misses

- **Architecture for a company you don't have.** Agents have read a lot of big-company architecture posts, so they suggest big-company architecture. You get the operating cost of a platform team without the team.
- **A cache before anyone measured.** The slow page was a missing index. Now you have the missing index and a stale-data bug, and you're debugging two systems instead of one.
- **Microservices sharing one database.** Every service reads and writes the same tables, so a schema change still needs every service to deploy together. You've kept all the coupling and added network calls. That's a distributed monolith, the worst of both.
- **A queue without idempotent consumers.** Most queues deliver at least once. A worker crashes after sending the email but before acknowledging the message, the message is redelivered, and the customer gets two emails or two charges. See [background jobs and webhooks](background-jobs-and-webhooks.md).
- **Kubernetes for a side project.** Weekends go into YAML, ingress controllers, and certificate renewals instead of the product, and the cluster costs money even when nobody's using the app.
- **An event bus that hides the flow.** "What happens when someone books a class?" no longer has an answer you can read in one file. You have to trace it through subscribers.
- **Redis as a second source of truth.** Data gets written to the cache and not the database, and a restart or eviction loses it.

## What I'd do

My default for a new project is in the [side-project stack](../recipes/side-project-stack.md): one Next.js app on Vercel, Postgres on Neon with Drizzle, and managed services for email and auth. Background work that can be lost, like analytics, goes in `after()`. Before I add anything else, I write down the problem it solves and the number that proves the problem is real, and I put that note in `PROJECT.md`.

Here's what would change my mind:

- **A cache,** once a measured read is slow after indexing and is hit far more than it changes. I'd start with Next.js caching (`'use cache'`, or `'use cache: remote'` when instances need to share it) before running a separate Redis.
- **A queue,** once there's work that takes longer than a request should, or has to survive a crash and retry, like processing uploads or syncing with a flaky API. I'd start with a jobs table or a managed queue, never a self-hosted broker.
- **A second service,** once one part needs a different runtime or scales completely differently, like a Python worker for a model, or once more than one team is working in the codebase.
- **Kubernetes,** basically never on my own projects. If managed hosting can't do what I need, that's the time to re-shape the problem first.

## What changes at scale

- Services split along team lines, because the real cost becomes coordination between people, not computers.
- Caches and queues stop being exceptions and become standard parts of the system, with owners, dashboards, and alerts.
- A platform team makes Kubernetes cheap per service, so the math that ruled it out for you flips for them.
- Not splitting starts to cost more than splitting: slow builds, risky deploys, and many people blocked on one codebase.

## Sources

- [Dan McKinley, "Choose Boring Technology" (2015)](https://mcfunley.com/choose-boring-technology)
- [Martin Fowler, "MonolithFirst" (2015)](https://martinfowler.com/bliki/MonolithFirst.html)
- [PostgreSQL: SELECT, the locking clause and SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [Next.js: `after`](https://nextjs.org/docs/app/api-reference/functions/after)
