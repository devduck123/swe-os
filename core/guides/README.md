---
title: The track
description: A path from "it works on my machine" to software you'd put your name on. Written for people, readable by agents.
---

AI can write the code now. What it can't do for you is know what the happy path is hiding. This track is the difference between a vibe coder and an engineer, one stop at a time. Read it in order, or jump to what you need. Agents load the same pages when a concern points to them, so a lesson only has to be written once.

Each stop is short on purpose: the idea, the things people and their agents tend to miss, how I do it, and what to ask your agent. It's not a course. When you want the full mechanics, each stop links to the best place to learn them.

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
8. [Caching without stale data](caching-without-stale-data.md): every cache needs an answer to what clears it.

### Build

9. [Local first, then managed services](local-first-then-managed.md): run everything on your laptop on day one, then add free tiers one service at a time.
10. [What a complete frontend feature includes](complete-frontend-features.md): why "matches the screenshot" isn't done.
11. [Accessibility in practice](accessibility-in-practice.md): keyboards, screen readers, zoom, and the five-minute check.
12. [AI features in production](ai-features-in-production.md): untrusted output, prompt injection, cost, and quality you can measure.
13. [Secrets and safety when agents write your code](secrets-and-agent-safety.md): keeping keys, data, and your bill out of trouble.
14. [Running several agents at once](several-agents.md): worktrees, ports, migrations, session cost, and your review queue.
15. [Background jobs and webhooks](background-jobs-and-webhooks.md): work outside the request, without running it twice or never.

### Verify

16. [How you know it works](how-you-know-it-works.md): tests that buy confidence, not coverage numbers.
17. [Reading and reviewing code you didn't write](reading-and-reviewing-code.md): including everything your agents wrote.

### Ship

18. [Shipping changes you can undo](shipping-changes-you-can-undo.md): CI, previews, flags, and rollbacks.
19. [Database changes without downtime](database-changes-without-downtime.md): because rolling back code doesn't roll back data.
20. [Going public](going-public.md): link previews, icons, search, and a privacy page before the first signup.
21. [Shipping a desktop app](shipping-a-desktop-app.md): signing, auto-update, and the old versions you can't take back.

### Operate

22. [Knowing it broke before your users do](knowing-it-broke.md): the smallest observability setup that actually helps.
23. [When production breaks anyway](when-production-breaks.md): stop the damage, debug from evidence, and restore from backups you've tested.
24. [Performance and cost](performance-and-cost.md): measure first, then fix the bottleneck you actually have.

### Improve

25. [Keeping an agent-built codebase healthy](keeping-a-codebase-healthy.md): duplicates, dead code, and cleanup nobody schedules.
26. [Learning while agents write the code](learning-with-agents.md): how to keep getting better while agents do the typing.

### Put it together

27. [The side-project stack](../recipes/side-project-stack.md): all of it, in one stack you can ship this weekend.

## Beyond the track

More stops get written when real projects need them, fundamentals before tools: caching before Redis, messaging before Kafka.

## How a stop is built

Every stop is written as me (see [Voice](../../profile/voice.md#know-which-voice-youre-in)), in the same shape:

- **The idea,** in two to four sentences.
- **Easy to miss:** the considerations a vibe-coded version skips, each a short claim and the reason it's true. Durable truths, not product details. No code. Name a product only as an example: its current API, versions, and prices are for the agent to look up, because they change faster than a page gets reviewed.
- **How I do it:** my default, in one line.
- **Ask your agent:** one plain prompt that puts the stop to work in your project.
- **Go deeper:** one to three links to the best place to learn the mechanics.

A stop is 450 words at most. If a topic needs more, it's probably two stops, or the depth belongs in a link. The recipe at the end of the track ties the stops into one stack, so it gets more room: up to 700 words and four links. AI can draft a stop. It stays a draft until a person has checked the claims and made them their own.
