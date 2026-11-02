---
title: The track
description: A path from "it works on my machine" to software you'd put your name on. Written for people, readable by agents.
---

AI can write the code now. What it can't do for you is know what the happy path is hiding. This track is the difference between a vibe coder and an engineer, one stop at a time. Read it in order, or jump to what you need. Agents load the same pages when a concern points to them, so a lesson only has to be written once.

Each stop is short on purpose: the idea, the things people and their agents tend to miss, and how I do it. It's not a course. When you want the full mechanics, each stop links to the best place to learn them.

## Follow the work from problem to production

The stops follow the lifecycle of real work. Each stage is a few stops.

### Understand

1. [Vibe coder vs. engineer](vibe-coder-vs-engineer.md): the questions that separate them, now that AI writes the code for both.
2. [How a request travels through your app](how-a-request-travels.md): one click traced from the browser to the database, so you know which hop broke.
3. [Shape before you build](shape-before-you-build.md): a problem worth solving, a small first slice, and what "done" means.

### Design

4. [Simple first](simple-first.md): when a separate API, a cache, a queue, or another layer earns its place, and when it doesn't.
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
19. [When production breaks anyway](when-production-breaks.md): stop the damage, debug from evidence, and restore from backups you've tested.
20. [Performance and cost](performance-and-cost.md): measure first, then fix the bottleneck you actually have.

### Improve

21. [Learning while agents write the code](learning-with-agents.md): how to keep getting better while agents do the typing.

### Put it together

22. [The side-project stack](../recipes/side-project-stack.md): all of it, in one stack you can ship this weekend.

## Beyond the track

More stops get written when real projects need them, fundamentals before tools: caching before Redis, messaging before Kafka.

## How a stop is built

Every stop is written as me (see [Voice](../../profile/voice.md#know-which-voice-youre-in)), in the same shape:

- **The idea,** in two to four sentences.
- **Easy to miss:** the considerations a vibe-coded version skips, each a short claim and the reason it's true. Durable truths, not product details. No code.
- **How I do it:** my default, in one line.
- **Go deeper:** one to three links to the best place to learn the mechanics.

A stop stays under 450 words. If a topic needs more, it's probably two stops, or the depth belongs in a link. AI can draft a stop. It stays a draft until a person has checked the claims and made them their own.
