---
title: Data that stays correct
description: Code gets rewritten every week. The rows stay. Put the rules your data must follow in the database, where every code path has to obey them.
stage: design
track: 5
concerns: [data, concurrency, performance]
freshness: durable
status: draft
---

Your database is the one part of your app that remembers. Code gets rewritten, often by an agent that never saw last month's version. Write what must always be true into the schema as constraints, rules the database checks on every write. Bad data rarely throws. You find it weeks later in a refund request.

## Easy to miss

- **Check-then-write is a race.** Two buyers read "1 left" in the same second, both pass, and you've sold 51 of 50. Put the check inside the write itself, so the database decides.
- **Uniqueness belongs in the database.** A double tap sends two requests that both pass an "already booked?" check. A unique constraint, a rule that rejects a duplicate, stops the second. Catch that error and say "you're already booked."
- **Writes that belong together go in one transaction.** If the function dies between saving the order and lowering the stock, both are wrong. A transaction makes it all or nothing.
- **Keep the network out of transactions.** A payment call inside one makes other writes wait, and an email can't be rolled back.
- **Deleting a row strands whatever pointed at it.** A foreign key, a rule that a column points at a row that exists, makes the database refuse the delete or remove the dependents too.
- **Fine with 20 rows, unusable with 500,000.** Postgres doesn't index foreign keys for you, and tiny dev data hides a missing index. Seed a few thousand rows and read the query plan.
- **A calendar day isn't a timestamp.** Store "today" as the user's local date, or an 11:50 p.m. check-in lands on tomorrow.
- **Money is integer cents.** In JavaScript, 0.1 + 0.2 isn't 0.3. Store 1999 with a currency.

**How I do it:** I ask the agent to list the rules the data must always follow and enforce each one as a constraint, then check each main page's query plan against seeded data.

## Go deeper

- [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
