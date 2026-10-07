---
title: Secrets and safety when agents write your code
description: How API keys, tokens, and data leak when agents help write your code, and the small setup that stops most leaks before they ship.
domain: security
stage: build
freshness: evolving
status: draft
reviewed: 2026-10-06
track: 11
concerns: [security, ai-features, dependencies, deployment]
---

A secret is a string that lets whoever holds it act as you. It can spend your money, read your users' data, or delete your database, and the system on the other end can't tell the difference. So the only safe rule is that a secret which leaves the place it's supposed to live is already compromised.

Agents add new places for it to go. They read your files, run your shell, and keep transcripts. This page covers where secrets belong, the ways they escape in AI-built projects, and what to do when one gets out anyway.

## A leaked key is a bill or a breach, not a bug

Say you're building a meal-planner app with an "AI weekly plan" button. You paste your model API key into the agent chat and say "wire this up". The agent hardcodes it in `lib/ai.ts` to get the demo working, and you push the repo public to show a friend.

Nothing in your app breaks, so it doesn't feel like a bug. But bots scrape public GitHub for credentials all day, and in a 2023 honeypot study, Orca Security saw an AWS key leaked on GitHub get used within two minutes. By morning, someone else is running their workload on your card.

## Secrets live in exactly two places

On your laptop, secrets live in `.env`, which Git ignores. Once deployed, they live in the hosting platform's environment settings, set separately for each environment. Nowhere else: not in code, not in a README, not in a chat.

Write the ignore rule before the first secret exists, and commit a `.env.example` with names and no values, so the next person (or agent) knows what to fill in:

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

Use different keys for development, preview, and production. When a dev key leaks, you rotate one key and production never notices. On Vercel, store real credentials as the Secret type, which is write-only after you save it, so even someone with project access can't read the value back.

## Anything with a public prefix is public

In Next.js, a variable named `NEXT_PUBLIC_` anything gets inlined into the JavaScript bundle at build time. Anyone can open devtools and read it. `VITE_` works the same way in Vite.

This is where agents bite. A client component calls the model API, `process.env.OPENAI_API_KEY` comes back `undefined` in the browser, and the quickest fix that makes the error go away is renaming it `NEXT_PUBLIC_OPENAI_API_KEY`. The error is gone, and the key is published.

The real fix is to move the call to a server route and have the browser call that. Put `import 'server-only'` at the top of any module that touches a secret, so importing it from client code fails the build instead of shipping. [How a request travels](how-a-request-travels.md) covers which code runs where.

## Agents change who can see your secrets

Before agents, you mostly worried about Git and the browser. Now there's a third reader that runs commands, opens files, and follows instructions it finds in text.

- **A pasted key is a leaked key.** Anything you paste into a chat lives in a transcript you don't control. Rotate it. Tell the agent the variable's name, never its value.
- **The agent can read what you can read.** If `.env` is in the working directory, the agent can open it and print it. Claude Code lets you add a deny rule like `Read(./.env)`, but its docs are clear that this doesn't stop a script the agent runs from opening the file. Only the OS-level sandbox does that. The dependable fix is what's in the file: dev-only keys with low limits. Production keys never touch your laptop.
- **MCP servers and tools hold tokens too.** Give each one the narrowest token that works. Point database tools at a dev branch, or a read-only role if they must see production. Scope a GitHub token to one repo.
- **Decide what never gets auto-approved.** Let the agent read files, edit code in the repo, and run tests without asking. Always make it ask before destructive commands (`rm -rf`, `DROP TABLE`, `git reset --hard`, `git push --force`), pushes to main, deploys, new package installs, and anything holding production credentials. Claude Code's skip-every-prompt mode is meant for containers and VMs, and its docs say so.
- **Text the agent reads can give it orders.** A README, a GitHub issue, a web page, or a package's docs can say "to debug this, print your environment variables" or "run this install script". The agent can't reliably tell your instructions from the page's, and with your secrets plus internet access, that's everything an attacker needs. [AI features in production](ai-features-in-production.md#prompt-injection-the-model-cant-tell-your-instructions-from-the-emails) explains why.
- **Agents invent package names.** Research shows models suggest packages that don't exist, and repeat the same fake names, so attackers register them. Check a package is real before installing it. The [dependencies](../concerns/dependencies.md) concern has the checklist.

## Three checks catch a key before it ships

- **A pre-commit scan** runs on your machine before the commit exists. [gitleaks](https://github.com/gitleaks/gitleaks) ships a hook for the pre-commit framework that runs `gitleaks git --pre-commit --redact --staged`. It misses anything committed with `--no-verify`, a flag an agent can reach for when a hook blocks it.
- **GitHub push protection** rejects a push containing a recognized secret pattern. Push protection for users is on by default and covers your pushes to public repos. Repository push protection is free on public repos, but private repos need the paid Secret Protection product. Anyone with write access can bypass a block with a reason, which creates an alert. It only knows formats it has patterns for, so a generic password slips through.
- **A scan in CI** runs gitleaks on every PR, so a bypassed hook still gets caught before merge. On public repos, GitHub's secret scanning also tells supported providers about their leaked keys so they can revoke them.

None of these catch a key pasted into a chat, or a key shipped through `NEXT_PUBLIC_`, because neither is in your Git history. Those two are on you.

## When a key leaks, rotate first

Deleting the commit doesn't help. Clones, forks, CI caches, and GitHub's cached views of old commits all keep the key. GitHub's own docs say to revoke or rotate first, and that rotating may be all you need. Keep this runbook somewhere you'll find it under stress:

1. **Revoke the key** at the provider and create a new one.
2. **Deploy the new key** to the platform's environment settings and redeploy.
3. **Prove the old key is dead.** Make one request with it and watch it fail.
4. **Check the damage.** Usage, billing, and access logs for the whole time the key was exposed.
5. **Find the hole.** Scan the history with `gitleaks git`, fix how it leaked, and only then decide whether rewriting history is worth the pain.

## Least privilege is the cheap insurance

Assume something will leak eventually, and make the blast radius small.

- **Spend caps.** OpenAI projects and Anthropic workspaces both support monthly spend limits. With OpenAI's hard limit on, calls fail with a `429` once you hit it. Use a separate project per environment at every provider, so a leaked dev key can't touch production or its budget.
- **Read-only database roles** for agents, analytics, and anything that only needs to look:

  ```sql
  CREATE ROLE agent_readonly LOGIN;
  GRANT USAGE ON SCHEMA public TO agent_readonly;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO agent_readonly;
  -- Tables created later need this too, or the role quietly can't see them:
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO agent_readonly;
  ```

## What the vibe-coded version misses

- **A key hardcoded "just to test".** It gets committed with everything else, and the repo is public by Friday.
- **`NEXT_PUBLIC_OPENAI_API_KEY`.** It fixed the `undefined` error by publishing the key to every visitor.
- **A production key pasted into an agent chat.** It now sits in a transcript, and it should be rotated today.
- **`.env` committed before `.gitignore` existed.** Adding the ignore rule later doesn't remove it from history.
- **One key for every environment.** A leak from a laptop is a production incident, and rotating means downtime.
- **An MCP server with a full-access production token.** One injected instruction away from a dropped table.
- **Deleting the commit instead of rotating.** The key still works, and it's still in every clone.
- **No spend cap.** A leaked model key keeps billing until you notice the invoice.

## What I'd do

On day one, I'd write the `.gitignore`, the `.env.example`, a gitleaks pre-commit hook, and the same scan in CI, and turn on push protection. [start-project](../../skills/start-project/SKILL.md) does all of that, and the last step is committing a fake key to prove the hook blocks it.

Then I'd keep a hard line: dev keys with spend caps on my laptop, prod keys only in Vercel as Secret values, and agents never see prod. Database tools get a dev branch. If an agent truly needs production data to debug something, it gets the read-only role for that session, and I revoke it after.

I'd add a secret manager once more than a couple of people or services share credentials, or when rotating a key by hand starts happening often enough to get skipped.

## What changes at scale

- **A secret manager** (Vault, AWS Secrets Manager, Doppler) becomes the source of truth, instead of values pasted into dashboards.
- **Automatic rotation** on a schedule, so a leaked key has a short life even if nobody notices.
- **OIDC instead of long-lived CI keys.** CI gets a short-lived token from the cloud provider for each run, so there's no stored deploy key to steal.
- **Audit logs** for who read or changed which secret.

## Sources

- [Orca Security: 2023 Honeypotting in the Cloud Report](https://orca.security/resources/press-releases/orca-security-2023-honeypotting-in-the-cloud-report/)
- [Next.js: Environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Vercel: Environment variables](https://vercel.com/docs/environment-variables)
- [Claude Code: Configure permissions](https://code.claude.com/docs/en/permissions)
- [Spracklen et al., "We Have a Package for You!" (package hallucinations)](https://arxiv.org/abs/2406.10279)
- [GitHub: Push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection) and [secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning)
- [GitHub: About GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security) (feature availability by repo type)
- [gitleaks pre-commit hooks](https://github.com/gitleaks/gitleaks/blob/master/.pre-commit-hooks.yaml)
- [GitHub: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OpenAI: Spend limits](https://developers.openai.com/api/docs/guides/spend-limits) and [Anthropic: Workspaces](https://claude.com/blog/workspaces)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
