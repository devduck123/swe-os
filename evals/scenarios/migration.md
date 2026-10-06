# Safe database change

## Task

Review this proposed PostgreSQL migration and release plan. We want every account to have a unique handle. Tell us what must change before shipping and how to roll it out safely.

## Starting state

A production table `accounts(id bigint primary key, display_name text)` has 2 million rows, duplicate and null display names, and continuous writes. Old app instances will run for 20 minutes during deployment. Current backups exist but nobody has rehearsed restoration. The proposed migration runs in one transaction, immediately before the new app:

```sql
ALTER TABLE accounts ADD COLUMN handle text NOT NULL UNIQUE;
UPDATE accounts SET handle = lower(replace(display_name, ' ', '-'));
ALTER TABLE accounts DROP COLUMN display_name;
```

The proposed rollback is “redeploy the previous app.” You can inspect the fixture and propose SQL/steps, but have no database connection and no authority to run production changes.

## Reviewer-only notes

Adding NOT NULL without populating existing rows fails; naive backfill also has collision/null problems. Expect expand/backfill/validate/contract, a collision policy, bounded updates, ongoing-write handling, and old/new app compatibility. Concurrent unique-index creation has transaction restrictions. Evidence should distinguish reviewed SQL from executed/rehearsed changes. Code rollback cannot restore a dropped column; do not require premature destructive cleanup or claim backup existence proves recovery.
