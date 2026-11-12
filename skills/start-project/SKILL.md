---
name: start-project
description: Set up a new repository the engineer way, with project context, protected secrets, quality checks, CI, preview deploys, and one command to run locally. Use when starting a new app or website, or adopting SWE OS in a repo that has none of this. Not for shaping the idea (use shape-project first) or for adding features.
metadata:
  title: Start a project
  example: 'Set up a new Next.js app for my habit tracker. Use my SWE OS.'
---

# Start a project

Give a new repo everything a vibe-coded one is missing on day one, and nothing it doesn't need yet. Follow the [rules for every task](../README.md#rules-for-every-task).

## Steps

1. **Check the idea is shaped.** If there's no clear goal and first slice yet, run [shape-project](../shape-project/SKILL.md) first. Setup decisions follow from what's being built.
2. **Pick the stack.** Start from Tommy's [defaults](../../profile/defaults.md) unless the project calls for something else, and say in one line why for each piece. Scaffold with the framework's official CLI. Don't hand-roll what the CLI generates. If the app has a UI, give it its own visual direction, set up as theme tokens for light and dark, and start `docs/brand.md` (see Tommy's [design taste](../../profile/design.md)).
3. **Write the project context.** Create `AGENTS.md`, `PROJECT.md`, and `CLAUDE.md` from the [templates](../../templates/project/AGENTS.md), and fill in the goal, the first slice, maturity, and exposure. If shaping produced a design and costs, copy them into `docs/design.md`. Don't invent one here. Pin the SWE OS version: the latest tag at https://github.com/devduck123/swe-os/releases. Point it at the SWE OS clone that actually exists on this machine, if there is one, not a guessed path.
4. **Protect secrets from the first commit.**
   - Make sure `.gitignore` covers `.env*` except `.env.example` before any secret exists.
   - If the project has environment variables, create `.env.example` listing each one with no value, with server and client variables clearly separated. A static site with none doesn't need one.
   - Add a secret scan in CI, on pull requests. Since `main` only moves through PRs, that covers every commit, and it avoids a trap: the gitleaks action fails on any push that includes the repo's first commit, because it scans from that commit's parent. A local pre-commit hook is optional: offer it, don't require it, and never make the README depend on it. On a private repo, that's the real guard. GitHub's push protection is on by default only for your pushes to public repos, and turning it on for a private repo needs paid GitHub Secret Protection.
   - Never write a real key into a file, a commit, or the chat. Read [secrets and safety](../../core/guides/secrets-and-agent-safety.md).
5. **Make it reproducible.** Pin the runtime (`.nvmrc` or equivalent) and commit the lockfile. Write the run steps into the README.
6. **Add the quality gates.** Formatter, linter, typecheck, and a test runner with one smoke test, all behind a single `check` script. Browser tests start their own server on a port of their own and never reuse one that's already running, since a stale server from another session tests old code. Stop any server you start.
7. **Add CI and the first PR.** Run `check` on every PR. Make a first commit on `main`, then put the setup on a branch as the first PR, so `main` only ever moves through PRs. Push `main` before any other branch: the first branch pushed becomes the repo's default, and Vercel deploys production from it. `gh repo create --source . --push` pushes only the branch you're on, so run it from `main`. With no remote yet, leave both ready to push.
8. **Plan the deploy.** A website goes on Vercel unless the project already uses another host. Give Tommy the steps in your report: import the repo at https://vercel.com/new, keep the framework it detects, check that the production branch is `main`, and every PR gets a preview URL. He creates the project; you don't.
9. **Keep it local first.** `npm run dev`, or the equivalent, works with seed data and no paid service. Add external services later, one at a time, as features need them. See [local first, then managed services](../../core/guides/local-first-then-managed.md).
10. **Verify from scratch.** Clone into a temporary directory outside the project (`mktemp -d`), follow only the README, and confirm `check` passes. Delete the clone afterwards. Then try committing a fake secret and confirm the scan blocks it.

## Stop rules

- Don't create accounts, sign up for services, or enter credentials. List what Tommy needs to set up, with links.
- Don't deploy to production or turn on anything that bills.
- Don't add services, layers, or tools the first slice doesn't need. A queue on day one is a smell.

## Report

```
**Set up.** The stack, with one line on why for each piece.

**Evidence.** The fresh-clone run and its `check` output. The CI secret scan catching a fake key.

**For Tommy to do.** Accounts to create, env vars to fill, and settings to turn on (a ruleset on `main` requiring a PR and `check`, which needs GitHub Pro on a private repo; push protection for a public repo; the host's preview deploys), with links.

**Deferred.** What was left out on purpose, and the trigger to add it. Also written in PROJECT.md.

**Worth learning.** One or two things about this setup worth understanding, or "nothing new".
```
