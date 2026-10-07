---
name: start-project
description: Set up a new repository the engineer way, with project context, protected secrets, quality checks, CI, preview deploys, and one command to run locally. Use when starting a new app or adopting SWE OS in a repo that has none of this. Not for shaping the idea (use shape-project first) or for adding features.
metadata:
  title: Start a project
  example: 'Set up a new Next.js app for my habit tracker. Use my SWE OS.'
---

# Start a project

Give a new repo everything a vibe-coded one is missing on day one, and nothing it doesn't need yet. Follow the [rules for every task](../README.md#rules-for-every-task).

## Steps

1. **Check the idea is shaped.** If there's no clear goal and first slice yet, run [shape-project](../shape-project/SKILL.md) first. Setup decisions follow from what's being built.
2. **Pick the stack.** Start from Tommy's [defaults](../../profile/defaults.md) unless the project calls for something else, and say in one line why for each piece. Scaffold with the framework's official CLI. Don't hand-roll what the CLI generates.
3. **Write the project context.** Create `AGENTS.md`, `PROJECT.md`, and `CLAUDE.md` from the [templates](../../templates/project/AGENTS.md). Fill in the goal, the first slice, maturity, and exposure from the shaping.
4. **Protect secrets from the first commit.**
   - Make sure `.gitignore` covers `.env*` except `.env.example` before any secret exists.
   - Create `.env.example` listing every variable with no values, with server and client variables clearly separated.
   - Add a secret scan as a pre-commit hook and in CI. On a private repo, that's the real guard. GitHub's push protection is on by default only for your pushes to public repos, and turning it on for a private repo needs paid GitHub Secret Protection.
   - Never write a real key into a file, a commit, or the chat. Read [secrets and safety](../../core/guides/secrets-and-agent-safety.md).
5. **Make it reproducible.** Pin the runtime (`.nvmrc` or equivalent) and commit the lockfile. Write the run steps into the README.
6. **Add the quality gates.** Formatter, linter, typecheck, and a test runner with one smoke test, all behind a single `check` script.
7. **Add CI.** Run `check` on every PR. Recommend connecting the repo to Vercel for preview deploys.
8. **Keep it local first.** `npm run dev`, or the equivalent, works with seed data and no paid service. Add external services later, one at a time, as features need them. See [local first, then managed services](../../core/guides/local-first-then-managed.md).
9. **Verify from scratch.** Clone into a fresh directory, follow only the README, and confirm `check` passes. Then try committing a fake secret and confirm the scan blocks it.

## Stop rules

- Don't create accounts, sign up for services, or enter credentials. List what Tommy needs to set up, with links.
- Don't deploy to production or turn on anything that bills.
- Don't add services, layers, or tools the first slice doesn't need. A queue on day one is a smell.

## Report

```
**Set up.** The stack, with one line on why for each piece.

**Evidence.** The fresh-clone run and its `check` output. The secret scan blocking a fake key.

**For Tommy to do.** Accounts to create, env vars to fill, and settings to turn on (push protection for a public repo, the Vercel link), with links.

**Deferred.** What was left out on purpose, and the trigger to add it. Also written in PROJECT.md.

**Worth learning.** One to three things about this setup worth understanding, or "nothing new".
```
