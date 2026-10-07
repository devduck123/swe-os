---
title: The track
description: A path from "it works on my machine" to software you'd put your name on. Written for people, readable by agents.
---

AI can write the code now. What it can't do for you is know what the happy path is hiding. This track is the difference between a vibe coder and an engineer, one stop at a time. Read it in order, or jump to what you need. Agents load the same pages when a concern points to them, so a lesson only has to be written once.

Every stop ends with **What the vibe-coded version misses**, and every recommendation starts from the simplest thing that works.

## The track

The track follows the lifecycle of real work, from understanding the problem to running the thing in production. Each stage is a few stops.

### Understand

1. [Vibe coder vs. engineer](vibe-coder-vs-engineer.md): what actually separates them, and why it isn't typing speed.
2. [How a request travels through your app](how-a-request-travels.md): the one mental model everything else hangs on.
3. [Shape before you build](shape-before-you-build.md): a problem worth solving, a small first slice, and what "done" means.

### Design

4. [Simple first](simple-first.md): when queues, caches, and services earn their place, and when they don't.
5. [Data that stays correct](data-that-stays-correct.md): constraints, transactions, and indexes do the remembering for you.
6. [Trust boundaries](trust-boundaries.md): validate what comes in, and make sure every user only touches what's theirs.
7. [Timeouts, retries, and idempotency](timeouts-retries-idempotency.md): what happens when the network doesn't cooperate.

### Build

8. [Local first, then managed services](local-first-then-managed.md): run everything on your laptop on day one, then add free tiers one service at a time.
9. [What a complete frontend feature includes](complete-frontend-features.md): why "matches the screenshot" isn't done.
10. [Accessibility in practice](accessibility-in-practice.md): keyboards, screen readers, zoom, and the five-minute check.
11. [AI features in production](ai-features-in-production.md): untrusted output, prompt injection, cost, and quality you can measure.
12. [Secrets and safety when agents write your code](secrets-and-agent-safety.md): keeping keys, data, and your bill out of trouble.
13. [Background jobs and webhooks](background-jobs-and-webhooks.md): work outside the request, without running it twice or never.

### Verify

14. [How you know it works](how-you-know-it-works.md): tests that buy confidence, not coverage numbers.
15. [Reading and reviewing code you didn't write](reading-and-reviewing-code.md): including everything your agents wrote.

### Ship

16. [Shipping changes you can undo](shipping-changes-you-can-undo.md): CI, previews, flags, and rollbacks.
17. [Database changes without downtime](database-changes-without-downtime.md): because rolling back code doesn't roll back data.

### Operate

18. [Knowing it broke before your users do](knowing-it-broke.md): the smallest observability setup that actually helps.
19. [When production breaks anyway](when-production-breaks.md): debugging live, staying calm, and restores you've tested.
20. [Performance and cost](performance-and-cost.md): measure first, then fix the bottleneck you actually have.

### Improve

21. [Learning while agents write the code](learning-with-agents.md): how to keep getting better while agents do the typing.

### Put it together

22. [The side-project stack](../recipes/side-project-stack.md): all of it, in one stack you can ship this weekend.

## Beyond the track

Planned guides, written as real projects need them. Fundamentals come before tools: caching before Redis, messaging before Kafka.

- **Foundations:** latency, throughput, and concurrency in depth. How Git actually works.
- **Design:** event-driven systems. Multi-tenant data. Search.
- **Build:** real-time features. Payments. Email that lands.
- **Operate:** SLOs and error budgets. Disaster recovery drills.
- **Improve:** refactoring and paying down debt on purpose. Postmortems that change something.
- **AI engineering:** building with coding agents, beyond learning alongside them.

## How a guide is built

Every guide is written as Tommy (see [Voice](../../profile/voice.md#know-which-voice-youre-in)) and follows [Learning](../../profile/learning.md#teach-the-shape-before-the-machinery): the simple model, why it exists, when you need it and when you don't, how it works, what goes wrong, what I'd do, and what changes at scale. Headings state the point, so skimming the headings alone teaches something.

Two sections are required in every guide:

- **What the vibe-coded version misses.** The specific things an AI-built happy path leaves out, and what each one costs when it bites.
- **What I'd do.** Starting from the simplest option that works, then what would make me add more.

Each guide's frontmatter records:

| Field       | Values                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `domain`    | foundations, frontend, backend, data, architecture, infrastructure, security, reliability, testing, ai |
| `stage`     | understand, design, build, verify, ship, operate, improve                                              |
| `freshness` | **durable** (fundamentals), **evolving** (practices), **fast-moving** (products, pricing, AI tools)    |
| `status`    | **outline** (structure only), **draft** (written, not yet checked by Tommy), **reviewed**              |
| `track`     | Its stop on the track, if it has one                                                                   |
| `reviewed`  | The date the claims were last checked. Required for fast-moving guides.                                |
| `concerns`  | The concern pages that point here                                                                      |

AI can outline and draft guides. A guide stays a draft until a person has verified the technical claims, improved the examples, and made the recommendation their own.
