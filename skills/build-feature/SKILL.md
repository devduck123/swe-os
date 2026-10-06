---
name: build-feature
description: Build a feature or change behavior in a project, end to end, including the edge cases its concerns call for and evidence that it works. Use for delivery work. Not for review-only requests or pure explanations.
metadata:
  title: Build a feature
  example: 'Add avatar uploads to the profile page. Use my SWE OS.'
---

# Build a feature

Deliver the smallest complete version of the feature, with proof that it works. Follow the [rules for every task](../README.md#rules-for-every-task).

## Steps

1. **Read before you write.** Read the project's `AGENTS.md` and `PROJECT.md`. Find the code and tests the feature touches. Trace the current behavior end to end.
2. **Write the outcome.** In one or two sentences, say who can do what, and the checks that will prove it. If you can't write this, part of the request still needs [shaping](../shape-project/SKILL.md). Ask one question or shape that part first.
3. **Pick the concerns.** Match the feature against the [concerns table](../../core/concerns/README.md#pick-the-concerns). Decide the depth for each. Read each picked concern's page, plus any guide it links that you need. Say in one line which concerns you picked and why.
4. **Build the smallest complete path.** Reuse the project's patterns and components. If a UI has no design direction yet, start from Tommy's [UI taste](../../profile/defaults.md#ui-taste). Cover the states your concerns call for: empty, loading, error, no permission, double submit, slow network.
5. **Verify it.** Run checks that prove the outcome from step 2, including at least one important failure path. For UI, open the rendered page at phone and desktop widths and use it with only a keyboard. Read the actual output. Don't infer it.
6. **Cut it down.** Reread your diff once. Delete anything speculative: unused options, a layer with one caller, config nobody asked for, comments that repeat the code.
7. **Write down what's deferred.** Add each deferred gap to the project's `PROJECT.md` with its risk and what would make you revisit it.

## Stop rules

- Three failed attempts at the same problem: stop, write down what you learned, and ask.
- The change needs something nobody agreed to, like a new service, a new dependency with running costs, or a schema change: stop and say so.
- Anything in the stop-and-ask list in the [rules for every task](../README.md#rules-for-every-task).

## Report

```
**What changed.** One short paragraph, in user terms first.

**Evidence.** Each command or check you ran, and what it showed.

**Concerns.** One line each:
- Security: handled. Server checks ownership; test `rejects other user's avatar` passes.
- Cost: deferred. No upload rate limit yet. Revisit before public launch. Added to PROJECT.md.
- Migrations: not applicable. No schema change.

**Not verified.** Anything you couldn't check, and why.
```
