---
name: debug
description: Find and fix the cause of a bug, crash, or unexpected behavior from evidence, with a fast reproduction and a regression test. Use when something is broken or behaves strangely. Not for new features or review-only requests.
metadata:
  title: Debug
  example: 'Uploads randomly fail with a 413 in production but never locally. Use my SWE OS.'
---

# Debug

Find the mechanism, prove it, then fix it. Follow the [rules for every task](../README.md#rules-for-every-task).

## Steps

1. **Start from what's observed.** Get the exact symptom: the error, where it happens, how often, and since when. Check what changed around then (`git log`, deploys, config, data). Separate what someone saw from what they assume.
2. **Reproduce it on the real surface.** Use the same browser, data shape, environment, and inputs. A bug you can't reproduce is a guess.
3. **Build a fast loop.** Turn the reproduction into one command, test, or script that shows the bug in seconds, then tighten it. Every later step runs through this loop, so a fast loop makes everything after it fast.
4. **Name the most likely mechanism first.** State it in one or two sentences, with the evidence for it: "The pagination is the bug. We delete rows while paging, so later offsets shift." Keep at most two runner-up hypotheses. Don't list fifteen possibilities.
5. **Run the experiment that rules out the most.** Bisect: `git bisect`, disable half the code path, log at the boundary between two components. Change one thing at a time. Expand the search only when the evidence sends you there.
6. **Fix the cause, not the symptom.** First write a test that fails for the right reason. Then fix the code and watch the test pass. A retry or a catch-all that hides the bug is not a fix.
7. **Check the neighbors.** Look for the same pattern elsewhere, and remove the debug logging you added.

## Stop rules

- If three hypotheses in a row are wrong, stop. Write down what you've ruled out, and ask before trying a fourth.
- If you can't explain the mechanism, you haven't found the cause. Say so instead of shipping a fix you can't explain.
- Don't let a bug fix turn into a refactor. Note the refactor in PROJECT.md and stay on the bug.
- Production data, prod deploys, and anything destructive follow the stop-and-ask list in the [rules for every task](../README.md#rules-for-every-task).

## Report

```
**Cause.** The mechanism in one or two sentences.

**Evidence.** The reproduction before and after: the command and what it showed.

**Fix.** What changed, and why it fixes the cause, not just the symptom.

**Regression test.** Its name, and proof that it failed before the fix.

**Not verified.** Environments or cases you couldn't check.

**Worth learning.** The mechanism in one line, as something worth remembering, or "nothing new".
```
