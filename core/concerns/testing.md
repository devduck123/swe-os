---
title: Testing
description: Evidence that the behavior works, including the ways it should fail.
---

**Triggered by:** any change in behavior.

## Minimum bar

- Prove the acceptance behavior with a check you actually ran.
- Test the most important failure path, not just the happy one.
- Report what you ran and what it showed. Never claim a test you didn't run.
- Never delete or weaken a meaningful test to get green. Fix the code or explain why the test was wrong.

## When stakes rise

- Test at the boundaries: invalid input, permissions, empty and huge data.
- Use real integrations (a real database, a real browser) where a mock would hide the bug you care about.
- For UI, check the rendered page in a browser at narrow and wide widths.
- Add tests for recovery, concurrency, or abuse when the risk calls for them.

Aim for confidence, not a coverage number.

## Common misses

- Tests that check the mock was called instead of what the user sees.
- A test that passes even when the feature is deleted.
- "Verified" meaning the code compiles.
- No test for the bug you just fixed, so it comes back.

## Learn more

- [Verify, don't assume](../principles.md#verify-dont-assume)
- [How you know it works](../guides/how-you-know-it-works.md)
- [Reading and reviewing code you didn't write](../guides/reading-and-reviewing-code.md)
- [Shipping changes you can undo](../guides/shipping-changes-you-can-undo.md)
