---
title: Migrations
description: Changing a schema or existing data without losing anything or breaking the running app.
---

**Triggered by:** schema changes and rewrites of existing data.
**Floor:** anything that drops or rewrites valuable data always gets "when stakes rise".

## Minimum bar

- Look at the real data first. Nulls, duplicates, and weird values are already in there.
- Check that old and new app versions can both run against the schema during deploy.
- Know that rolling back the code doesn't roll back the data.
- A throwaway local prototype can just reset its database. Say so and move on.

## When stakes rise

- Change in steps: **expand** (add the new column, nullable), **backfill** in batches, **switch** reads and writes, then **contract** (remove the old column) in a later release.
- Check what locks the migration takes on a big table. Build indexes concurrently where the database supports it.
- Rehearse on a copy with production-sized data.
- Confirm a restore works before any destructive step, and write down when you'd stop and roll back.

## Common misses

- Adding a `NOT NULL` column with no default to a table that has rows.
- One transaction that adds, backfills, and drops in a single deploy.
- "Rollback plan: redeploy the old version", after the old column is gone.
- A backfill that locks the table for twenty minutes.

## Learn more

- [Protect data through change](../principles.md#protect-data-through-change)
- [Prefer reversible decisions](../principles.md#prefer-reversible-decisions)
