---
name: refactor
description: Change the shape of code without changing what it does, like merging duplicate helpers, deleting dead code, untangling a module, or moving to one pattern, with today's behavior pinned by tests first. Use when asked to clean up, refactor, simplify, or reorganize code. Not for new behavior (use build-feature) or a bug (use debug).
metadata:
  title: Refactor
  example: 'Clean up the date helpers. There are three of them now. Use my SWE OS.'
---

# Refactor

Change the shape, not the behavior, and prove you didn't. Follow the [rules for every task](../README.md#rules-for-every-task). [Keeping an agent-built codebase healthy](../../core/guides/keeping-a-codebase-healthy.md) explains why.

## Steps

1. **Say what gets simpler.** In one sentence: what the next feature or the next agent gains. If you can't say it, don't refactor.
2. **Find every copy.** Search the whole repo for the pattern, the helper, and its callers, not just the files you were pointed at.
3. **Pin today's behavior.** Make sure tests cover what the code does now on every path you'll touch, odd cases included. Add tests where they're missing, and see them pass before you change anything.
4. **Move in small steps.** Change one thing, run the checks, commit. The build stays green between steps.
5. **Change no behavior.** A bug you find stays as it is. Write it in PROJECT.md and fix it in its own PR afterwards. Changing a test's expected result to get green is a behavior change ([rule 8](../README.md#rules-for-every-task)).
6. **Delete what's left.** The old helper, its exports, unused imports, and any line in `AGENTS.md` or the docs that describes the old shape.
7. **Use the app.** Run the flows that go through the changed code, not just the tests.

## Stop rules

- The refactor only works if behavior changes: stop, say why, and ask.
- It spreads past the agreed target: finish the target, and list the rest as follow-ups.

## Report

```
**Changed.** What moved, merged, or got deleted, and the lines removed.

**Evidence.** The tests that pinned behavior, passing before and after, and what you ran in the app.

**Found.** Bugs and oddities you kept as they were, and where you wrote them down.

**Worth learning.** One line, or "nothing new".
```
