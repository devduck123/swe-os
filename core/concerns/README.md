---
title: Concerns
description: How to tell which engineering concerns a feature triggers, and how deep to go on each.
freshness: durable
---

A concern is something a feature can get wrong that the happy path won't show you: security, accessibility, data loss, cost. This page helps you pick the few that matter for a task and skip the rest. It's a routing table, not a checklist.

## Pick the concerns

Match what the feature actually does, after you've read the code it touches. One feature usually triggers several rows.

| If the feature...                                   | Read these concerns                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| changes what a user sees or can do                  | [product and UX](product-ux.md)                                                                                                            |
| has a UI                                            | [accessibility](accessibility.md), [responsive design](responsive.md), [visual design](visual-design.md)                                   |
| adds UI pieces that appear in more than one place   | [components](components.md)                                                                                                                |
| exposes an API, webhook, CLI, or file format        | [API contracts](api-contracts.md), [security](security.md)                                                                                 |
| accepts input from outside your code                | [security](security.md)                                                                                                                    |
| calls a language model, or acts on what one returns | [AI features](ai-features.md), [security](security.md), [cost](cost.md), [reliability](reliability.md)                                     |
| accepts file uploads                                | [security](security.md), [data](data.md), [privacy](privacy.md), [performance](performance.md), [cost](cost.md)                            |
| touches login, sessions, or permissions             | [security](security.md) (floor), [testing](testing.md)                                                                                     |
| handles secrets or credentials                      | [security](security.md) (floor)                                                                                                            |
| stores data that outlives a request                 | [data](data.md), [reliability](reliability.md)                                                                                             |
| changes a schema or rewrites existing data          | [migrations](migrations.md), [data](data.md), [deployment](deployment.md)                                                                  |
| lets more than one actor write the same thing       | [concurrency](concurrency.md)                                                                                                              |
| runs background or scheduled work                   | [concurrency](concurrency.md), [reliability](reliability.md), [observability](observability.md)                                            |
| calls a service you don't own                       | [reliability](reliability.md), [observability](observability.md), [security](security.md), [cost](cost.md)                                 |
| processes personal data                             | [privacy](privacy.md) (floor)                                                                                                              |
| moves money                                         | [security](security.md), [data](data.md), [concurrency](concurrency.md), [reliability](reliability.md), [privacy](privacy.md) (all floors) |
| uses a usage-billed service                         | [cost](cost.md)                                                                                                                            |
| has a latency, size, or throughput budget           | [performance](performance.md)                                                                                                              |
| changes build, config, or release                   | [deployment](deployment.md)                                                                                                                |
| changes any behavior                                | [testing](testing.md)                                                                                                                      |

If nothing matches an implementation task, look again. Pure explanations and copy edits can match nothing. Code changes rarely do.

## Decide how deep to go

Every concern page has two levels. Meet the **minimum bar** for every concern you picked. Go to **when stakes rise** if any of these is true:

- Real users outside your team can reach it, and the project is past prototype.
- The change is hard to undo: it deletes or rewrites data, sends email, charges money, or changes a public contract.
- The project's PROJECT.md says production.

**Floors** ignore all of that. Credentials, auth, personal data, payments, destructive data changes, and models that can take actions always get the "when stakes rise" treatment, even in a weekend prototype. A prototype that leaks an API key is still a leak.

A missing fact is **unknown**, not low risk. Ask about it if the answer would change what you build. Otherwise write down a careful assumption and keep going.

Going deeper means stronger evidence about the failure you're worried about. It does not mean adding services.

## Report what you did with each one

For each concern you picked, say which of these it is. One line each is usually enough.

| State              | What to say                                                                    |
| ------------------ | ------------------------------------------------------------------------------ |
| **Handled**        | What you changed or checked, and what proves it.                               |
| **Deferred**       | The remaining risk and what would make you revisit it. Write it in PROJECT.md. |
| **Not applicable** | Why the trigger doesn't hold here.                                             |
| **Unknown**        | The missing fact, why it matters, and how to find out.                         |

"There is no centralized logging yet. Errors are structured, but monitoring is a gap before launch." That's a useful deferred line. "This static site stores nothing, so migrations don't apply." That's a useful not-applicable line.

Picking a concern does not mean you handled it. Skip the 14-row report for a two-line fix.
