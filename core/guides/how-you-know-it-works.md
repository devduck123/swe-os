---
title: How you know it works
description: 'Testing for confidence instead of coverage: which tests pay for themselves, what to test first, and how to make agents prove their work.'
domain: testing
stage: verify
freshness: durable
status: reviewed
track: 14
reviewed: 2026-10-06
concerns: [testing]
---

A test is a claim about your app's behavior that you can check again for free, forever. "A user can't mark someone else's invoice paid" is a claim. A test turns it into something a machine re-proves on every change. What you want is confidence that the things people depend on still work after the next change. Coverage tells you which lines ran, not whether anything checked what they did.

## "It worked when I clicked it" expires with the next change

You're building an invoicing app for freelancers. An agent adds "mark as paid", you click through it, it works, you ship. Two weeks later, a different agent session refactors how totals are calculated. Now partially paid invoices show as fully paid. Nobody clicks through that path again, so a client finds it first.

Clicking proves the code worked once, on the path you tried. With agents, code changes faster than you can re-click, and each session forgets what the last one was protecting. A test is how a requirement outlives the session that wrote it. My name is on the app, so if people use it, it gets tests.

## Test what people depend on first

Start where a silent break would hurt most:

1. **The behavior users depend on.** The core action, sign-in, and anything involving money.
2. **The failure paths.** The wrong user, invalid input, an expired session, a failed payment. AI-built code handles the happy path. These are where it doesn't.
3. **The bug you just fixed.** Write the test that reproduces it first. It fails, you fix the code, it passes, and that bug can't quietly come back.

Skip tests for throwaway prototypes, trivial glue, and what your framework already guarantees. Don't test that React renders a `div`.

## Each kind of test buys a different kind of confidence

| Kind        | What it proves                                  | Speed          | How many               |
| ----------- | ----------------------------------------------- | -------------- | ---------------------- |
| Unit        | A piece of logic gives the right answer         | Milliseconds   | Lots                   |
| Integration | Your code and the real database work together   | Under a second | One per important rule |
| End-to-end  | A user can get through a flow in a real browser | Seconds        | A handful              |

**Unit tests** (Vitest) suit pure logic, like invoice totals, date math, and parsing.

**Integration tests** are where I get most of my confidence, because that's where web app bugs live: the query, the constraint, the transaction. Run them against a real Postgres, local in Docker or a throwaway [Neon branch](https://neon.com/docs/introduction/branching) per CI run. A mocked database has no unique index, no foreign keys, and no transactions, so it happily passes code the real one would reject.

```ts
test("a user can't mark someone else's invoice paid", async () => {
  const alice = await createUser();
  const bob = await createUser();
  const invoice = await createInvoice({ ownerId: alice.id, amountCents: 5000 });

  await expect(
    markPaid({ invoiceId: invoice.id, actorId: bob.id }),
  ).rejects.toThrow(/not allowed/);

  const saved = await getInvoice(invoice.id);
  expect(saved.status).toBe('open'); // check the database, not just the error
});
```

That one test covers the authorization check, the query, and the fact that nothing was written.

**Isolate tests from day one.** If tests share rows, they pass alone and fail together, or fail only in a certain order. Either run each test inside a transaction you roll back at the end, or truncate the tables before each test. Rollback is faster, but only works when the code under test uses that same connection. Truncate is simpler when it opens its own.

**End-to-end tests** (Playwright) drive a real browser through the few flows that must never break: sign up, do the core thing, pay.

## Test the page people actually see

For UI, test what the user perceives. Playwright recommends locating elements by role and name, not CSS classes:

```ts
await page.getByRole('button', { name: 'Mark as paid' }).click();
await expect(page.getByRole('status')).toHaveText('Invoice marked paid');
```

That survives a redesign, and it fails if the button loses its accessible name, which is a real bug. `toHaveText` retries until it passes or times out, so you never need a `sleep`.

**Don't log in through the form in every test.** It's slow, and bot protection may block it. With Clerk, `@clerk/testing` gets a Testing Token in global setup (`clerkSetup()`) so bot detection lets your tests through. Then `clerk.signIn({ page, emailAddress })` signs a test user in through Clerk's Backend API. With Better Auth, the `testUtils` plugin creates a user, and its `getCookies()` returns session cookies you pass to `context.addCookies()`. Keep that plugin out of your production config.

## Some tests pass no matter what

A test that can't fail is worse than no test, because it looks like protection.

- **Mocking everything.** If the database, the API, and the auth check are all mocks, the test checks that your mocks agree with each other.
- **Asserting the mock was called.** `expect(sendEmail).toHaveBeenCalled()` proves you called a function, not that the right user got the right email.
- **Snapshot spam.** A 400-line snapshot gets updated with `-u` on every change, unread.

The quick check: break the line the test is supposed to protect, and run it. If it still passes, it isn't testing that line.

## Make agents prove their work

- **Ask for a failing test first.** For a bug, the agent reproduces it in a test, shows it failing, then fixes the code. A test that never failed hasn't proven anything.
- **Never let an agent delete, skip, or weaken a test to get green.** Watch for `.skip`, loosened assertions, and a changed expected value. If the expected total went from `4500` to `5000` in the same diff that changed the totals code, the agent may have taught the test the bug.
- **Read the tests it wrote.** Test names should read like the spec.

## CI runs the same check every time, and flaky tests poison it

Put format, lint, typecheck, and tests behind one `check` script, run it in CI on every PR, and make the PR unmergeable when it fails. Then "it passes" means the same thing for you, every agent, and every machine.

A flaky test does more damage than its own failure. People learn to hit re-run, then to ignore red, and then a real failure ships looking like every other flake. Fix it, or quarantine it with an owner and a date.

## What the vibe-coded version misses

- **Tests that share a database with no cleanup.** The suite passes on your machine, fails in CI in a different order, and everyone learns to re-run it.
- **An agent quietly updating the expected value.** The test now asserts the bug, and the diff looked like a routine fix.
- **Only happy-path tests.** Nobody checked the wrong user or the failed payment, so those are what users find.
- **Every E2E test logging in through the UI.** The suite gets slow enough that people stop running it, and bot protection makes it flaky on top.

## What I'd do

Vitest for logic and for integration tests against a real local Postgres in Docker, with each test isolated, and a fresh Neon branch in CI once the project has one. One integration test per important rule, especially authorization. A failing test before every bug fix. A `check` script that CI runs on every PR, required to merge. [start-project](../../skills/start-project/SKILL.md) sets up the runner with one real smoke test.

I'd add Playwright once the app has a flow I'd be embarrassed to see broken, usually sign-up and the core action. I'd ignore coverage percentages, though a coverage report is handy for spotting a module with no tests at all.

## Sources

- [Playwright: Best practices](https://playwright.dev/docs/best-practices)
- [Neon: Branching](https://neon.com/docs/introduction/branching)
- [Clerk: Testing with Playwright](https://clerk.com/docs/guides/development/testing/playwright/overview) and [test helpers (`clerk.signIn`)](https://clerk.com/docs/guides/development/testing/playwright/test-helpers)
- [Better Auth: Test utils plugin](https://better-auth.com/docs/plugins/test-utils)
