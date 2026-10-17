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

Your database is the one part of your app that remembers. Code gets rewritten every week, often by an agent that never saw last month's version. The rows stay. So write what must be true about your data into the schema (your table definitions) as constraints: rules the database checks on every write, from every code path, forever. Your code forgets. Constraints don't.

## Happy-path code lets bad data in quietly

Say you're selling a drop of 50 hoodies. The agent's checkout looks up the product, checks `stock > 0`, inserts the order, then sets stock to `stock - 1`.

Launch day, three things happen. Two people buy the last hoodie in the same second. Both reads see `stock = 1`, both pass the check, and you've sold 51. One checkout's function times out after the order insert and before the stock update, so stock is now wrong the other way. And a bug in the admin page deletes a product, leaving 30 orders pointing at an ID that no longer exists.

The first one is a race condition: two requests run at the same moment, and both pass a check meant to let only one through. None of these throws an error. You find them weeks later, in a refund request or a report that doesn't add up. You need constraints as soon as you store anything you can't regenerate.

## Write the rules into the schema

Start from what's true in the domain, not from the screen you're building. An order belongs to one user. Stock is never negative. A user books a given class once. Each sentence maps to a constraint:

- **`not null`:** the column always has a value.
- **`unique`:** no two rows share this value.
- **Foreign key (`references`):** the column must point at a row that exists in another table.
- **`check`:** any rule about one row, like `stock >= 0`.

Here they are in SQL. Look for `not null`, `references`, and `check`:

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  price_cents integer not null,
  stock integer not null check (stock >= 0)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id),
  product_id uuid not null references products (id),
  total_cents integer not null,
  created_at timestamptz not null default now()
);

create index orders_user_created_idx on orders (user_id, created_at);
```

Now the 51st hoodie fails: the `check` rejects stock going to `-1`. The foreign key refuses to delete a product that orders still point at. You can make a foreign key cascade instead (delete the orders too), like the habit tracker below.

This goes in a migration file (schema changes, applied in order). On Supabase, `supabase migration new` creates one. In Drizzle, the same rules are `notNull()`, `references()`, and `check()`.

## Uniqueness is a constraint, not a check

"Has this user booked this class? No? Insert." is the same race. A double-tap sends two requests, both pass the check, and one person holds two of the ten spots. A `unique` constraint on `(user_id, class_id)` makes the second insert fail, however close together they arrive. Catch that error and show "you're already booked."

Stop 3's [habit tracker](shape-before-you-build.md) needs it too. Notice `on conflict … do nothing`: the second tap becomes a no-op instead of an error. `$1` and `$2` are values your app fills in.

```sql
create table check_ins (
  habit_id uuid not null references habits (id) on delete cascade,
  day date not null, -- the user's local date
  unique (habit_id, day)
);

insert into check_ins (habit_id, day)
values ($1, $2)
on conflict (habit_id, day) do nothing;
```

In app code: Drizzle's `.onConflictDoNothing()`, or supabase-js's `.upsert(row, { onConflict: 'habit_id,day', ignoreDuplicates: true })`.

A calendar day is a `date`, not an instant: store `2026-10-06`, computed from the user's time zone, and the 11:50 p.m. check-in in California stays on the right day. Use `timestamptz` (a timestamp with time zone) for instants, like when an order was placed.

## Writes that belong together go in one transaction

A transaction is a group of writes that all happen, or none do. Put the stock check inside the write, not in a separate read. Notice `stock > 0` in the `update`'s `where`:

```sql
begin;

update products
set stock = stock - 1
where id = $1 and stock > 0
returning price_cents;

insert into orders (user_id, product_id, total_cents)
values ($2, $1, $3);

commit;
```

- **`begin`** starts the transaction. Nothing after it is saved until `commit`.
- **`update … where id = $1 and stock > 0`** checks and takes one hoodie in a single step. It also locks the row, so a second buyer's `update` waits, rechecks `stock > 0`, and changes nothing.
- **`returning price_cents`** sends back the changed row. No row means sold out, so your app runs `rollback` (undo everything since `begin`).
- **`insert`** records the order, at the price the update returned (`$3`).
- **`commit`** saves both writes at once. If the insert fails or the function dies first, the stock change is undone too.

In app code: Drizzle's `db.transaction(...)`, or a Postgres function you call with `supabase.rpc()`, which runs as one transaction.

Other writes wait, so keep transactions short. Don't call Stripe or send email inside one: everyone waits on your network call, and an email can't be undone ([what to do instead](timeouts-retries-idempotency.md)).

<details>
<summary>Going deeper: the same checkout as a Supabase function</summary>

`if not found` is true when the `update` changed no rows. `raise exception` stops the function, and because the whole call is one transaction, the stock change is undone with it.

```sql
create function public.buy(p_product_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_price integer;
  v_order_id uuid;
begin
  update public.products
  set stock = stock - 1
  where id = p_product_id and stock > 0
  returning price_cents into v_price;

  if not found then
    raise exception 'sold out';
  end if;

  insert into public.orders (user_id, product_id, total_cents)
  values (auth.uid(), p_product_id, v_price)
  returning id into v_order_id;

  return v_order_id;
end;
$$;
```

Call it with `supabase.rpc('buy', { p_product_id: productId })`. `security definer` runs it with the owner's rights, so buyers don't need permission to edit products. That's also why it takes the user from `auth.uid()`, Supabase's signed-in user, and never from an argument. Signed out, `auth.uid()` is null, and the `not null` on `user_id` rejects the order.

</details>

<details>
<summary>Going deeper: Neon's HTTP driver, rules that span rows, and Stripe Checkout</summary>

Neon's HTTP driver can't run an interactive transaction like this one, where your code runs between the writes. The [side-project stack](../recipes/side-project-stack.md) picks a driver that can.

This pattern is safe with Postgres's default settings. Rules that span rows, like "no overlapping room bookings," need an exclusion constraint or `SERIALIZABLE` isolation.

With Stripe Checkout, if you decrement only when `checkout.session.completed` arrives, two people can pay for the last hoodie. Instead, reserve with the transaction above when you create the Checkout Session, and set its `expires_at` (30 minutes to 24 hours out). If it expires unpaid, Stripe sends `checkout.session.expired` and your webhook puts the stock back. Either event can arrive twice, so [skip repeats by event ID](background-jobs-and-webhooks.md).

</details>

## Index the queries you actually run

An index is a sorted lookup the database keeps for a column, so it can jump to matching rows instead of reading the whole table. Without one, "this user's last 20 orders" scans every order ever placed. At 500,000 rows, that's your slowest page. The `create index` above fixes it. Index your `where`, `join`, and `order by` columns. Postgres doesn't index foreign keys for you.

To check, put `explain analyze` in front of the query and run it in a SQL client, like Supabase's SQL Editor:

```sql
explain analyze
select * from orders
where user_id = '…'
order by created_at desc
limit 20;
```

`Seq Scan` on a big table means Postgres read every row: that's the problem. With 20 rows in dev, Postgres reads every row anyway, so seed a few thousand first. Using supabase-js? Ask your agent for each call's SQL.

## Store money as integer cents

In JavaScript, `0.1 + 0.2` is `0.30000000000000004`. Store `1999` with a `currency` column, the way Stripe takes amounts.

## How I do it

On my own side projects:

- Ask your agent: "List the rules this data must always follow, and enforce each one as a constraint."
- In every `create table`: integer cents for money, `timestamptz` for instants, `date` for calendar days.
- Run any action that writes related rows in a transaction: Drizzle's `db.transaction`, or on Supabase, a Postgres function called with `rpc()`.
- To add a rule to an existing table, write a migration. On Supabase, `supabase migration new`, then `supabase db push`. With Drizzle, edit the schema, then `npx drizzle-kit generate` and `npx drizzle-kit migrate`. If existing rows break the rule, the migration fails, so fix them first.
- Seed a few thousand rows (on Supabase, in `supabase/seed.sql`, which runs on `supabase db reset`), then `explain analyze` each main page's query.

I'd add caching only when `explain` says a query is as good as it gets and it's still too slow. Constraints are cheapest on day one.

## The standard

- **Backups get a practiced restore,** because a backup you haven't restored is a hope. Do it once real users' data lives there ([data and storage](../concerns/data.md)).
- **Money paths get a test that races two requests, and an [idempotency key](timeouts-retries-idempotency.md) on every charge, email, and webhook.** Do it once real money moves ([concurrency](../concerns/concurrency.md)).
- **Orders get reconciled against Stripe's records on a schedule.** Do it once real money moves.
- **Schema changes on big tables follow the [no-downtime steps](database-changes-without-downtime.md).** Do it at scale.

## Before you ship, check

Paste this to your agent before you merge:

- Every rule the data must follow is a constraint in the schema, not only a check in code.
- Anything a double-tap could create twice has a `unique` constraint, and the app handles the conflict.
- Writes that belong together run in one transaction, with the stock check in the `update`'s `where`.
- No transaction waits on Stripe, email, or any other network call.
- Money is integer cents, instants are `timestamptz`, and calendar days are `date`.
- Each main page's query shows no `Seq Scan` in `explain analyze` on a few thousand seeded rows.

## Sources

- [PostgreSQL: Constraints, including foreign key indexing](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html), for `begin`, `commit`, and `rollback`
- [PostgreSQL: Explicit locking (row locks are held until the transaction ends)](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL: Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html), for how a waiting `update` rechecks its `where` under Read Committed
- [PostgreSQL: `INSERT`](https://www.postgresql.org/docs/current/sql-insert.html), for `on conflict do nothing` and `returning`
- [PostgreSQL: Using `EXPLAIN`](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL: PL/pgSQL basic statements](https://www.postgresql.org/docs/current/plpgsql-statements.html), for `returning … into` and `found`
- [PostgreSQL: `ALTER TABLE`](https://www.postgresql.org/docs/current/sql-altertable.html), for new constraints checking existing rows
- [Drizzle: Indexes and constraints](https://orm.drizzle.team/docs/indexes-constraints)
- [Drizzle: Connect to Neon (HTTP vs. WebSocket drivers)](https://orm.drizzle.team/docs/connect-neon)
- [Drizzle: Migrations (`drizzle-kit generate` and `migrate`)](https://orm.drizzle.team/docs/migrations)
- [PostgREST: Transactions](https://docs.postgrest.org/en/stable/references/transactions.html), the layer under Supabase's API, for one transaction per call; [Supabase: Database functions](https://supabase.com/docs/guides/database/functions) for `rpc()`
- [Supabase JS: `upsert` with `ignoreDuplicates`](https://supabase.com/docs/reference/javascript/upsert)
- [Supabase: Database migrations](https://supabase.com/docs/guides/deployment/database-migrations) and [seeding](https://supabase.com/docs/guides/local-development/seeding-your-database)
- [Stripe: Manage limited inventory with Checkout](https://docs.stripe.com/payments/checkout/managing-limited-inventory)
- [Stripe: Amounts in the currency's minor unit](https://docs.stripe.com/currencies)
