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

Your database is the one part of your app that remembers. Code gets rewritten every week, often by an agent that never saw last month's version. The rows stay. So write what must be true about your data into the schema: `NOT NULL`, `UNIQUE`, foreign keys, and `CHECK` run on every write, from every code path, forever. Your code forgets. Constraints don't.

## Happy-path code lets bad data in quietly

Say you're selling a drop of 50 hoodies. The agent's checkout looks up the product, checks `stock > 0`, inserts the order, then sets stock to `stock - 1`.

Launch day, three things happen. Two people buy the last hoodie in the same second. Both reads see `stock = 1`, both pass the check, and you've sold 51. One checkout's function times out after the order insert and before the stock update, so stock is now wrong the other way. And a bug in the admin page deletes a product, leaving 30 orders pointing at an ID that no longer exists.

None of these throws an error. You find them weeks later, in a refund request or a report that doesn't add up. You need constraints as soon as you store anything you can't regenerate.

## Write the rules into the schema

Start from what's true in the domain, not from the screen you're building. An order belongs to one user. Stock is never negative. A user books a given class once. Each sentence maps to a constraint:

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

Now the 51st hoodie fails: the `CHECK` rejects stock going to `-1`. The foreign key refuses to delete a product that orders still point at. Per relationship, you choose to block (the default), cascade, or set null.

This schema leaves column names out, so `userId` becomes a column literally named `"userId"`. To get `user_id`, pass `casing: 'snake_case'` to both `drizzle()` and `drizzle.config.ts`. Drizzle 1.0, still a release candidate, replaces that option with `snakeCase.table()`.

## Uniqueness is a constraint, not a check

"Has this user booked this class? No? Insert." is a race. A double-tap sends two requests, both pass the check, and one person holds two of the ten spots. A unique index on `(user_id, class_id)` makes the second insert fail, however close together they arrive. Catch that error and show "you're already booked."

Stop 3's [habit tracker](shape-before-you-build.md) needs it too:

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

Tapping "Done today" twice now records one check-in. And a calendar day is a `date`, not an instant: store `2026-10-06`, computed from the user's time zone, and the 11:50 p.m. check-in in California stays on the right day. Use `timestamptz` for instants, like when an order was placed.

## Writes that belong together go in one transaction

A transaction makes several writes succeed or fail as one unit. Put the stock check inside the write, not in a separate read:

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

The conditional `UPDATE` locks the product row until the transaction commits. Two buyers racing for the last hoodie go one after the other: the second waits, rechecks `stock > 0`, and updates zero rows. If the order insert fails or the function dies, the stock change rolls back too.

Because the lock lasts until commit, keep transactions short. Don't call Stripe or send email inside one: everyone else waits on your network call, and the email can't roll back ([what to do instead](timeouts-retries-idempotency.md)). This pattern is safe with Postgres's default settings. Rules that span rows, like "no overlapping room bookings," need an exclusion constraint or `SERIALIZABLE` isolation.

Neon's HTTP driver can't run interactive transactions like this one. The [side-project stack](../recipes/side-project-stack.md) picks a driver that can.

## With Stripe Checkout, reserve stock before payment

If you decrement only when `checkout.session.completed` arrives, two people can pay for the last hoodie. Instead, reserve with the transaction above when you create the Checkout Session, and set its `expires_at` (30 minutes at the earliest, 24 hours at the latest). If it expires unpaid, Stripe sends `checkout.session.expired` and your webhook puts the stock back. `checkout.session.completed` marks the order paid. Either event can arrive twice, so [dedupe by event ID](background-jobs-and-webhooks.md).

## Index the queries you actually run

An index lets Postgres jump to matching rows instead of reading the whole table. Without one, "this user's last 20 orders" scans every order ever placed. At 500,000 rows, that's your slowest page. Index your `WHERE`, `JOIN`, and `ORDER BY` columns. Postgres doesn't index foreign keys for you.

Check with `EXPLAIN ANALYZE`: a `Seq Scan` on a big table is the problem. With 20 rows in dev the planner scans anyway, so seed a few thousand rows before you trust a plan.

The other classic is **N+1**: load 50 orders, then fetch each order's product in a loop. That's 51 round trips to a hosted database. Use a join, `inArray`, or Drizzle's relational `with`.

## Small choices that are expensive to change later

**Money is integer cents.** In JavaScript, `0.1 + 0.2` is `0.30000000000000004`. Store `1999` with a `currency` column, the way Stripe takes amounts. Use `numeric` only for fractions of a cent.

**IDs.** Sequential integers in a URL leak your volume (`/orders/1042`). I use UUIDs, and Postgres 18's `uuidv7()` keeps them time-ordered for the index. An unguessable ID still isn't access control ([trust boundaries](trust-boundaries.md)).

**Hard delete by default.** A `deleted_at` column means every query must filter it, every unique index needs `WHERE deleted_at IS NULL`, and "delete my account" never deletes ([privacy](../concerns/privacy.md)). Soft-delete only where undo or an audit trail is a real need.

## What the vibe-coded version misses

- **Uniqueness checked in code.** A double-tap books one person into a class twice, and someone else gets turned away.
- **No foreign keys.** Deleting a user leaves orders pointing at nothing, pages crash on the missing join, and orphans pile up until someone writes a cleanup script.
- **A multi-step write without a transaction.** The function times out between the order and the stock update, and inventory is wrong with no error anywhere.
- **Stock decremented after payment.** Two people pay for the last item, and you refund one of them.
- **A JSON blob that became the real schema.** Six months later the app filters on fields inside `metadata jsonb`, with no types, constraints, or indexes. Promote anything you query to a column.
- **A timestamp for a calendar day.** An evening check-in in California lands on tomorrow's UTC date, and streaks break.

## What I'd do

With Next.js, Postgres, and Drizzle:

- Schema from domain sentences: `notNull()` unless null means something, foreign keys everywhere, a unique index for every "only one", a `check` for every range rule.
- Integer cents, `timestamptz` for instants, `date` for calendar days, UUID keys.
- `db.transaction` for any action that writes related rows, with the condition inside the `UPDATE`.
- Indexes on foreign keys and each main page's queries, checked with `EXPLAIN ANALYZE` on seeded data.

I'd add caching or a read replica only when `EXPLAIN` says a query is as good as it gets and it's still too slow. Constraints are cheapest on day one. On a big table they take [extra steps](database-changes-without-downtime.md).

## Sources

- [PostgreSQL: Constraints, including foreign key indexing](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL: Explicit locking (row locks are held until the transaction ends)](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL 18 release announcement (`uuidv7()`)](https://www.postgresql.org/about/news/postgresql-18-released-3142/)
- [Drizzle: Indexes and constraints](https://orm.drizzle.team/docs/indexes-constraints)
- [Drizzle: v0 to v1 changes (`casing` and `snakeCase.table`)](https://orm.drizzle.team/docs/v0-v1-changes)
- [Drizzle: Connect to Neon (HTTP vs. WebSocket drivers)](https://orm.drizzle.team/docs/connect-neon)
- [Stripe: Manage limited inventory with Checkout](https://docs.stripe.com/payments/checkout/managing-limited-inventory)
- [Stripe: Amounts in the currency's minor unit](https://docs.stripe.com/currencies)
