---
title: Shipping changes you can undo
description: 'CI, preview deploys, migrations, feature flags, and rollbacks: how to ship small changes often, and take any of them back in a minute.'
domain: infrastructure
stage: ship
freshness: evolving
status: draft
reviewed: 2026-10-06
track: 16
concerns: [deployment, testing]
---

Safe shipping isn't about never breaking production. It's about making every change small enough to check and easy to take back. Each step is a chance to stop a bad change: a short branch, a PR that CI has to pass, a preview you click through, a quick check in production, and an undo button that works.

The undo button has a limit. A rollback swaps your code back. It doesn't un-send the emails, un-charge the cards, or un-write the rows the bad version touched.

## Big releases fail big

Say you spend two weeks on a habit tracker branch that rewrites streaks, adds reminders, and bumps three dependencies. You merge it Friday night. Saturday morning, everyone's streak shows zero.

Which of the 40 changed files did it? Every guess means another deploy. Meanwhile the nightly job has already rewritten streaks with the broken logic, so rolling back the code still leaves wrong numbers on every account.

Ship the same work as eight small PRs and the streak change goes out alone. It breaks, you roll back in a minute, and the diff to read is 60 lines. Small releases still break, but the cause is obvious and the damage stays narrow.

You need all this once someone else depends on the app. Even on a throwaway prototype, I'd set up CI. It takes ten minutes and stops agents from merging broken code.

## CI keeps main deployable

On Vercel, every merge to main _is_ a deploy, so main must always be safe to ship. CI enforces it: on every PR, a fresh machine installs exactly what the lockfile says and runs your one `check` script.

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
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run check
```

I accept version tags for GitHub's own `actions/*`, but I pin third-party actions to a full commit SHA. Whoever controls a repo can move its tag to different code. They can't move a SHA.

CI on its own only reports. **Branch protection** makes it binding: require a PR to merge into main, and require `check` to pass first. The solo-dev trap: by default these rules don't apply to repository admins, and on your own repo you're the admin. Turn on the option that includes admins, or you'll skip the rules the first time you're in a hurry.

## Previews let you see it before users do

Connect the repo to Vercel and every PR gets its own deployment at its own URL. Click through it on your phone. That catches bugs that only show up in a real build, like a missing env var.

The trap is what the preview talks to. If the Preview environment holds your production `DATABASE_URL` and live Stripe keys, clicking "delete account" on a half-finished branch deletes a real account. Give previews their own world:

- **Database:** a separate branch per preview. Neon's Vercel integration creates one and injects its connection string into that deployment only.
- **Keys:** test-mode Stripe keys and a sandbox email sender, scoped to Preview, never "all environments".
- **Access:** keep previews behind Vercel's deployment protection, and give CI tests its automation bypass header (`x-vercel-protection-bypass`).

## Run migrations in the Vercel build

Something has to run `drizzle-kit migrate`. My default is the Vercel build, right before `next build`. In `vercel.json`:

```json
{ "buildCommand": "npm run db:migrate && npm run build" }
```

Only Vercel reads this, so local builds and CI never touch a database. In production, the migration runs before the new deployment takes traffic. If it fails, the build fails and nothing ships. With Neon's integration, each preview build migrates its own branch, which rehearses the migration for free. Point `drizzle.config.ts` at `DATABASE_URL_UNPOOLED`, because Neon says to run migrations over a direct connection, not the pooler.

Two rules make this safe. First, the old deployment keeps serving while the build runs, so every migration must work with the old code too. That's [expand and contract](database-changes-without-downtime.md): schema changes go in their own PR, before the code that needs them. Second, the Preview `DATABASE_URL` must never be production, or every PR migrates prod.

I'd move migrations into their own CI job once I want a human to approve them, or they get slow enough to stall builds.

## Flags separate shipping code from turning it on

A feature flag lets you deploy code that stays switched off, so turning the feature on becomes its own reversible step. Start with the simplest flag that works:

- **An env var.** `process.env.FLAG_NEW_CHECKOUT === "true"`. Free, but on Vercel an env var change only applies to new deployments, so flipping it means a redeploy.
- **A database row.** A `feature_flags` table with a name and an `enabled` boolean. Flipping it is one `UPDATE`, live in seconds.
- **A managed flag service** like PostHog or Vercel's Flags SDK, for percentage rollouts and targeting.

Every flag is a branch in your code, and both sides have to work. Delete each one once the feature is fully on.

## A rollback undoes code, not consequences

Vercel's **Instant Rollback** points your domain back at an earlier production deployment, with no rebuild. Hobby can go back one deployment. Pro can pick any earlier one.

After a rollback, Vercel stops auto-assigning production, so your next merge to main won't go live until you undo the rollback or promote a deployment.

What a rollback can't touch:

- **Data.** Rows the bad version wrote or deleted, and any migration it ran.
- **Messages.** Emails, SMS, and push notifications already sent.
- **Calls to other systems.** Charges, webhooks you sent, files you uploaded or deleted.

Before you merge anything that writes data or talks to the outside world, ask: "If I roll this back in ten minutes, what's still wrong?" If it's a lot, put it behind a flag or ship the risky part separately.

After each production deploy, load the real URL, run one critical flow, and watch error tracking for ten minutes. If anything looks wrong, roll back first and investigate second.

## What the vibe-coded version misses

- **Deploying from a laptop.** `vercel --prod` from a dirty working tree ships code no commit matches. When it breaks, you can't see what shipped.
- **Branch protection that admins skip.** You're the admin, so it never stops you, and an agent's red PR lands on main.
- **Giant releases.** When two weeks of changes break, you're bisecting in production.
- **Previews wired to the production database.** A test click edits real customer data, or a preview build runs a migration against prod.
- **No rollback plan.** Nobody knows the rollback button won't undo the backfill the release just ran.
- **A migration that only the new code understands.** The old deployment is still serving when it lands, and every request it handles fails.

## What I'd do

Light trunk-based development, meaning everyone works off main in short-lived branches. Every change gets a branch, ideally under a day old, and a PR. CI runs `check`, Vercel builds and migrates a preview, and I click through it. I squash-merge, hit the production URL, and watch Sentry for a few minutes.

The setup is small: branch protection that includes admins, previews on their own Neon branch with test keys, migrations in the Vercel build, env-var flags, and Dependabot on the lockfile and the actions.

I'd add a database-row flag once I want to try a feature on just my account in production, and a managed flag service once I need percentage rollouts.

## Sources

- [Vercel: Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)
- [Vercel: Project configuration (`buildCommand`)](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel: Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- [Neon: Neon-managed Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration) and [connection pooling (direct connections for migrations)](https://neon.com/docs/connect/connection-pooling)
- [GitHub: Secure use of Actions (pinning to a commit SHA)](https://docs.github.com/en/actions/reference/security/secure-use), and the [checkout](https://github.com/actions/checkout/releases) and [setup-node](https://github.com/actions/setup-node/releases) releases
- [GitHub: About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
