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

- **A fresh clone is the real test.** If the app only runs on your machine, it leans on a global tool or an untracked `.env`. A pinned runtime, a committed lockfile, an `.env.example` with names and no values, and seed data let a clone run from the README alone.
- **An empty database looks like a broken app.** A seed script with a few users and a month of fake records means you, and your agent, see real screens on day one.
- **An agent that can't run the app can't check its work.** One command to set up and one to check, the same one CI runs, turn "looks right" into "passed".
- **Previews run unreviewed code.** A preview deploy (a URL for each PR) must never get the production database. If the build runs migrations, an unreviewed PR can change production's tables.
- **Copying production into previews copies your users.** Database branching, a throwaway copy per preview, is great until real users exist. After that, every preview holds their personal data, so branch from seed data instead.
- **Each environment gets its own keys.** Development, preview, and production share nothing, so a leaked dev key can't touch real data.
- **Free tiers end at a cliff, not a slope.** Find the usage where the bill or the limits jump before you sign up, and set a spend cap so a bug can't find it for you.

**How I do it:** Postgres on my laptop with seed data and one setup command, then Vercel previews on their own database branches, then one service per feature, each with a spend cap.

## Go deeper

- [The Twelve-Factor App: Dev/prod parity](https://12factor.net/dev-prod-parity)
- [Neon: Branching](https://neon.com/docs/introduction/branching)
