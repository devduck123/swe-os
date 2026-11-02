---
title: Local first, then managed services
description: Build on your laptop, where feedback is instant and free, and add a hosted service only when a feature needs it.
stage: build
track: 8
concerns: [deployment, cost, data, security]
freshness: durable
status: draft
---

Your laptop is the fastest feedback loop you'll ever have: a change shows up in a second and nothing costs money. Every hosted service you add is another account, another set of keys, and another pricing cliff. So add them one at a time, in the order features ask for them: database, auth, files, email, error tracking, and payments last, because money brings webhooks, refunds, and the most ways to be wrong.

## Easy to miss

- **A fresh clone is the real test.** If the app only runs on your machine, it leans on something you forgot to write down. Clone it somewhere new and follow only the README. Whatever breaks is what the next person, or agent, will hit.
- **An empty database looks like a broken app.** A seed script with a few users and a month of fake records means you, and your agent, see real screens on day one.
- **An agent that can't run the app can't check its work.** One command to set up and one to check, the same one CI runs, turn "looks right" into "passed".
- **Previews run unreviewed code.** A preview deploy, a live URL for each pull request, must never point at the production database. Code nobody has reviewed yet shouldn't be able to touch real users' data.
- **Copying production into previews copies your users.** Database branching, a throwaway copy per preview, is great until real users exist. After that, every preview holds their personal data, so branch from seed data instead.
- **Free tiers end at a cliff, not a slope.** Find the usage where the bill or the limits jump before you sign up, and set a spend cap so a bug can't find it for you.

**How I do it:** Postgres on my laptop with fake seed data and one setup command, previews on their own throwaway databases, and one hosted service at a time as features need them, each with a spend cap.

## Go deeper

- [The Twelve-Factor App: Dev/prod parity](https://12factor.net/dev-prod-parity)
- [Neon: Branching](https://neon.com/docs/introduction/branching)
