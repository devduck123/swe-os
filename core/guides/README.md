---
title: The track
description: A path from "it works on my machine" to software you'd put your name on. Written for people, readable by agents.
---

AI can write the code now. What it can't do for you is know what the happy path is hiding. This track is the difference between a vibe coder and an engineer, one stop at a time. Read it in order, or jump to what you need. Agents load the same pages when a concern points to them, so a lesson only has to be written once.

Every stop ends with **What the vibe-coded version misses**, and every recommendation starts from the simplest thing that works.

## The track

1. [Vibe coder vs. engineer](vibe-coder-vs-engineer.md): what actually separates them, and why it isn't typing speed.
2. [How a request travels through your app](how-a-request-travels.md): the one mental model everything else hangs on.
3. [What a complete frontend feature includes](complete-frontend-features.md): why "matches the screenshot" isn't done.
4. [Secrets and safety when agents write your code](secrets-and-agent-safety.md): keeping keys, data, and your bill out of trouble.
5. [Local first, then managed services](local-first-then-managed.md): from your laptop to free tiers to paying, one service at a time.
6. [Timeouts, retries, and idempotency](timeouts-retries-idempotency.md): what happens when the network doesn't cooperate.
7. [Learning while agents write the code](learning-with-agents.md): how to keep getting better while agents do the typing.
8. [The side-project stack](../recipes/side-project-stack.md): all of it, put together into something you can ship this weekend.

## Beyond the track

Planned guides, written as real projects need them. Fundamentals come before tools: caching before Redis, messaging before Kafka.

- **Foundations:** state, boundaries, contracts, and validation. Latency, throughput, concurrency, and failure.
- **Understand:** turning a vague idea into a problem worth solving. Reading an unfamiliar codebase.
- **Design:** simplicity vs. overengineering. Data modeling, transactions, and indexes. API and security boundaries.
- **Build:** background jobs and async work.
- **Verify:** testing for confidence, not coverage.
- **Ship:** CI/CD and deployment you can undo. Schema migrations without downtime.
- **Operate:** observability and production debugging.
- **Improve:** refactoring and paying down debt on purpose.
- **AI engineering:** building with coding agents. Building AI products.

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
