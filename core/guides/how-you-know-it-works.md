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
3. **The bug you just fixed.** Write a test that reproduces it first. It fails, you fix the code, it passes, and that bug can't quietly come back.

Skip tests for throwaway prototypes, trivial glue, and what your framework already guarantees. Don't test that React renders a `div`.

## Each kind of test buys a different kind of confidence

- **Unit tests** (Vitest) prove a piece of logic, like invoice totals or date math, gives the right answer. They take milliseconds, so write lots.
- **Integration tests** prove your code and the real database work together. Write one per important rule.
- **End-to-end tests** (Playwright) prove a user can get through a flow in a real browser. They're slow, so keep a handful.

Integration tests give me the most confidence, because that's where web app bugs live: the query that forgets to filter by user, the duplicate the database should reject. Run them against a real Postgres, not a mock (a fake stand-in that returns whatever the test tells it to). A mocked database enforces none of your rules, so it passes code the real one would reject.

`createUser()` and `createInvoice()` are helpers you write once: each inserts a row and returns it. Notice the last two lines check the database, not just the error:

```ts
test("a user can't mark someone else's invoice paid", async () => {
  const alice = await createUser();
  const bob = await createUser();
  const invoice = await createInvoice({ ownerId: alice.id, amountCents: 5000 });

  await expect(
    markPaid({ invoiceId: invoice.id, actorId: bob.id }),
  ).rejects.toThrow(/not allowed/);

  const saved = await getInvoice(invoice.id);
  expect(saved.status).toBe('open');
});
```

That one test covers the authorization check, the query, and the fact that nothing was written.

**Isolate tests from day one.** If tests share rows, they pass alone and fail together. Empty the tables before each test, and run integration test files one at a time (Vitest's `fileParallelism: false`) so they can't wipe each other's rows.

## Test the page people actually see

For UI, test what the user perceives. Playwright recommends finding elements by role and visible name, not CSS classes. Notice there's no `sleep`: `toHaveText` retries until it passes or times out.

```ts
await page.getByRole('button', { name: 'Mark as paid' }).click();
await expect(page.getByRole('status')).toHaveText('Invoice marked paid');
```

That survives a redesign, and it fails if the button loses its accessible name (the label a screen reader announces), which is a real bug.

**Don't log in through the form in every test.** It's slow, and bot protection may block it. Log in once in a setup step, save the signed-in state with Playwright's `storageState`, and start every test from it. On Supabase, create that test user in setup with `supabase.auth.admin.createUser()` against your local stack.

<details>
<summary>Going deeper: test sign-in with Clerk or Better Auth</summary>

With Clerk, `@clerk/testing` gets a Testing Token in global setup (`clerkSetup()`) so bot detection lets your tests through. Then `clerk.signIn({ page, emailAddress })` signs a test user in through Clerk's Backend API. With Better Auth, the `testUtils` plugin creates a user, and its `getCookies()` returns session cookies you pass to `context.addCookies()`. Keep that plugin out of your production config.

</details>

## Some tests pass no matter what

A test that can't fail is worse than no test, because it looks like protection.

- **Mocking everything.** If the database, the API, and the auth check are all mocks, the test checks that your mocks agree with each other.
- **Asserting the mock was called.** `expect(sendEmail).toHaveBeenCalled()` proves you called a function, not that the right user got the right email.
- **Snapshot spam.** A snapshot test saves the output and fails when it changes. A 400-line one gets re-saved on every change, unread.

The quick check: break the line the test is supposed to protect, and run it. If it still passes, it isn't testing that line.

## Make agents prove their work

- **Ask for a failing test first.** For a bug: "Write a test that reproduces this bug, show me it failing, then fix it." A test that never failed hasn't proven anything.
- **Never let an agent delete, skip, or weaken a test to get green.** Watch for `.skip`, loosened assertions, and changed expected values. If the expected total went from `4500` to `5000` in the diff that changed the totals code, the agent may have taught the test the bug.
- **Read the tests it wrote.** Test names should read like the spec.

## CI runs the same check every time, and flaky tests poison it

Put formatting, lint (a scan for suspicious code), type checks, and tests behind one `check` script. CI runs it on every PR, and a failing PR can't merge. Then "it passes" means the same thing for you, every agent, and every machine.

A flaky test (one that fails at random) does more damage than its own failure. People learn to hit re-run, then to ignore red, and then a real failure ships looking like every other flake. Fix it, or skip it on purpose with an owner and a date.

## What the vibe-coded version misses

- **Tests that share rows with no cleanup.** The suite fails at random in CI, and everyone learns to re-run it.
- **An agent quietly updating the expected value.** The test now asserts the bug, and the diff looked like a routine fix.
- **Only happy-path tests.** Nobody checked the wrong user, so a user finds it.
- **Every E2E test logging in through the UI.** The suite gets slow enough that people stop running it.

## What I'd do

- **A real Postgres for tests.** On Supabase, `supabase start` runs one locally in Docker, and `supabase db start` does it in CI after the `supabase/setup-cli` action. Otherwise, use the Docker setup from [local first, then managed](local-first-then-managed.md), and a [Neon branch](https://neon.com/docs/introduction/branching) per CI run.
- **Tests for the rules.** Ask your agent: "Add Vitest integration tests against the local database proving a user can't read or change another user's invoices. Empty the tables before each test."
- **One `check` script, required to merge.** [start-project](../../skills/start-project/SKILL.md) sets it up with one real smoke test.

I'd add Playwright once the app has a flow I'd be embarrassed to see broken, usually sign-up and the core action. I'd ignore coverage percentages.

## Sources

- [Playwright: Best practices](https://playwright.dev/docs/best-practices) and [Authentication (`storageState`)](https://playwright.dev/docs/auth)
- [Vitest: `fileParallelism`](https://vitest.dev/config/fileparallelism)
- [Neon: Branching](https://neon.com/docs/introduction/branching)
- [Supabase: Local development](https://supabase.com/docs/guides/local-development), [Testing in CI](https://supabase.com/docs/guides/deployment/ci/testing), and [`auth.admin.createUser`](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Clerk: Testing with Playwright](https://clerk.com/docs/guides/development/testing/playwright/overview) and [test helpers (`clerk.signIn`)](https://clerk.com/docs/guides/development/testing/playwright/test-helpers)
- [Better Auth: Test utils plugin](https://better-auth.com/docs/plugins/test-utils)
