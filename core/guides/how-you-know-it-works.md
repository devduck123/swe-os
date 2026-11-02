---
title: How you know it works
description: A test is a claim about your app that a machine re-checks on every change. Aim for confidence in what people depend on, not coverage.
stage: verify
track: 14
concerns: [testing]
freshness: durable
status: draft
---

"It worked when I clicked it" proves the code worked once, on the path you tried. Agents change code faster than you can re-click, and each session forgets what the last one was protecting. A test is how a requirement outlives the session that wrote it. Coverage tells you which lines ran, not whether anything checked them.

## Easy to miss

- **The bugs live in the failure paths.** Agent-written code handles the happy path. Test the wrong user, invalid input, and the expired session first.
- **A mocked database enforces none of your rules.** It passes the query that forgets to filter by user and the duplicate a real one would reject. Run integration tests against a real Postgres.
- **"The mock was called" isn't "it worked".** Checking that `sendEmail` ran doesn't prove the right person got the right email. Assert what the user sees or what the database holds.
- **A test that can't fail looks like protection.** Break the line it guards and run it. If it still passes, it isn't testing that line.
- **A bug fix needs a test that failed first.** Reproduce the bug, watch it go red, then fix it.
- **An agent can teach the test the bug.** Watch for a skipped test, a loosened assertion, or an expected value that changed in the same diff as the code it checks.
- **Flaky tests teach everyone to ignore red.** Then a real failure ships looking like every other flake. Fix it, or skip it on purpose with an owner.

**How I do it:** integration tests against a local Postgres for every rule about who can see or change what, Playwright for the flows I'd hate to see broken, one `check` script CI requires before merge, and no coverage target.

## Go deeper

- [Kent C. Dodds: Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
- [Playwright: best practices](https://playwright.dev/docs/best-practices)
