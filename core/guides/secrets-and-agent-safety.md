---
title: Secrets and safety when agents write your code
description: How API keys, tokens, and data leak in AI-built projects, and the simple setup that stops most of it before it ships.
domain: security
stage: build
freshness: evolving
status: outline
track: 4
concerns: [security, ai-features, dependencies, deployment]
---

**After this page, the reader can** set up a project where secrets stay out of Git, out of the browser, and out of agent chats, and knows exactly what to do when one leaks anyway.

## A leaked key is a bill or a breach, not a bug

- What happens in practice: scraped keys on public GitHub get used within minutes. Model API bills, crypto mining, data exfiltration.
- One concrete story to open with (generic, no private incidents).

## Secrets live in exactly two places

- On your laptop, in `.env`, which is gitignored. In the hosting platform's environment settings for each environment.
- `.env.example` lists every variable with no values, so the project is reproducible.
- Separate keys for dev, preview, and prod.

## The client-side trap

- Public prefixes like `NEXT_PUBLIC_` and `VITE_` ship to the browser, and anyone can read them.
- Server-only modules, and why model calls belong behind your own route.
- Link [how a request travels](how-a-request-travels.md) for where code runs.

## Agents change the threat model

- Pasting a key into a chat puts it in a transcript you don't control. Treat it as exposed.
- Agents can read `.env` and print it. Use dev-only keys on your laptop, and keep prod keys out of reach.
- MCP servers and tools: scoped tokens, read-only on production data.
- Permission modes and auto-approve: what to allow without asking, and what never to allow.
- Prompt injection through repo content, issues, and web pages an agent reads.
- Packages agents invent: link the [dependencies](../concerns/dependencies.md) concern.

## Catch it before it ships

- GitHub push protection, a pre-commit secret scan (gitleaks or similar), and scanning in CI.
- What each one catches and misses.

## When a key leaks anyway

- Rotate first. Deleting the commit doesn't help, because Git history, forks, and caches keep it.
- Then check usage and billing, and clean the history if you have to.
- A five-step runbook to keep handy.

## Least privilege is the cheap insurance

- Scoped tokens, spend caps on model APIs, a read-only database role for agents and analytics, and separate accounts for dev and prod.

## What the vibe-coded version misses

- A key hardcoded "just to test" and committed.
- `NEXT_PUBLIC_OPENAI_KEY`.
- A production key pasted into an agent chat.
- `.env` committed because `.gitignore` came later.
- One key shared across every environment.
- An MCP server holding a full-access production token.
- Deleting the leaked commit instead of rotating the key.

## What I'd do

- The simplest setup that covers most of it: `.env` plus `.env.example`, a gitignore written on day one, GitHub push protection, and a pre-commit scan.
- Dev keys on the laptop, prod keys only in the hosting platform, and agents never see prod.
- The `start-project` skill sets all of this up.

## What changes at scale

- Secret managers, automatic rotation, OIDC instead of long-lived CI keys, and audit logs.

## Sources to check before writing

- GitHub secret scanning and push protection docs. gitleaks. Next.js environment variable docs. OWASP Secrets Management Cheat Sheet. Claude Code and Codex permission and sandbox docs.
