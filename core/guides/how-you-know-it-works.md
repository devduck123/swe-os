---
title: How you know it works
description: A test is a claim about your app that a machine re-checks on every change. Aim for confidence in what people depend on, not coverage.
stage: verify
track: 14
concerns: [testing]
freshness: durable
status: draft
---

"It worked when I clicked it" proves the code worked once, on the path you tried. Agents change code faster than you can re-click, and each session forgets what the last one was protecting. A test is how a requirement outlives the session that wrote it. Coverage, the percentage of your code the tests ran, tells you which lines ran, not whether anything checked what they did.

## Easy to miss

- **The bugs live in the failure paths.** Agent-written code handles the happy path, where everything goes right. Test the wrong user, invalid input, and the expired session first.
- **A fake database enforces none of your rules.** A mock, a stand-in that answers however the test tells it to, passes the query that forgets to filter by user, and the duplicate your real database's rules would reject. Test the important paths against a real Postgres running on your machine.
- **"The mock was called" isn't "it worked".** Checking that `sendEmail` ran doesn't prove the right person got the right email. Have the test check what the user sees or what the database holds afterward.
- **A test that can't fail looks like protection.** Break the line it guards and run it. If it still passes, it isn't testing that line.
- **A bug fix needs a test that failed first.** Write a test that reproduces the bug, watch it fail, then fix the code.
- **An agent can teach the test the bug.** Watch for a skipped test, a loosened check, or an expected value that changed in the same diff as the code it checks.

**How I do it:** tests against a local Postgres (the Supabase CLI runs one) for every rule about who can see or change what. Playwright, a tool that clicks through the app in a real browser, for the flows I'd hate to see broken. One `check` command that runs it all and has to pass before anything merges. No coverage target.

**Ask your agent:** "Write tests against a local database for who can see and change each kind of record, starting with a signed-in user trying to read someone else's. Break the line each test guards to prove it can fail, then make one command that runs them all before merge."

## Go deeper

- [Kent C. Dodds: Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
- [Playwright: best practices](https://playwright.dev/docs/best-practices)
