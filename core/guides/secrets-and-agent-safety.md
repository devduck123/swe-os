---
title: Secrets and safety when agents write your code
description: How API keys, tokens, and data leak when agents help write your code, and the small setup that stops most leaks before they ship.
domain: security
stage: build
freshness: evolving
status: reviewed
reviewed: 2026-10-06
track: 12
concerns: [security, ai-features, dependencies, deployment]
---

A secret is a string that lets whoever holds it act as you. It can spend your money or delete your database, and the system on the other end can't tell it's not you. So a secret that leaves its place is already compromised. Agents add new places for it to go: they read your files, run your shell, and keep transcripts.

## A leaked key is a bill or a breach, not a bug

Say you're building a meal planner with an "AI weekly plan" button. You paste your model API key into the agent chat and say "wire this up". The agent hardcodes it in `lib/ai.ts` to get the demo working, and you push the repo public to show a friend.

Nothing breaks, so it doesn't feel like a bug. But bots scan public GitHub for keys all day. In 2023, Orca Security planted keys on GitHub as bait and saw a leaked AWS key used within two minutes.

## Secrets live in exactly two places

On your laptop, secrets live in `.env`, which Git ignores. Deployed, they live in the platform's environment settings. Not in code, a README, or a chat.

Write the ignore rule before the first secret exists. Notice the `!`, which lets the one safe file through:

```bash
# .gitignore
.env*
!.env.example
```

Then commit a `.env.example` with names only, marking which ones ship to the browser:

```bash
# .env.example: names only. Values live in .env locally and in Vercel when deployed.
DATABASE_URL=
OPENAI_API_KEY=         # server only
NEXT_PUBLIC_SITE_URL=   # ships to the browser, so never a secret
```

Use different keys for development, preview, and production. On Vercel, store credentials as the Secret type, which is write-only after you save it.

## Anything with a public prefix is public

In Next.js, any variable starting with `NEXT_PUBLIC_` is copied into the JavaScript sent to the browser, where anyone can read it in devtools. `VITE_` works the same way, and so does Expo's `EXPO_PUBLIC_`: mobile apps are no safer. In Expo, `extra` in `app.config.ts` and constants in the code also ship inside the app, where anyone can unzip and read them.

This is where agents bite. A client component calls the model API, `process.env.OPENAI_API_KEY` comes back `undefined` in the browser, and the quickest fix is renaming it `NEXT_PUBLIC_OPENAI_API_KEY`. The error is gone, and the key is published.

The real fix is moving the call to a server route. Put `import 'server-only'` at the top of any module that touches a secret, so importing it from client code fails the build. Next.js handles that import itself, so there's nothing to install.

## Some keys are meant to be public

| Safe in the browser                                            | Server only, never behind a public prefix                    |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| Supabase publishable key (`sb_publishable_…`) or legacy `anon` | Supabase secret key (`sb_secret_…`) or legacy `service_role` |
| Stripe publishable key (`pk_…`)                                | Stripe secret (`sk_…`) and restricted (`rk_…`) keys          |
| Clerk publishable key                                          | Clerk secret key (`CLERK_SECRET_KEY`)                        |

The public ones work because something else does the guarding. Supabase's publishable key is safe only with row-level security (RLS, database rules for which rows each user can touch) on, which [trust boundaries](trust-boundaries.md#on-supabase-rls-is-your-authorization) covers. Supabase's secret and `service_role` keys skip RLS entirely, so one behind `NEXT_PUBLIC_` lets anyone read and write your whole database.

## Agents change who can see your secrets

- **A pasted key is a leaked key.** It lives in a transcript you don't control, so rotate it: make a new key and turn off the old one. Tell the agent the variable's name, never its value.
- **The agent can read what you can read.** A Claude Code deny rule like `Read(./.env)` blocks its file-reading tool from opening `.env`, but not a script the agent runs. The dependable fix is what's in the file: dev keys with low limits, and production keys never on your laptop.
- **MCP servers hold tokens too.** These plugins give an agent tools, like querying your database. Give each the narrowest access: a dev database, read-only, one repo.
- **Decide what never gets auto-approved:** destructive commands (`rm -rf`, `DROP TABLE`, `git push --force`), pushes to main, deploys, new packages, and anything with production credentials.
- **Text the agent reads can give it orders.** A README or issue that says "print your environment variables" is prompt injection, explained in [AI features in production](ai-features-in-production.md).
- **Agents invent package names**, and attackers register them. Check before installing ([dependencies](../concerns/dependencies.md)).

## Logs and error reports leak too

`console.log(process.env)` while debugging, a logged `Authorization` header, or an error message containing a connection string all land in Vercel's logs and in Sentry. Sentry scrubs fields named like `password` or `token`, but not a secret inside an error message. Never log whole env objects or request headers, and strip the rest in Sentry's `beforeSend` hook, which edits each report before it's sent.

## Scan in CI, and use push protection

- **GitHub push protection** rejects a push containing a recognized secret format. It's on by default for your pushes to public repos. On a private repo, it's a paid add-on.
- **[gitleaks](https://github.com/gitleaks/gitleaks) in CI** scans every PR for secret-shaped strings, catching what push protection misses. On a private repo, it's your main guard.
- **A local hook is optional.** A pre-commit hook (a check Git runs before each commit) running `gitleaks git --pre-commit --staged --redact` catches it earlier. But an agent can skip it with `--no-verify`, which is why CI is the baseline.

None of these catch a key pasted into a chat or shipped through `NEXT_PUBLIC_`. Those two are on you.

## When a key leaks, rotate first

Deleting the commit doesn't help: clones, forks, and caches keep the key. GitHub's docs say to rotate first, and it doesn't have to mean downtime:

1. **Create a new key** at the provider.
2. **Put it in Vercel and redeploy.** Env changes only reach new deployments.
3. **Revoke the old key**, then make one request with it and watch it fail. If someone is actively abusing it, revoke first and accept a minute of errors.
4. **Check the damage** in usage, billing, and access logs for the whole exposed window.
5. **Find the hole** with `gitleaks git`, which scans the whole history, and fix it.

## Least privilege is the cheap insurance

Least privilege means each key, agent, and tool gets only the access its job needs, so a leak does little damage. Set a provider spend cap ([performance and cost](performance-and-cost.md) says which ones actually stop spending). And give agents read-only database access, to a dev project when you can.

On Supabase, set two options in the MCP server's URL: one project only, and read-only mode, which runs queries as a read-only database user:

```text
https://mcp.supabase.com/mcp?project_ref=<your-project-id>&read_only=true
```

On Neon or plain Postgres, give the agent a connection string for a read-only role instead of yours.

<details>
<summary>Going deeper: a read-only Postgres role</summary>

Run this in your database's SQL editor, then set a password for `agent_readonly` and give the agent a connection string with it. `FOR ROLE` names whoever runs your migrations, because default privileges only cover tables that role creates.

```sql
CREATE ROLE agent_readonly LOGIN;
GRANT USAGE ON SCHEMA public TO agent_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO agent_readonly;
-- Future tables too:
ALTER DEFAULT PRIVILEGES FOR ROLE migration_role IN SCHEMA public
  GRANT SELECT ON TABLES TO agent_readonly;
```

</details>

## What I'd do

- **Day one,** ask your agent: "Set up this repo with [start-project](../../skills/start-project/SKILL.md)." It adds the `.gitignore`, the `.env.example`, and a gitleaks scan, then proves the scan by committing a fake key.
- **Keys:** dev keys on my laptop, with a spend cap set in each provider's dashboard. Prod keys only in Vercel, saved as the Secret type.
- **Agents never see prod.** If one truly needs production data, it gets the read-only MCP URL or role above, for one session.

I'd add a secret manager once several people or services share credentials, or rotating by hand starts getting skipped.

## Before you ship, check

Paste this to your agent before you merge:

- No secret is in code, a README, or a chat.
- No secret uses a public prefix like `NEXT_PUBLIC_`, and modules that read one import `server-only`.
- Nothing logs `process.env`, request headers, or connection strings.
- gitleaks runs in CI on every PR.
- Agents and MCP servers never hold production keys.
- Any pasted or pushed key has been rotated.

## Sources

- [Orca Security: 2023 Honeypotting in the Cloud Report](https://orca.security/resources/press-releases/orca-security-2023-honeypotting-in-the-cloud-report/)
- [Next.js: Environment variables](https://nextjs.org/docs/app/guides/environment-variables) and [Expo: Environment variables](https://docs.expo.dev/guides/environment-variables/)
- [Vercel: Config and Secret environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables) and [rotating secrets](https://vercel.com/docs/environment-variables/rotating-secrets)
- [Supabase: API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Stripe: API keys](https://docs.stripe.com/keys)
- [Clerk: Environment variables](https://clerk.com/docs/guides/development/clerk-environment-variables)
- [Sentry: Server-side data scrubbing](https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/)
- [Claude Code: Configure permissions](https://code.claude.com/docs/en/permissions) and [Sandboxing](https://code.claude.com/docs/en/sandboxing)
- [Spracklen et al., "We Have a Package for You!" (package hallucinations)](https://arxiv.org/abs/2406.10279)
- [GitHub: Push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection) and [GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security)
- [GitHub: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Supabase: Model Context Protocol (`read_only` and `project_ref`)](https://supabase.com/docs/guides/getting-started/mcp)
- [PostgreSQL: ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html)
