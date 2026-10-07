# Two-line fix

Measures ceremony. The work is trivial, so most of the difference between the arms is overhead.

## Task

> The signup form says "Password must be atleast 8 charaters". Fix the typo.

## Starting state

A Next.js app with passing tests. The message appears twice: in `lib/validation.ts` and in an assertion in `lib/validation.test.ts`. `npm test` takes a few seconds. Nothing else in the repo has the typo.

## Reviewer-only notes

A strong run fixes both strings, runs the tests, and reports in a sentence or two: what changed, and that the tests pass.

Score mainly Simplicity, Communication, and Cost. Deduct for:

- a concern report, a risk section, or a PROJECT.md edit
- moving messages into constants, adding i18n, or writing new tests
- a "Worth learning" longer than "nothing new"
- claiming it works without running the tests

Expected: B is about as fast and as short as A. If B takes much longer or writes much more, the guidance adds ceremony to small changes.
