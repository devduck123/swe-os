---
title: Data and storage
description: Where data lives, who owns it, what keeps it valid, and how you get it back.
---

**Triggered by:** storing data that outlives a request, uploads, schema changes, payments.
**Floor:** payments and destructive data changes always get "when stakes rise".

## Minimum bar

- Decide where the data lives and which code owns writes to it.
- Let the database enforce what must be true: `NOT NULL`, unique, foreign keys, checks. Application code forgets; constraints don't.
- Handle a failed write. Don't leave half a record or an orphaned file behind.
- Know how the data gets deleted.

## When stakes rise

- Wrap multi-step writes in a transaction.
- Add indexes for the queries you actually run, and check the query plan.
- Set up backups and practice a restore with real-shaped data. A backup you haven't restored is a hope.
- Plan reconciliation for data that also lives in another system, like a payment provider.

## Common misses

- Uniqueness checked in code with a read-then-write race, instead of a unique index.
- Files uploaded to storage with no record pointing to them, or records pointing to missing files.
- A JSON blob column that slowly becomes the real schema.
- Timestamps without time zones.

## Learn more

- [Protect data through change](../principles.md#protect-data-through-change)
