---
title: Shipping changes you can undo
description: 'CI, preview deploys, feature flags, and rollbacks: how to ship small changes often, and take any of them back in a minute.'
domain: infrastructure
stage: ship
freshness: evolving
status: draft
reviewed: 2026-10-06
track: 16
concerns: [deployment, testing]
---

Safe shipping isn't about never breaking production. It's about making every change small enough to check and easy enough to take back. Each step can stop a bad change: a short branch, a PR that CI has to pass, a preview you click through, a merge, a quick check in production, and an undo button that works.

The undo button has a limit. A rollback swaps your code back. It doesn't un-send the emails, un-charge the cards, or un-write the rows the bad version touched. Most of this guide is about keeping that gap small.

## Big releases fail big

Say you run a little habit tracker. You spend two weeks on a branch that rewrites streaks, adds reminders, and bumps three dependencies. You merge it Friday night. Saturday morning, everyone's streak shows zero.

Which of the 40 changed files did it? Every guess means another deploy. Meanwhile the nightly job has already rewritten streaks using the broken logic, so rolling back the code still leaves wrong numbers on every account.

Now ship the same work as eight small PRs. The streak change goes out alone, on a Tuesday. It breaks, you roll back in a minute, and the diff to read is 60 lines. Small releases still break. When they do, the cause is obvious and the damage is narrow.

## When you need this, and when you don't

You need it once someone other than you depends on the app, or once it holds data you'd hate to lose. That's where "I'll just fix it" stops being free.

You can skip most of it for a throwaway prototype with no users. I'd still set up CI on main. It takes ten minutes and stops agents from merging broken code while you're not looking.

## CI keeps main deployable

On Vercel, every merge to main _is_ a deploy, so main must always be safe to ship. CI enforces that. On every PR, a fresh machine installs your exact dependencies and runs your one `check` script: format, lint, types, tests, build.

```yaml
# .github/workflows/check.yml
name: check
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<full-commit-sha> # vX.Y.Z, the release you checked
      - uses: actions/setup-node@<full-commit-sha> # vX.Y.Z, the release you checked
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run check
```

CI alone only reports. **Branch protection** makes it binding: require a PR to merge into main, and require `check` to pass first. The solo-dev trap: by default these rules don't apply to repository admins, and on your own repo you're the admin. Turn on the option that includes admins, or you'll skip the rules the first time you're in a hurry. On a private repo, check that your GitHub plan includes branch protection.

`npm ci` installs exactly what the lockfile says, so CI tests what will ship. Each action is pinned to a commit SHA, because a tag like `@v5` can be moved to point at different code. More in [dependencies](../concerns/dependencies.md).

## Previews let you see it before users do

Connect the repo to Vercel and every PR gets its own deployment at its own URL. You click through the feature on your phone, send the link to a friend, or point a Playwright test at it. It catches bugs that only show up in a real build: a missing env var, a server-only import in a client component, an image that 404s in production mode.

The trap is what the preview talks to. A preview runs your real server code with the Preview environment's env vars. If those are your production `DATABASE_URL` and live Stripe keys, clicking "delete account" on a half-finished branch deletes a real account, and a preview with a migration runs it against the real database.

Give previews their own world:

- **Database:** a separate branch per preview. Neon's Vercel integration creates a database branch for each preview and injects its connection string into that deployment only.
- **Keys:** test-mode Stripe keys, a sandbox email sender, a separate Sentry environment. In Vercel, set these in the Preview environment, never "all environments".
- **Access:** keep previews behind Vercel's deployment protection, and use its automation bypass header for CI tests.

More on environments in [local first, then managed services](local-first-then-managed.md), and on keys in [secrets and safety](secrets-and-agent-safety.md).

## Flags separate shipping code from turning it on

A feature flag lets you deploy code that stays switched off. Deploying stops being the risky moment, and turning the feature on becomes its own reversible step.

Start with the simplest flag that works:

- **An env var.** `const newCheckout = process.env.FLAG_NEW_CHECKOUT === "true"`. Free and obvious. The catch on Vercel: env var changes only apply to new deployments, so flipping it means a redeploy.
- **A database row.** A `feature_flags` table with a name and an `enabled` boolean, read on each request. Flipping it is one `UPDATE`, live in seconds. Add a `user_ids` column to turn it on just for yourself first.
- **A managed flag service** like PostHog, LaunchDarkly, or Vercel's Flags SDK. You get percentage rollouts, targeting, and a UI someone else can use.

Every flag is a branch in your code, and both sides have to work. Delete each one once the feature is fully on. A flag that's been `true` for six months is dead code with extra steps.

## A rollback undoes code, not consequences

Vercel's **Instant Rollback** points your production domain back at an earlier production deployment. There's no rebuild, so it takes effect immediately. On Hobby you can roll back to the previous production deployment. On Pro you can pick any earlier one.

One behavior surprises people. After a rollback, Vercel stops auto-assigning production, so your next merge to main won't go live until you undo the rollback or promote a deployment. That stops a half-fix from shipping on its own, but you need to know it's happening.

What a rollback can't touch:

- **Data.** Rows the bad version wrote or deleted, and any migration it ran. See [database changes without downtime](database-changes-without-downtime.md).
- **Messages.** Emails, SMS, and push notifications already sent.
- **Calls to other systems.** Charges, webhooks you sent, files you uploaded or deleted.

Before you merge anything that writes data or talks to the outside world, ask: "If I roll this back in ten minutes, what's still wrong?" If the answer is "a lot", put it behind a flag or ship the risky part separately.

## Check production right after you ship

A passing build doesn't mean the app works. After each production deploy, smoke test the real URL: the health endpoint responds, the home page loads, and one critical flow works. A short Playwright test or one minute of clicking both count. Then watch error tracking for ten minutes. If anything looks wrong, roll back first and investigate second. [Knowing it broke](knowing-it-broke.md) covers what to watch.

Ship schema changes in their own PR, before the code that needs them. If a migration and a code change must land at the same moment, you can't roll back cleanly, because the old code doesn't know the new schema. [Database changes without downtime](database-changes-without-downtime.md) walks through expand and contract.

## What the vibe-coded version misses

- **Deploying from a laptop.** `vercel --prod` from a dirty working tree ships code no one reviewed and no commit matches. When it breaks, you can't even see what shipped.
- **No CI, so main breaks.** An agent merges code that doesn't type-check, and the next deploy fails, or worse, succeeds with a broken page.
- **Branch protection that admins skip.** It's on, but you're the admin, so it never actually stops you.
- **Giant releases.** Two weeks of changes in one merge. When it breaks, you're bisecting in production.
- **Previews wired to the production database.** A test click on a preview edits real customer data, or a preview build runs a migration against prod.
- **No rollback plan.** Nobody knows where the rollback button is, or that it won't undo the backfill the release just ran.
- **A migration and code that must ship together.** The deploy half-succeeds, and neither the old nor the new code works against the schema.

## What I'd do

My flow is light trunk-based development. Every change gets a short-lived branch off main, ideally less than a day old, and a PR. CI runs `check`. Vercel builds a preview, and I click through the change there, on my phone if it's UI. I squash-merge, hit the production URL, watch Sentry for a few minutes, and delete the branch.

The setup around it is small: branch protection on main that includes admins, previews on their own Neon branch with test keys, env-var flags for anything I'd want to turn off without a revert, and Dependabot on the lockfile and the actions.

I'd add a database-row flag once I want to try a feature on just my own account in production, and a managed flag service once I need percentage rollouts or someone else flips the switches. I'd automate the smoke test once I've broken the same flow twice.

## What changes at scale

- **Gradual rollouts.** Send a small slice of traffic to the new version and compare error rates before promoting it. Vercel calls this Rolling Releases, on Pro and Enterprise.
- **Automatic rollback.** A deploy rolls itself back when error rates cross a threshold you wrote down in advance.
- **Merge queues.** With many people merging, CI tests each PR against the latest main, so two green PRs can't combine into a red main.
- **A staging environment** for things previews can't cover, like integrations with fixed webhook URLs or rehearsing migrations on production-sized data.

## Sources

- [Vercel: Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)
- [Vercel: Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- [Vercel: Rolling Releases](https://vercel.com/docs/rolling-releases)
- [Neon: Neon-managed Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration)
- [GitHub: About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
