---
title: Data that stays correct
description: Code gets rewritten every week. The rows stay. Put the rules your data must follow in the database, where every code path has to obey them.
stage: design
track: 5
concerns: [data, concurrency, performance]
freshness: durable
status: draft
---

Your database is the one part of your app that remembers. Code gets rewritten, often by an agent that never saw last month's version. Write what must always be true into the schema, your tables and columns, as constraints, rules the database checks on every write. Bad data rarely throws. You find it weeks later in a refund request.

## Easy to miss

- **Check-then-write is a race.** Two buyers read "1 left" in the same second, both pass, and you've sold 51 of 50. Put the check inside the write, "lower the stock only if it's above zero", so the database decides.
- **Uniqueness belongs in the database.** A double tap sends two requests that both pass an "already booked?" check. A unique constraint, a rule that rejects a duplicate, stops the second. Catch that error and say "you're already booked."
- **Writes that belong together go in one transaction.** If the function dies between saving the order and lowering the stock, both are wrong. A transaction groups writes so they all land or none do.
- **Keep the network out of transactions.** A payment call inside one makes other writes wait, and if it fails, the database can undo its writes but not a sent email.
- **Deleting a row strands whatever pointed at it.** A foreign key, a rule that a column points at a row that exists, makes the database refuse the delete or remove the rows that depend on it too.
- **Fine with 20 rows, unusable with 500,000.** An index is a lookup the database keeps so it can find rows without reading them all. Postgres doesn't add one for foreign keys, and tiny dev data hides the gap. Seed a few thousand fake rows, then read the query plan, the database's account of how it ran a query. If it reads every row, you're missing an index.
- **A calendar day isn't a timestamp.** Store "today" as the user's local date, or an 11:50 p.m. check-in lands on tomorrow.
- **Money is integer cents.** In JavaScript, 0.1 + 0.2 isn't 0.3. Store 1999 with a currency.

**How I do it:** I ask the agent to list the rules the data must always follow and enforce each one as a constraint, then check each main page's query plan against seeded data.

**Ask your agent:** "List the rules my data must always follow, like 'stock never goes below zero' or 'one booking per person per class', and enforce each one in the database. Then fill a dev database with a few thousand rows and show me any main query that reads every row."

## Go deeper

- [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
