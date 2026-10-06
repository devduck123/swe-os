---
name: review-change
description: Review a diff, PR, or proposed plan for real defects, unnecessary complexity, and user or operational impact. Read-only unless the user asks for fixes.
metadata:
  title: Review a change
  example: 'Review this upload endpoint before we turn it on. Use my SWE OS.'
---

# Review a change

Find the problems that matter, and prove them. Follow the [rules for every task](../README.md#rules-for-every-task).

## Steps

1. **Understand the intent.** Read the PR description or request, the diff, the callers of changed code, and the tests. Write down the user outcome and the contract that changed.
2. **Pick the concerns.** Use the [concerns table](../../core/concerns/README.md#pick-the-concerns) on what the change actually does. Read the pages for the ones that apply.
3. **Read past the diff.** Follow changed values across boundaries: into the database, out to the API, through the UI. Most real bugs sit where the diff meets code it didn't touch.
4. **Look in priority order.** Spend your attention where the damage is. Don't discuss naming while a race condition sits three lines away.
   1. Correctness
   2. Data loss or corruption
   3. Security
   4. Failure behavior
   5. Concurrency
   6. Architecture and boundaries
   7. Maintainability
   8. Performance, where it matters
   9. Accessibility and UX
   10. Style
5. **Prove each finding.** Name the trigger (what input or situation), the consequence (what breaks, for whom), and the evidence (a failing test, a reproduction, or a clear path through the code). If it depends on an assumption you couldn't check, say so. Describe the mechanism, not a slogan: not "this violates separation of concerns" but "this controller now validates, saves, and calls the API, so changing one means retesting all three".
6. **Check for too much, too.** Flag machinery the change doesn't need: an abstraction with one use, a dependency for ten lines of code, config for a value that never changes.
7. **Look at it running when UI changed.** If you can't, say so in the report.

## Severity

- **Critical.** Likely data loss, a security exposure, or a broad outage. Blocks release.
- **High.** A main flow fails, or a trust boundary is broken.
- **Medium.** A real, bounded bug or maintenance cost you can describe concretely.
- **Low.** A small real issue. Not taste, and not a hypothetical future scale problem.

## Stop rules

- Review only. Don't edit code, docs, or PROJECT.md unless asked. Recommend the update instead.
- No findings is a valid result. Don't invent issues to look thorough.
- One root cause is one finding, even if it shows up in five places.

## Report

```
**Verdict.** Ship it, fix first, or rethink. One sentence why.

**Findings**, most severe first:
1. **[High] `api/upload.ts:12`. Anyone can overwrite anyone's avatar.**
   The handler takes `userId` from the request body instead of the session.
   Evidence: a request with another user's ID writes to their key.
   Fix: use `req.user.id` and reject requests with no session.

**Optional.** Small improvements, only if they're worth the reader's time.

**Not checked.** What you couldn't verify, and why.
```
