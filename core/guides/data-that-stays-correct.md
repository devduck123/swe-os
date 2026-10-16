---
title: Data that stays correct
description: 'Constraints, transactions, and indexes: let the database remember the rules your code will eventually forget.'
domain: data
stage: design
freshness: durable
status: reviewed
reviewed: 2026-10-06
track: 5
concerns: [data, concurrency, performance]
---

Your database is the one part of your app that remembers. Code gets rewritten every week, often by an agent that never saw last month's version. The rows stay. So write what must be true about your data into the schema as constraints: rules the database checks on every write, from every code path, forever. Your code forgets. Constraints don't.

## Happy-path code lets bad data in quietly

Say you're selling a drop of 50 hoodies. The agent's checkout looks up the product, checks `stock > 0`, inserts the order, then sets stock to `stock - 1`.

Launch day, three things happen. Two people buy the last hoodie in the same second. Both reads see `stock = 1`, both pass the check, and you've sold 51. One checkout's function times out after the order insert and before the stock update, so stock is now wrong the other way. And a bug in the admin page deletes a product, leaving 30 orders pointing at an ID that no longer exists.

The first one is a race condition: two requests run at the same moment, and both pass a check meant to let only one through. None of these throws an error. You find them weeks later, in a refund request or a report that doesn't add up. You need constraints as soon as you store anything you can't regenerate.

## Write the rules into the schema

Start from what's true in the domain, not from the screen you're building. An order belongs to one user. Stock is never negative. A user books a given class once. Each sentence maps to a constraint:

- **`NOT NULL`:** the column always has a value.
- **`UNIQUE`:** no two rows share this value.
- **Foreign key:** the column must point at a row that exists in another table.
- **`CHECK`:** any rule about one row, like `stock >= 0`.

Here they are in Drizzle. Look for `notNull()`, `references()` (a foreign key), and `check`:

```ts
export const products = pgTable(
  'products',
  {
    id: uuid().defaultRandom().primaryKey(),
    priceCents: integer().notNull(),
    stock: integer().notNull(),
  },
  (t) => [check('stock_not_negative', sql`${t.stock} >= 0`)],
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

Now the 51st hoodie fails: the `CHECK` rejects stock going to `-1`. The foreign key refuses to delete a product that orders still point at. You can tell a foreign key to cascade instead (delete the orders too), as the habit tracker below does.

On Supabase without Drizzle, the same rules are plain SQL (`not null`, `unique`, `references`, `check`) in a migration file (a file of schema changes, applied in order).

<details>
<summary>Going deeper: snake_case column names in Drizzle</summary>

This schema leaves column names out, so `userId` becomes a column literally named `"userId"`. To get `user_id`, pass `casing: 'snake_case'` to both `drizzle()` and `drizzle.config.ts`.

</details>

## Uniqueness is a constraint, not a check

"Has this user booked this class? No? Insert." is the same race. A double-tap sends two requests, both pass the check, and one person holds two of the ten spots. A unique index on `(user_id, class_id)` (a lookup the database keeps that also refuses duplicates) makes the second insert fail, however close together they arrive. Catch that error and show "you're already booked."

Stop 3's [habit tracker](shape-before-you-build.md) needs it too. Notice `onConflictDoNothing()`: the second tap becomes a no-op instead of an error.

```ts
export const checkIns = pgTable(
  'check_ins',
  {
    habitId: uuid()
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    day: date().notNull(), // the user's local date
  },
  (t) => [uniqueIndex('check_ins_habit_day').on(t.habitId, t.day)],
);

await db.insert(checkIns).values({ habitId, day }).onConflictDoNothing();
```

A calendar day is a `date`, not an instant: store `2026-10-06`, computed from the user's time zone, and the 11:50 p.m. check-in in California stays on the right day. Use `timestamptz` (a timestamp with time zone) for instants, like when an order was placed.

## Writes that belong together go in one transaction

A transaction is a group of writes that all happen, or none do. Put the stock check inside the write, not in a separate read. Notice that `gt(products.stock, 0)` sits in the `UPDATE`'s `where`, so checking and decrementing are one step:

```ts
await db.transaction(async (tx) => {
  const [reserved] = await tx
    .update(products)
    .set({ stock: sql`${products.stock} - 1` })
    .where(and(eq(products.id, productId), gt(products.stock, 0)))
    .returning({ priceCents: products.priceCents });

  if (!reserved) throw new SoldOutError(); // 0 rows: someone got the last one

  await tx
    .insert(orders)
    .values({ userId, productId, totalCents: reserved.priceCents });
});
```

The `UPDATE` locks the product row: any other write to that row waits until this transaction commits (finishes and saves). Two buyers racing for the last hoodie go one after the other. The second waits, rechecks `stock > 0`, and updates zero rows. If the order insert fails or the function dies, the stock change rolls back (gets undone) too.

Because other writes wait, keep transactions short. Don't call Stripe or send email inside one: everyone else waits on your network call, and an email can't be undone ([what to do instead](timeouts-retries-idempotency.md)).

On Supabase with `supabase-js`, there's no `db.transaction`. Put the writes in a Postgres function and call it with `supabase.rpc()`: each API call runs as one transaction.

<details>
<summary>Going deeper: Neon's HTTP driver, rules that span rows, and Stripe Checkout</summary>

Neon's HTTP driver can't run an interactive transaction like this one, where your code runs between the writes. The [side-project stack](../recipes/side-project-stack.md) picks a driver that can.

This pattern is safe with Postgres's default settings. Rules that span rows, like "no overlapping room bookings," need an exclusion constraint or `SERIALIZABLE` isolation.

With Stripe Checkout, if you decrement only when `checkout.session.completed` arrives, two people can pay for the last hoodie. Instead, reserve with the transaction above when you create the Checkout Session, and set its `expires_at` (30 minutes to 24 hours out). If it expires unpaid, Stripe sends `checkout.session.expired` and your webhook puts the stock back. Either event can arrive twice, so [skip repeats by event ID](background-jobs-and-webhooks.md).

</details>

## Index the queries you actually run

An index is a sorted lookup the database keeps for a column, so it can jump to matching rows instead of reading the whole table. Without one, "this user's last 20 orders" scans every order ever placed. At 500,000 rows, that's your slowest page. Index your `WHERE`, `JOIN`, and `ORDER BY` columns. Postgres doesn't index foreign keys for you.

To check, put `EXPLAIN ANALYZE` in front of the query and run it in a SQL client, like Supabase's SQL Editor. `Seq Scan` on a big table means Postgres read every row: that's the problem. With 20 rows in dev, Postgres reads every row anyway, so seed a few thousand before you trust the result.

The other classic is **N+1**: load 50 orders, then fetch each order's product in a loop. That's 51 round trips to a hosted database. Use a join, `inArray`, or Drizzle's relational `with`. On Supabase, `.select('*, products(*)')` gets both in one request.

## Small choices that are expensive to change later

**Money is integer cents.** In JavaScript, `0.1 + 0.2` is `0.30000000000000004`. Store `1999` with a `currency` column, the way Stripe takes amounts.

**Hard delete by default.** Soft delete, a `deleted_at` column instead of removing the row, means every query must filter it, and "delete my account" never deletes ([privacy](../concerns/privacy.md)). Use it only where undo or an audit trail is a real need.

## What the vibe-coded version misses

- **Uniqueness checked in code:** one person holds two spots, and someone else gets turned away.
- **No foreign keys:** orders point at a deleted product, and pages crash on the missing row.
- **Related writes without a transaction:** inventory is wrong, with no error anywhere.
- **A timestamp for a calendar day:** an evening check-in lands on tomorrow, and streaks break.

## What I'd do

With Next.js, Postgres, and Drizzle:

- Ask your agent: "List the rules this data must always follow, and enforce each one as a constraint."
- Integer cents, `timestamptz` for instants, `date` for calendar days.
- `db.transaction` (on Supabase, a Postgres function called with `rpc()`) for any action that writes related rows.
- To add a rule to an existing table, edit the schema and run `npx drizzle-kit generate`, then `npx drizzle-kit migrate`. On Supabase, `supabase migration new`, then `supabase db push`. If existing rows break the rule, the migration fails, so fix them first. Big tables take [extra steps](database-changes-without-downtime.md).
- Seed a few thousand rows. Ask your agent for a seed script, or on Supabase, write `supabase/seed.sql`, which runs on `supabase db reset`. Then `EXPLAIN ANALYZE` each main page's query.

I'd add caching only when `EXPLAIN` says a query is as good as it gets and it's still too slow. Constraints are cheapest on day one.

## Sources

- [PostgreSQL: Constraints, including foreign key indexing](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL: Explicit locking (row locks are held until the transaction ends)](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL: `ALTER TABLE`](https://www.postgresql.org/docs/current/sql-altertable.html), for new constraints checking existing rows
- [Drizzle: Indexes and constraints](https://orm.drizzle.team/docs/indexes-constraints)
- [Drizzle: v0 to v1 changes (`casing`)](https://orm.drizzle.team/docs/v0-v1-changes)
- [Drizzle: Connect to Neon (HTTP vs. WebSocket drivers)](https://orm.drizzle.team/docs/connect-neon)
- [Drizzle: Migrations (`drizzle-kit generate` and `migrate`)](https://orm.drizzle.team/docs/migrations)
- [PostgREST: Transactions](https://docs.postgrest.org/en/stable/references/transactions.html), the layer under Supabase's API, for one transaction per call; [Supabase: Database functions](https://supabase.com/docs/guides/database/functions) for `rpc()`
- [Supabase: Querying joins and nested tables](https://supabase.com/docs/guides/database/joins-and-nesting)
- [Supabase: Database migrations](https://supabase.com/docs/guides/deployment/database-migrations) and [seeding](https://supabase.com/docs/guides/local-development/seeding-your-database)
- [Stripe: Manage limited inventory with Checkout](https://docs.stripe.com/payments/checkout/managing-limited-inventory)
- [Stripe: Amounts in the currency's minor unit](https://docs.stripe.com/currencies)
