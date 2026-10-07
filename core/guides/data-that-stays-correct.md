---
title: Data that stays correct
description: 'Constraints, transactions, and indexes: let the database remember the rules your code will eventually forget.'
domain: data
stage: design
freshness: durable
status: draft
reviewed: 2026-10-06
track: 5
concerns: [data, concurrency, performance]
---

Your database is the one part of your app that remembers. Code gets rewritten every week, often by an agent that never saw last month's version. The rows stay, and every future version of your code has to live with them.

So write down what must be true about your data in the schema itself. `NOT NULL`, `UNIQUE`, foreign keys, and `CHECK` are rules the database enforces on every write, from every code path, forever. Your code forgets. Constraints don't.

## Happy-path code lets bad data in quietly

Say you're selling a limited drop of 50 hoodies from a side project. The agent writes checkout like this: look up the product, check `stock > 0`, insert the order, then set stock to `stock - 1`.

Launch day, three things happen. Two people buy the last hoodie in the same second. Both reads see `stock = 1`, both pass the check, and you've sold 51. A deploy fails halfway through one checkout, after the order insert and before the stock update, so stock is now wrong in the other direction. And a bug in the admin page deletes a product, leaving 30 orders pointing at an ID that no longer exists.

None of these throws an error. You find them weeks later, in a refund request or a report that doesn't add up. A crash at least tells you something broke.

## You need this once data outlives a request

You need constraints as soon as you store anything you can't regenerate: users, orders, anything that came from a person. You need transactions when one action writes more than one row and those writes only make sense together. You need indexes once a table grows past what fits in a quick scan, which is earlier than you think.

You can relax for a prototype you'll reset or a cache you can rebuild. Even there, I'd keep `NOT NULL` and primary keys. They cost nothing.

## Write the rules into the schema

Start from what's true in the domain, not from the screen you're building. An order belongs to exactly one user. A product's stock is never negative. Two accounts can't share an email. Each of those sentences maps to a constraint:

```ts
export const products = pgTable(
  'products',
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    priceCents: integer().notNull(),
    stock: integer().notNull(),
  },
  (t) => [
    check('stock_not_negative', sql`${t.stock} >= 0`),
    check('price_positive', sql`${t.priceCents} > 0`),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    productId: uuid()
      .notNull()
      .references(() => products.id),
    totalCents: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('orders_user_created_idx').on(t.userId, t.createdAt)],
);
```

Now the 51st hoodie fails at the database: the `CHECK` rejects stock going to `-1`. The deleted product can't happen either, because the foreign key refuses to delete a product that orders still point at. You decide on purpose what should happen instead: block it (the default), cascade the delete, or set the reference to null.

Uniqueness belongs here too. "Check if the email exists, then insert" is a race. Two signups can both pass the check. A unique index makes the second insert fail, however close together they arrive. Catch that error and show "that email is taken."

## Writes that belong together go in one transaction

A transaction makes several writes succeed or fail as one unit. If anything inside throws, Postgres rolls all of it back, and nobody else ever sees the half-finished state.

Checkout should be one transaction, and the stock check should be part of the write instead of a separate read:

```ts
await db.transaction(async (tx) => {
  const [reserved] = await tx
    .update(products)
    .set({ stock: sql`${products.stock} - 1` })
    .where(and(eq(products.id, productId), gt(products.stock, 0)))
    .returning({ priceCents: products.priceCents });

  if (!reserved) throw new SoldOutError(); // 0 rows updated: someone got the last one

  await tx
    .insert(orders)
    .values({ userId, productId, totalCents: reserved.priceCents });
});
```

The conditional `UPDATE` locks the product row while it runs. Two buyers racing for the last hoodie get processed one after the other, and the second one updates zero rows. If the order insert fails, the stock change rolls back with it. The `CHECK` constraint is still there as a backstop if someone writes the decrement differently next month.

One trap with my stack: Neon's HTTP driver doesn't support interactive transactions like this one. Use the WebSocket driver (`drizzle-orm/neon-serverless`) or a regular `pg` connection for code that needs `db.transaction`.

Keep transactions short. Don't call Stripe or send email inside one: you'd hold locks while waiting on the network, and the email can't roll back. [Timeouts, retries, and idempotency](timeouts-retries-idempotency.md) covers what to do with side effects after commit.

## Index the queries you actually run

An index is a sorted copy of some columns that lets Postgres jump to matching rows instead of reading the whole table. Without one, "this user's last 20 orders" means scanning every order anyone ever placed. At 50 rows that takes no time. At 500,000 it's your slowest page.

Index for the queries you run, not every column. Look at your `WHERE`, `JOIN`, and `ORDER BY` clauses. The orders index above matches this query:

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20;
```

In the plan, a `Seq Scan` on a big table is the thing to look for. An `Index Scan` using your index is what you want. Two catches. Postgres doesn't index foreign key columns automatically. And with 20 rows in dev, the planner picks a sequential scan anyway because it's faster. Seed realistic volume before you trust a plan.

The other classic is **N+1 queries**: load 50 orders, then loop and fetch each order's product one at a time. That's 51 round trips. Locally that's nothing. From a serverless function to a hosted database, each round trip pays network latency, and the page crawls. Fetch them in one query with a join, `inArray`, or Drizzle's relational `with`.

## Small choices that are expensive to change later

**Money is integer cents.** Floats can't represent most decimal fractions exactly, so `0.1 + 0.2` is `0.30000000000000004` in JavaScript, and rounding errors pile up across a ledger. Store `1999` with a `currency` column. Stripe's API takes amounts the same way, in the currency's smallest unit. Use `numeric` if you truly need fractions of a cent, like per-token AI pricing.

**Timestamps carry a time zone.** Use `timestamptz` (`withTimezone: true` in Drizzle). It stores an absolute instant. Plain `timestamp` stores a wall-clock reading with no zone, and it shifts silently when a server, driver, or developer assumes a different one. If you need "9am in the user's time," store their zone as its own column.

**IDs.** Sequential integers are compact, but in a URL they leak your volume (`/orders/1042`) and invite guessing. I use UUIDs for anything that shows up in a URL. Random UUIDs scatter inserts across the index, which matters on very large tables. Time-ordered UUIDv7 avoids that, and Postgres 18 generates it with `uuidv7()`. An unguessable ID still isn't access control. That's [trust boundaries](trust-boundaries.md).

**Soft vs. hard delete.** A `deleted_at` column lets you undo and keep history. It also means every query must remember to filter it out. Your unique email constraint now blocks a deleted user from signing up again unless you make it a partial index (`WHERE deleted_at IS NULL`). And "delete my account" never actually deletes, which is a [privacy](../concerns/privacy.md) problem. I hard-delete by default and soft-delete only where undo or an audit trail is a real requirement.

## What the vibe-coded version misses

- **Uniqueness checked in code.** "Does this email exist? No? Insert." Two simultaneous signups both pass, and now one email has two accounts and two password resets.
- **No foreign keys.** Deleting a user leaves their orders, comments, and files pointing at nothing. Pages crash on a missing join, and the orphans pile up until someone writes a cleanup script.
- **A multi-step write without a transaction.** The order saves, the stock update fails, and your inventory is wrong with no error anywhere.
- **A JSON blob that became the real schema.** `metadata jsonb` starts as a convenience. Six months later the app filters, sorts, and joins on fields inside it, with no types, no constraints, and no indexes. Store raw payloads as JSON. Promote anything you query to a real column.
- **Floats for money.** Totals are off by a cent, and reconciliation with your payment provider never quite matches.
- **Missing indexes, found at 10k rows.** Fine in dev with 20 rows, a full table scan in production. Usually it's a foreign key column nobody indexed.
- **`timestamp` without a time zone.** Events land an hour off after a daylight saving change or a server move.

## What I'd do

For a new Next.js app on Postgres with Drizzle:

- Write the schema from domain sentences. Every column `notNull()` unless null means something specific. Foreign keys on every relationship. A unique index for every "there can only be one". A `check` for every range rule.
- Integer cents with a currency column, `timestamptz` everywhere, UUID primary keys.
- Wrap any action that writes two or more related rows in `db.transaction`, and put the condition inside the `UPDATE` instead of in a separate read.
- Add indexes for the foreign keys and the two or three queries each main page runs. Check them with `EXPLAIN ANALYZE` against a few thousand seeded rows.
- Hard delete, with `ON DELETE` behavior chosen per relationship.

I'd add caching or read replicas only when `EXPLAIN` says a query is as good as it gets and it's still too slow. I'd add soft delete or an audit table when someone actually needs undo or history.

## What changes at scale

- **Constraints and indexes get expensive to add.** Adding a constraint or index to a table with millions of rows needs the careful steps in [database changes without downtime](database-changes-without-downtime.md). Getting them right on day one is the cheap version.
- **Isolation levels start to matter.** Postgres defaults to Read Committed. Some invariants that span rows, like "a room can't be double-booked," need `SERIALIZABLE`, an exclusion constraint, or explicit locks.
- **Write contention.** One hot row, like a global counter, becomes a bottleneck because every transaction waits on its lock.
- **Partitioning and archiving.** Huge append-only tables like events and logs get split by time so old data can be dropped cheaply.

## Sources

- [PostgreSQL: Constraints, including foreign key indexing](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL 18 release announcement (`uuidv7()`)](https://www.postgresql.org/about/news/postgresql-18-released-3142/)
- [Drizzle: Indexes and constraints](https://orm.drizzle.team/docs/indexes-constraints)
- [Drizzle: Connect to Neon (HTTP vs. WebSocket drivers)](https://orm.drizzle.team/docs/connect-neon)
- [Stripe: Amounts in the currency's minor unit](https://docs.stripe.com/currencies)
