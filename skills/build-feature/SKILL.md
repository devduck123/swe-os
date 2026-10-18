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
3. **Pick the concerns.** Match the feature against the [concerns table](../../core/concerns/README.md#pick-the-concerns) and decide the depth for each. Read each picked concern's page, plus any guide it links that you need.
4. **Build the smallest complete path.** Reuse the project's patterns and components. For UI, use the project's design tokens, never raw colors, and define them first if there are none. Make it feel designed, with the states and micro-interactions in Tommy's [design taste](../../profile/design.md). If Tommy said he wants to own part of this, or the project's `AGENTS.md` names an area he's learning and this feature is in it, leave its core decision as a `TODO(human)` with a failing test that defines done (see [learn](../learn/SKILL.md#own-a-piece)). Verify everything around it, and report the TODO as left for Tommy, not handled.
5. **Cover the states.** Handle the ones your concerns call for: empty, loading, error, no permission, double submit, slow network.
6. **Verify it.** Run checks that prove the outcome from step 2, including at least one important failure path. For UI, open the rendered page at phone and desktop widths and use it with only a keyboard. Read the actual output. Don't infer it.
7. **Cut it down.** Reread your diff once. Delete anything speculative: unused options, a layer with one caller, config nobody asked for, comments that repeat the code.
8. **Update the project's docs.** Add each deferred gap to the project's `PROJECT.md` with its risk and what would make you revisit it. If there's no `PROJECT.md`, list the gaps in your report instead. If this work finishes, changes, or creates a planned item, update `PROJECT.md` in the same change. If it adds a command, a convention, or a rule an agent couldn't infer from the code, add it to `AGENTS.md`. If it adds or swaps a part of the system, update `docs/design.md` and its costs, if the project has one. Leave these complete enough that a fresh session could start the next feature from them alone.

## Stop rules

- If you'd design it differently from what the user asked, say so in one line and build what they asked. Don't stop to re-ask a question they've already answered. If an answer doesn't settle it, go with the option you recommended and say so.

- Three failed attempts at the same problem: stop, write down what you learned, and ask.
- The change needs something the request doesn't already imply, like a paid service, a running cost, or a schema change to existing data: build everything that doesn't depend on it, state your assumption, and ask at the end. A server route for a feature the user asked for, or a well-known substitute for a package that doesn't exist, is implied.
- Anything the [rules for every task](../README.md#rules-for-every-task) say to ask about first (rules 5 to 7).

## Report

```
**What changed.** One short paragraph, in user terms first.

**Evidence.** The commands or checks you ran, and what they showed.

**Open.** One line for each thing that's deferred, unknown, or not verified, with what would close it. Leave out what's handled; the evidence shows it. "Cost: deferred. No upload rate limit yet; add one before launch."

**Worth learning.** One non-obvious point the reply hasn't already made, or "nothing new".
```

Most reports fit in 150 to 250 words. Leave out a section that would be empty, and don't repeat a point in a later section.

If you open a PR, use this report as its description.
