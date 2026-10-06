---
title: Defaults
description: What Tommy actually reaches for on side projects, and what would change it.
freshness: fast-moving
reviewed: 2026-10-06
---

This is what I reach for on my own projects. It isn't a mandate, and it isn't my work stack. My day job runs on Java and Spring, which says what I can work in, not what I pick for myself. Reuse whatever an existing project already does well. Tools, versions, and pricing change fast, so check current docs before relying on any of them.

| Decision      | I start with                                                 | I change it when                                                      |
| ------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Existing repo | Its current patterns                                         | They block the requirement or cause a real defect                     |
| Web app       | Next.js, React, and TypeScript                               | The problem is a different shape: a CLI, a native app, a content site |
| Content site  | A static-first framework, like Astro for this site           | Pages need per-user or per-request data                               |
| Hosting       | Vercel for Next.js apps, a free static host for static sites | Limits, cost, or a runtime I need outgrow it                          |
| App shape     | One deployable app                                           | A part needs to scale, deploy, or fail on its own                     |
| AI features   | A hosted model API                                           | Cost, latency, or privacy calls for a different model or setup        |

## Data: pick by shape, not habit

I don't have a default database. I've used DynamoDB, Firestore, MySQL, Mongo, Redis, and Google Sheets, and the choice follows what the data looks like:

- **Records that reference each other, or writes that must succeed together:** a managed relational database.
- **Independent documents read by key, like one settings blob per user:** whatever managed document or key-value store the platform makes easiest.
- **A tiny tool for people who already live in a spreadsheet:** the spreadsheet can be the database. Backpacks ran on Google Sheets with OAuth, and that was the right call.
- **Caching or rate limiting:** a managed Redis-style store, once something measured says you need it.

## Watch the pricing cliff

Free tiers are fine until they aren't. Before picking a service, find its pricing cliff: the usage level where the bill or the limits jump. I'd rather run cheap experiments on managed services than operate infrastructure for fun.
