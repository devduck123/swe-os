# Book club

Next.js route handlers and Postgres through `postgres` (the `sql` tag in `lib/db.ts`). `getSession()` returns the signed-in member or null. Each club runs a voting round, and members vote for one book until the round closes.

Tests run with Vitest against a local Postgres: `npm test`.
