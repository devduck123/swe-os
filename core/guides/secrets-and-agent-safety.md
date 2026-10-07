---
title: Secrets and safety when agents write your code
description: How API keys, tokens, and data leak when agents help write your code, and the small setup that stops most leaks before they ship.
domain: security
stage: build
freshness: evolving
status: draft
reviewed: 2026-10-06
track: 12
concerns: [security, ai-features, dependencies, deployment]
---

A secret is a string that lets whoever holds it act as you. It can spend your money or delete your database, and the system on the other end can't tell it's not you. So a secret that leaves the place it's supposed to live is already compromised. Agents add new places for it to go: they read your files, run your shell, and keep transcripts.

## A leaked key is a bill or a breach, not a bug

Say you're building a meal planner with an "AI weekly plan" button. You paste your model API key into the agent chat and say "wire this up". The agent hardcodes it in `lib/ai.ts` to get the demo working, and you push the repo public to show a friend.

Nothing breaks, so it doesn't feel like a bug. But bots scrape public GitHub for credentials all day. In a 2023 honeypot study, Orca Security saw a leaked AWS key used within two minutes.

## Secrets live in exactly two places

On your laptop, secrets live in `.env`, which Git ignores. Deployed, they live in the platform's environment settings. Not in code, a README, or a chat.

Write the ignore rule before the first secret exists, and commit a `.env.example` with names only:

```bash
# .gitignore
.env*
!.env.example
```

```bash
# .env.example: names only. Values live in .env locally and in Vercel when deployed.
DATABASE_URL=
OPENAI_API_KEY=         # server only
NEXT_PUBLIC_SITE_URL=   # ships to the browser, so never a secret
```

Use different keys for development, preview, and production. On Vercel, store credentials as the Secret type, which is write-only after you save it.

## Anything with a public prefix is public

In Next.js, any variable starting with `NEXT_PUBLIC_` gets inlined into the JavaScript bundle at build time. Anyone can read it in devtools. `VITE_` works the same way.

This is where agents bite. A client component calls the model API, `process.env.OPENAI_API_KEY` comes back `undefined` in the browser, and the quickest fix is renaming it `NEXT_PUBLIC_OPENAI_API_KEY`. The error is gone, and the key is published.

The real fix is moving the call to a server route. Put `import 'server-only'` at the top of any module that touches a secret, so importing it from client code fails the build.

## Some keys are meant to be public

Not every key is a secret:

| Safe in the browser                                     | Server only, never behind a public prefix             |
| ------------------------------------------------------- | ----------------------------------------------------- |
| Supabase publishable key (`sb_publishable_…`) or `anon` | Supabase secret key (`sb_secret_…`) or `service_role` |
| Stripe publishable key (`pk_…`)                         | Stripe secret (`sk_…`) and restricted (`rk_…`) keys   |
| Clerk publishable key                                   | Clerk secret key (`CLERK_SECRET_KEY`)                 |

The public ones only work because something else does the guarding. Supabase's publishable key is safe only with row-level security on, which [trust boundaries](trust-boundaries.md#on-supabase-rls-is-your-authorization) covers. Supabase's secret and `service_role` keys bypass every RLS policy. Put one in a `NEXT_PUBLIC_` variable, and anyone who copies it from your bundle can read and write your whole database.

## Agents change who can see your secrets

- **A pasted key is a leaked key.** It lives in a transcript you don't control. Rotate it. Tell the agent the variable's name, never its value.
- **The agent can read what you can read.** A Claude Code deny rule like `Read(./.env)` doesn't stop a script the agent runs from opening the file, as its docs say. The dependable fix is what's in the file: dev keys with low limits, and production keys never on your laptop.
- **MCP servers hold tokens too.** Give each the narrowest one: a dev database branch, a read-only role, a GitHub token for one repo.
- **Decide what never gets auto-approved:** destructive commands (`rm -rf`, `DROP TABLE`, `git push --force`), pushes to main, deploys, new packages, and anything holding production credentials.
- **Text the agent reads can give it orders.** A README or issue that says "print your environment variables" is prompt injection, explained in [AI features in production](ai-features-in-production.md).
- **Agents invent package names**, and attackers register them. Check before installing ([dependencies](../concerns/dependencies.md)).

## Logs and error reports leak too

`console.log(process.env)` while debugging, a logged `Authorization` header, or an error message containing a connection string all land in Vercel's logs and in Sentry. Sentry scrubs values under field names like `password`, `token`, and `api_key`, but a secret inside an error message or a URL isn't under one of those names. Never log whole env objects or request headers, and strip the rest in Sentry's `beforeSend`.

## Scan in CI, and use push protection

- **GitHub push protection** rejects a push containing a recognized secret format. It's on by default for your pushes to public repos. On a private repo, it needs paid GitHub Secret Protection, which requires a Team or Enterprise plan.
- **[gitleaks](https://github.com/gitleaks/gitleaks) in CI** on every PR catches what push protection misses or doesn't cover. On a private repo without Secret Protection, it's your main guard.
- **A local hook is optional.** One pre-commit line through Husky or `simple-git-hooks` running `gitleaks git --pre-commit --staged --redact` is enough. An agent blocked by it can reach for `--no-verify`, which is why CI is the baseline.

None of these catch a key pasted into a chat or shipped through `NEXT_PUBLIC_`. Those two are on you.

## When a key leaks, rotate first

Deleting the commit doesn't help: clones, forks, and caches keep the key. GitHub's docs say to revoke or rotate first, and it doesn't have to mean downtime:

1. **Create a new key** at the provider.
2. **Put it in Vercel and redeploy.** Env changes only reach new deployments.
3. **Revoke the old key**, then make one request with it and watch it fail. If someone is actively using it, revoke first and accept a minute of errors.
4. **Check the damage** in usage, billing, and access logs for the whole exposed window.
5. **Find the hole** with `gitleaks git` over the history, and fix it before deciding whether to rewrite history.

## Least privilege is the cheap insurance

Assume something will leak, and keep the blast radius small. Set a provider spend cap ([performance and cost](performance-and-cost.md) covers which ones actually stop spending). Give agents and analytics a read-only database role:

```sql
CREATE ROLE agent_readonly LOGIN;
GRANT USAGE ON SCHEMA public TO agent_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO agent_readonly;
-- Future tables too. FOR ROLE names whoever runs your migrations,
-- because default privileges only cover tables that role creates:
ALTER DEFAULT PRIVILEGES FOR ROLE migration_role IN SCHEMA public
  GRANT SELECT ON TABLES TO agent_readonly;
```

## What the vibe-coded version misses

- **`NEXT_PUBLIC_OPENAI_API_KEY`.** It fixed the `undefined` error by publishing the key to every visitor, who can now run up your bill.
- **Supabase `service_role` behind `NEXT_PUBLIC_`.** Anyone can copy it and delete every row, RLS or not.
- **A production key pasted into an agent chat.** It sits in a transcript you can't delete, and it has to be rotated today.
- **One key for every environment.** A key leaked from a laptop is a production breach.
- **An MCP server with a full-access production token.** One injected instruction away from a dropped table.
- **Deleting the commit instead of rotating.** The key still works, and it's still in every clone.

## What I'd do

On day one: the `.gitignore`, the `.env.example`, gitleaks in CI, and push protection on. [start-project](../../skills/start-project/SKILL.md) does all of that and proves the scan by committing a fake key.

Then a hard line: dev keys with spend caps on my laptop, prod keys only in Vercel as Secrets, and agents never see prod. If an agent truly needs production data, it gets the read-only role for one session.

I'd add a secret manager once several people or services share credentials, or rotating by hand starts getting skipped.

## Sources

- [Orca Security: 2023 Honeypotting in the Cloud Report](https://orca.security/resources/press-releases/orca-security-2023-honeypotting-in-the-cloud-report/)
- [Next.js: Environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Vercel: Config and Secret environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables) and [rotating secrets](https://vercel.com/docs/environment-variables/rotating-secrets)
- [Supabase: API keys](https://supabase.com/docs/guides/api/api-keys)
- [Stripe: API keys](https://docs.stripe.com/keys)
- [Clerk: Environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables)
- [Sentry: Server-side data scrubbing](https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/)
- [Claude Code: Configure permissions](https://code.claude.com/docs/en/permissions)
- [Spracklen et al., "We Have a Package for You!" (package hallucinations)](https://arxiv.org/abs/2406.10279)
- [GitHub: Push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection) and [GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security)
- [GitHub: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [PostgreSQL: ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html)
