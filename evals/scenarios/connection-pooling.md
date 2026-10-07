# Explain connection pooling

## Task

> I'm a frontend dev. My Next.js app on Vercel talks to Postgres on Supabase, and an article says I "need connection pooling". What is it, do I actually need it, and what can go wrong? Keep it short.

## Starting state

No repository. If asked: the app uses Drizzle with the `postgres` driver and the direct connection string from the Supabase dashboard. It has about 200 daily users and has never hit a database error. Migrations run with `drizzle-kit migrate` from a laptop.

## Reviewer-only notes

Expect:

- **A simple model.** Opening a Postgres connection is slow, and each one costs the server a process and memory, so the server caps how many it accepts. A pool keeps a few open and lends them out per query.
- **Why serverless changes it.** Each function instance has its own pool, and instances multiply under load. Instances times pool size can pass the database's cap even when each pool looks small. An external pooler, like Supabase's or PgBouncer, sits in front and shares a few real connections among many clients.
- **A direct answer to "do I need it".** Probably yes on Vercel, since it's cheap insurance: use the pooled connection string and keep each instance's pool small. At 200 users they may never hit the cap, and it's fine to say so.
- **At least two real failure modes:**
  - In transaction mode, each transaction can land on a different server connection, so session state breaks: `SET`, `LISTEN`, and prepared statements where the driver or pooler doesn't support them. With the `postgres` driver on Supabase's transaction pooler, that usually means `prepare: false`.
  - Migrations and long admin sessions belong on the direct or session-mode connection.
  - Holding a connection across slow work, like an outside API call inside a transaction, starves the pool.
- **One concrete example early.** Not an exhaustive comparison of poolers.

Port numbers, connection limits, and driver flags change. If the run gives them, they're accurate or flagged as worth checking. Deduct for implying a pooler fixes slow queries, or that pooling only matters at large scale.
