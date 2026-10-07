---
title: Dependencies
description: Every package, SDK, GitHub Action, MCP server, or outside service you add is code you didn't write and now depend on. Check it before it's in.
---

**Triggered by:** adding a package, SDK, CLI, GitHub Action, MCP server, or third-party service.

Run the full check on anything unfamiliar or suggested by an agent. A well-known package like `zod` or `react` only needs to be the right name and actually needed.

## Minimum bar

- **Make sure it's the real thing.** Check the exact name, the publisher, the linked repo, and recent downloads before installing. Agents sometimes invent plausible package names, and attackers register those names. Typosquats work the same way.
- **Ask whether you need it.** If the platform or a few lines of your own code do the job, skip the dependency.
- **Check that someone maintains it.** Look for recent releases and responses to issues. Leave out anything archived or deprecated.
- **Lock it.** Commit the lockfile and install with `npm ci` in CI, so every machine gets the same versions.
- **Check the license.** Make sure it allows how you'll use the code.

## When stakes rise

- **Read what it can touch.** Install scripts, network, and filesystem access for packages. Token scopes for MCP servers, services, and GitHub Actions. Give each the least it needs.
- **Pin GitHub Actions to a commit SHA,** not a moving tag like `@main`.
- **Weigh the size of client-side code.** A 200 KB library for one date format ships to every visitor.
- **Keep it current on purpose.** Automate updates with Dependabot or Renovate, run an audit in CI, and read the changelog before major upgrades.
- **Plan the exit for services.** Know how you'd export your data, and how much code a swap would touch.

## Common misses

- `npm install` on a package name the agent made up.
- A dependency abandoned three years ago, with an open security issue.
- A huge library pulled in for one function.
- A GitHub Action on `@main` that changes under you.
- An MCP server holding a full-access production token.
- A service with no export, chosen for its free tier.

## Learn more

- [Security](security.md) and [cost](cost.md)
- [Secrets and safety when agents write your code](../guides/secrets-and-agent-safety.md)
- [Simple first: when complexity earns its place](../guides/simple-first.md)
