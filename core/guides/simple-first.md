---
title: 'Simple first: when complexity earns its place'
description: Most new web apps need one app and one database. Every piece after that has to name today's problem and the evidence that it's real.
stage: design
track: 4
concerns: [performance, reliability, cost, dependencies]
freshness: durable
status: draft
---

Build the simplest thing that fully solves today's problem. Every service, layer, or package is something to deploy, secure, upgrade, and debug, whether or not it earns its place. Agents don't weigh that cost unless you ask.

## Easy to miss

- **"Set it up properly" gets you every tutorial at once.** A separate API, a browser state store, three layers of files per feature, Redis, and Docker, for 50 users. Ask what each piece solves for this app.
- **Every piece adds a way to fail.** Two servers means a network between them. A cache, a stored copy of an answer, means two copies of the truth that can disagree. A queue, a list of jobs a background worker picks up later, means work that can run twice or sit stuck.
- **A browser store that copies server data is a second source of truth.** Libraries like Redux keep their own copy in the browser. Every write now has to update both, or someone books a class that's already full.
- **Adding is cheap later, removing is a rewrite.** A cache is a small change the week you need it. Folding a separate API back into the app touches everything.
- **"We might get big" isn't evidence.** A cache is earned by a page you timed as slow even with the right indexes, the lookups a database keeps so it doesn't read every row. A queue, by work that's slow, flaky, and must not be lost. A separate API, by a second client, like a mobile app calling the same backend.
- **Layers cost reading time.** Each is another file to open before the code that matters, for you and every agent after you.
- **Every package is code you didn't read.** Agents sometimes invent plausible package names, and attackers register them. Check that it exists with real downloads and recent releases, or skip it if the platform does the job.
- **A free tier isn't a plan.** Before you pick a service, find where the bill jumps and how you'd get your data out.

**How I do it:** one Next.js app and one Postgres database, and nothing else until `PROJECT.md` names the problem it solves and the number that proves it, like "the schedule page takes 3 seconds with 2,000 classes."

**Ask your agent:** "Before you add any service, package, or layer, tell me what problem it solves in this app today and how we'd know. If the answer is 'we might need it later', don't add it, and tell me what's already here that we could remove."

## Go deeper

- [Dan McKinley: Choose Boring Technology](https://mcfunley.com/choose-boring-technology)
- [Martin Fowler: MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html)
