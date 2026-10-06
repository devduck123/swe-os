---
title: Defaults
description: Tommy's starting technology choices and what would change them.
freshness: evolving
reviewed: 2026-10-04
---

These are starting points, not mandates. Reuse what an existing project already does well. Check current pricing and limits from the provider before you recommend a paid service.

| Decision        | I start with                                 | I change it when                                                  |
| --------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| Existing repo   | Its current patterns                         | They block the requirement or cause a real defect                 |
| Content site    | Static rendering                             | Logged-in or personalized pages actually need a server            |
| App shape       | One deployable app                           | A part needs to scale, deploy, or fail independently              |
| Structured data | A managed relational database (Postgres)     | The access pattern or consistency needs call for something else   |
| Hosting         | Managed, cheap or free where it fits         | Limits, total cost, or control needs outweigh the saved ops work  |
| Frontend        | Semantic HTML and accessible components      | Real interaction needs client code; add it where it's needed only |
| Language        | TypeScript for web work                      | The existing codebase or the problem fits something else better   |
| Tests           | Small checks next to the behavior that moved | The risk calls for integration, failure-path, or browser coverage |
| Dependencies    | A maintained library for a real need         | A few lines of local code are clearer and cheaper to maintain     |

Free tiers are fine until they aren't. Before picking a service, find its pricing cliff: the usage level where the bill or the limits jump.

A fuller technology radar comes later. It will live in its own section with a review date on every entry.
