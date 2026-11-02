---
title: Shipping changes you can undo
description: Safe shipping isn't never breaking production. It's making every change small enough to check and easy to take back.
stage: ship
track: 16
concerns: [deployment, testing]
freshness: durable
status: draft
---

Every change breaks something eventually. What you control is how big the break is and how fast you can take it back. Merge two weeks of work at once and every guess about what broke costs a deploy. Ship it as eight small PRs and the bad one goes out alone, with a 60-line diff to read.

## Easy to miss

- **A rollback undoes code, not consequences.** Sent emails, charged cards, and rewritten rows stay. Before merging anything that writes, sends, or charges, ask what's still wrong if you roll back in ten minutes.
- **The old code keeps serving while the new one deploys.** So every migration has to work with the code in production now. Rename a column and the old queries fail. Add first, remove later, as in [database changes without downtime](database-changes-without-downtime.md).
- **A preview is only as safe as what it talks to.** With production's database and live payment keys, "delete account" on a half-finished branch deletes a real account.
- **A fresh machine catches what yours hides.** A global tool or an untracked `.env` makes it work on your laptop. CI installs from the lockfile on a clean machine, so it fails where production would.
- **A schema edit in the dashboard skips everything.** Nobody reviews it, and no other database gets it.
- **A feature flag doubles the paths.** A flag, a switch that turns a feature on without a deploy, means the code runs both ways, and both have to work. Delete it once the feature is fully on.

**How I do it:** a short-lived branch and a PR for every change, a `check` that has to pass before merge, a preview with its own database that I click through on my phone, and one critical flow tried on the real site after each deploy.

## Go deeper

- [Pete Hodgson: feature toggles (martinfowler.com)](https://martinfowler.com/articles/feature-toggles.html)
- [GitHub: about rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
