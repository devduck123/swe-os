---
title: How you know it works
description: 'Testing for confidence instead of coverage: which tests pay for themselves, what to test first, and how to make agents prove their work.'
domain: testing
stage: verify
freshness: durable
status: draft
track: 13
concerns: [testing]
---

A test is a claim about your app's behavior that you can check again for free, forever. "A user can't mark someone else's invoice paid" is a claim. A test turns it into something a machine re-proves on every change, so you don't have to remember to.

The goal is confidence that the things people depend on still work after the next change. Coverage tells you which lines ran during the tests. It doesn't tell you whether anything checked what those lines did.

## "It worked when I clicked it" expires with the next change

Say you're building an invoicing app for freelancers. An agent adds "mark as paid", you click through it, it works, you ship. Two weeks later, a different agent session refactors how totals are calculated. Now partially paid invoices show as fully paid. Nobody clicks through that path again, so a client finds it first.

Clicking proves the code worked once, on your machine, on the path you happened to try. Agents make this worse. Code changes faster than you can re-click everything, and each session has no memory of what the last one was protecting. A test is how a requirement survives the session that wrote it.

It's my name on the line. If people use it, it gets tests.

## Test what people depend on first

You don't need tests for everything. You need them where a silent break would hurt. In order:

1. **The behavior users depend on.** The core action of your app, sign-in, and anything involving money.
2. **The failure paths.** The wrong user, invalid input, an expired session, a payment that fails. AI-built code handles the happy path. These are where it doesn't.
3. **The bug you just fixed.** Write the test that reproduces it before you fix it. It fails, you fix the code, it passes, and that bug can never quietly come back.

You can skip tests for throwaway prototypes, trivial glue, and behavior your framework already guarantees. Don't test that React renders a `div`.

## Each kind of test buys a different kind of confidence

| Kind        | What it proves                                  | Speed          | How many               |
| ----------- | ----------------------------------------------- | -------------- | ---------------------- |
| Unit        | A piece of logic gives the right answer         | Milliseconds   | Lots                   |
| Integration | Your code and the real database work together   | Under a second | One per important rule |
| End-to-end  | A user can get through a flow in a real browser | Seconds        | A handful              |

**Unit tests** (Vitest) suit pure logic: invoice totals, date math, permission rules, parsing. They're fast and precise, but they can't tell you whether the pieces fit.

**Integration tests** are where I get most of my confidence in a typical web app, because that's where the bugs live: the query, the constraint, the transaction. Run them against a real Postgres, either local in Docker or a throwaway [Neon branch](https://neon.com/docs/introduction/branching) per CI run. Don't mock your own database. A mock has no unique index, no foreign keys, and no transactions, so it happily passes code that the real database would reject.

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

This one test covers the authorization check, the query, and the fact that nothing was written. Those are three things a mocked version would fake.

**End-to-end tests** (Playwright) drive a real browser through the few flows that must never break, like sign up, do the core thing, and pay. They're slower and have more moving parts, so keep them to a handful.

## Test the page people actually see

A passing API test says nothing about a button that never renders on a phone. For UI, test what the user perceives. Playwright's docs recommend locating elements by user-facing attributes like role and name, not CSS classes:

```ts
await page.getByRole('button', { name: 'Mark as paid' }).click();
await expect(page.getByRole('status')).toHaveText('Invoice marked paid');
```

That test survives a redesign, and it fails if the button loses its accessible name, which is a real bug. `expect(...).toHaveText` waits and retries until it passes or times out, so you never need a `sleep`. Then look at the page yourself at phone and desktop widths. [What a complete frontend feature includes](complete-frontend-features.md) and [accessibility in practice](accessibility-in-practice.md) cover what to look for.

## Some tests pass no matter what

A test that can't fail is worse than no test, because it looks like protection.

- **Mocking everything.** If the database, the API, and the auth check are all mocks, the test checks that your mocks agree with each other.
- **Asserting the mock was called.** `expect(sendEmail).toHaveBeenCalled()` proves you called a function, not that the right user got the right email.
- **Snapshot spam.** A 400-line snapshot gets updated with `-u` on every change without anyone reading the diff. It catches nothing and blocks nothing.

The quick check: delete or break the line the test is supposed to protect, and run it. If it still passes, it isn't testing that line. This is mutation testing done by hand, and it takes a minute.

## Make agents prove their work

Agents are great at writing tests and also great at making tests pass in ways you didn't intend.

- **Ask for a failing test first.** For a bug, the agent reproduces it in a test, shows it failing, then fixes the code. A test that never failed hasn't proven anything.
- **Never let an agent delete, skip, or weaken a test to get green.** Watch for `.skip`, loosened assertions, and a changed expected value. If the expected total changed from `4500` to `5000` in the same diff that changed the totals code, the agent may have taught the test the bug. The [testing](../concerns/testing.md) concern makes this a hard rule.
- **Read the tests it wrote.** Test names should read like the spec. If you can't tell what behavior a test protects, neither will the next agent. [Reading and reviewing code](reading-and-reviewing-code.md) covers how.

## CI runs the same check every time, and flaky tests poison it

Put format, lint, typecheck, and tests behind one `check` script, run it in CI on every PR, and make the PR unmergeable when it fails. Then "it passes" means the same thing for you, every agent, and every machine.

A flaky test, one that sometimes fails with no code change, does more damage than its own failure. People learn to hit re-run. Then they learn to ignore red. Then a real failure looks like every other flake and ships. The usual causes are shared state between tests, timing (`sleep` and races), test-order dependence, and calls to real third-party networks. Fix a flaky test, or quarantine it with an owner and a date. Never leave it as background noise.

## What the vibe-coded version misses

- **"It worked when I clicked it."** One manual pass on the happy path, which the next change silently breaks.
- **Tests that pass with the feature deleted.** They only check that the code runs without throwing, so they protect nothing.
- **No test for the regression.** The bug gets fixed, then comes back two refactors later, and you debug it from scratch.
- **Everything mocked.** The suite is green while the real query violates a constraint in production.
- **An agent quietly updating the expected value.** The test now asserts the bug, and the diff looked like a routine fix.
- **Only happy-path tests.** Nobody checked the wrong user, the empty list, or the failed payment, so those are what users find.
- **A flaky suite everyone re-runs.** The one real failure got the same re-run as the flakes.

## What I'd do

Vitest for logic and integration tests against a real local Postgres in Docker, with a fresh Neon branch in CI once the project has one. One integration test per important rule, especially authorization. A failing test before every bug fix. A `check` script that CI runs on every PR, required to merge. [start-project](../../skills/start-project/SKILL.md) sets up the runner with one real smoke test.

I'd add Playwright once the app has a flow I'd be embarrassed to see broken, usually sign-up and the core action, and keep it to a few tests. I'd add component tests only when a component has enough logic to break on its own. I'd ignore coverage percentages, though a coverage report is handy for spotting a whole module with no tests at all.

## What changes at scale

- **Test data management** becomes its own problem: factories, per-test databases or transactions that roll back, and seeds that stay realistic.
- **Contract tests** between services that deploy separately, so one team's change can't silently break another's.
- **Parallel and sharded suites,** because a 30-minute CI run gets skipped.
- **Flake tracking,** with automatic quarantine and someone who owns the list.
- **Testing in production,** with feature flags, canaries, and synthetic checks, because some bugs only show up with real traffic. See [shipping changes you can undo](shipping-changes-you-can-undo.md).

## Sources

- [Playwright: Best practices](https://playwright.dev/docs/best-practices)
- [Neon: Branching](https://neon.com/docs/introduction/branching)
