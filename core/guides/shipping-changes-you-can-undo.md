---
title: Shipping changes you can undo
description: 'CI, preview deploys, migrations, feature flags, and rollbacks: how to ship small changes often, and take any of them back in a minute.'
domain: infrastructure
stage: ship
freshness: evolving
status: reviewed
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

On Vercel, every merge to main _is_ a deploy, so main must always be safe to ship. CI enforces it. Notice the last two lines: on every PR, a fresh machine installs the exact versions in your lockfile (`package-lock.json`), then runs your one `check` script.

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

CI on its own only reports. **Branch protection** makes it binding: main only accepts PRs that pass `check`. The solo-dev trap: by default these rules skip repository admins, and on your own repo that's you. Turn on the option that includes admins, or you'll skip the rules the first time you're in a hurry.

## Previews let you see it before users do

Connect the repo to Vercel and every PR gets its own preview deployment at its own URL. Click through it on your phone. That catches bugs that only show up in a real build, like a missing env var.

The trap is what the preview talks to. If the Preview environment holds your production `DATABASE_URL` and live Stripe keys, clicking "delete account" on a half-finished branch deletes a real account. Give previews their own world:

- **Database:** a separate database branch (a copy just for this PR) per preview. Neon's Vercel integration creates one and gives only that deployment its connection string. On Supabase, Branching does this on paid plans. On the free plan, point Preview at a second project.
- **Keys:** test-mode Stripe keys and a sandbox email sender, scoped to Preview in Vercel, never "all environments".
- **Access:** keep previews behind Vercel's deployment protection, so only your team can open them.

<details>
<summary>Going deeper: locking down CI and previews</summary>

- For CI tests that need to reach a protected preview, Vercel's Protection Bypass for Automation gives you a secret to send in the `x-vercel-protection-bypass` header.
- I accept version tags for GitHub's own `actions/*`, but I pin third-party actions to a full commit SHA. Whoever controls a repo can move its tag to different code. They can't move a SHA.

</details>

## Run migrations in the Vercel build

A migration is a SQL file that changes your database's shape, and something has to run it. My default is the Vercel build. In this `vercel.json`, notice the migration runs before `next build`:

```json
{ "buildCommand": "npm run db:migrate && npm run build" }
```

Only Vercel reads this, so local builds and CI never touch a database. In production, the migration runs before the new deployment takes traffic, and if it fails, nothing ships. Each preview build migrates its own branch, a free rehearsal. Use your database's direct connection string for this, not the pooled one; Neon and Supabase both say so. On Supabase, Vercel can't reach the IPv6-only direct connection, so use the session pooler, or let Supabase's GitHub integration run `supabase/migrations` on merge.

Two rules make this safe. First, the old deployment keeps serving while the build runs, so every migration must work with the old code too. That's [expand and contract](database-changes-without-downtime.md): add the new column first, in its own PR, and remove the old one later. Second, the Preview `DATABASE_URL` must never be production, or every PR migrates prod.

## Flags separate shipping code from turning it on

A feature flag lets you deploy code that stays switched off, so turning it on becomes its own reversible step. Start with the simplest flag that works:

- **An env var.** `process.env.FLAG_NEW_CHECKOUT === "true"`. Free, but on Vercel an env var change only applies to new deployments, so flipping it means a redeploy.
- **A database row.** A `feature_flags` table with a name and an `enabled` boolean. Flipping it is one `UPDATE`, live in seconds.
- **A managed flag service** like PostHog or Vercel's Flags SDK, for percentage rollouts and targeting.

Every flag is an `if` in your code, and both sides have to work. Delete each one once the feature is fully on.

## A rollback undoes code, not consequences

Vercel's **Instant Rollback** points your domain back at an earlier production deployment, with no rebuild. Hobby can go back one deployment. Pro can pick any earlier one.

After a rollback, merges to main stop going live until you undo the rollback in the Vercel dashboard.

What a rollback can't touch:

- **Data.** Rows the bad version wrote or deleted, and any migration it ran.
- **Messages.** Emails, SMS, and push notifications already sent.
- **Calls to other systems.** Charges, webhooks you sent, files you uploaded or deleted.

Before you merge anything that writes data or talks to the outside world, ask: "If I roll this back in ten minutes, what's still wrong?" If it's a lot, put it behind a flag or ship the risky part separately.

After each production deploy, load the real URL, run one critical flow, and watch error tracking for ten minutes. If anything looks wrong, roll back first and investigate second.

## What the vibe-coded version misses

- **Branch protection that admins skip.** You're the admin, so an agent's failing PR lands on main anyway.
- **Giant releases.** Two weeks of changes break, and you guess which of 40 files did it, one deploy at a time.
- **Previews wired to the production database.** A test click deletes a real account, or a preview build migrates prod.
- **No rollback plan.** Nobody knows the rollback button won't undo the rows the release just rewrote.
- **A migration only the new code understands.** Every request the old deployment still serves fails.

## What I'd do

Every change gets a branch, ideally under a day old, and a PR. CI runs `check`, Vercel builds and migrates a preview, and I click through it before merging. The setup is small:

- **CI.** Add the `check.yml` above.
- **Branch protection.** In the repo's GitHub settings, add a rule for main: require a PR, require `check` to pass, and include administrators.
- **Previews.** Install Neon's Vercel integration (or Supabase's, with Branching), and add test Stripe keys scoped to Preview.
- **Migrations.** Set the `buildCommand` above.
- **Dependency updates.** Ask your agent: "Add a Dependabot config for npm and GitHub Actions." It's GitHub's bot that opens update PRs.

I'd add a database-row flag once I want to try a feature on just my account in production, and a managed flag service once I need percentage rollouts.

## Sources

- [Vercel: Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)
- [Vercel: Project configuration (`buildCommand`)](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel: Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- [Neon: Neon-managed Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration) and [connection pooling (direct connections for migrations)](https://neon.com/docs/connect/connection-pooling)
- [Supabase: Branching](https://supabase.com/docs/guides/deployment/branching), [Vercel integration](https://supabase.com/docs/guides/deployment/branching/integrations), [pricing (branching on paid plans, 2 free projects)](https://supabase.com/pricing), [connecting to Postgres (direct connections for migrations)](https://supabase.com/docs/guides/database/connecting-to-postgres), and [IPv4 and IPv6 compatibility (Vercel is IPv4-only)](https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP)
- [GitHub: Secure use of Actions (pinning to a commit SHA)](https://docs.github.com/en/actions/reference/security/secure-use), and the [checkout](https://github.com/actions/checkout/releases) and [setup-node](https://github.com/actions/setup-node/releases) releases
- [GitHub: About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
