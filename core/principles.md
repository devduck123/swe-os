---
title: Principles
description: Short rules of engineering judgment. Everything else in SWE OS builds on these.
freshness: durable
---

Apply these together, with more depth where more is at stake. When two conflict, say which one you picked and why.

## Start with the user's problem

Know whose problem gets better, and how you'll tell, before you pick a tool.

**Why:** The most expensive bug is building the wrong thing well.
**In practice:** Write the outcome in one sentence: "A busy parent can plan five dinners in under ten minutes." Until you can, don't choose a stack.

## Start simple, and make complexity earn its place

Build the simplest thing that fully solves today's problem. Every service, layer, and dependency needs a reason that exists now.

**Why:** Complexity taxes every change, bug, and new reader, and most of it never pays off.
**In practice:** Before adding a queue, cache, or service, name the problem and the evidence that it's real. "We might need it later" isn't evidence. Prefer code that's hard to misuse over code that needs a warning comment.

## Understand before you change

Read the code, trace the request, and check the history before you redesign anything.

**Why:** Code that looks wrong is often handling a case you haven't seen yet.
**In practice:** Reproduce it, read the callers, and run `git log` on the file.

## Fundamentals before tools

Reason about state, contracts, latency, and failure before naming a framework or vendor.

**Why:** Tools change every few years. The problems they solve don't.
**In practice:** Say "we need a durable queue with retries" before "let's use SQS". A pattern earns its place by the failure it prevents.

## Validate at the boundaries

Check untrusted input and enforce permissions where trust changes: at the API, the upload, the webhook. Never only in the UI.

**Why:** Anyone can skip your UI and call the API directly.
**In practice:** The server checks every request, whatever the frontend did. See [security](concerns/security.md).

## Accessibility is correctness

A feature that fails for keyboard users, screen reader users, or small screens is a broken feature.

**Why:** It's a real share of users, and fixing it later costs far more.
**In practice:** Try the flow with only a keyboard. See [accessibility](concerns/accessibility.md).

## Design for failure

Decide what happens when a dependency is slow, input is wrong, or work stops halfway.

**Why:** In production, all of these happen. You either choose the outcome or get one.
**In practice:** Every network call gets a timeout, every retry is safe to repeat, and every error message tells the user what to do next, when there is a next step. See [reliability](concerns/reliability.md).

## Protect data through change

Data outlives code. Plan for existing rows, old app versions, concurrent writers, and recovery.

**Why:** You can redeploy code in a minute. You can't redeploy a dropped column.
**In practice:** Change schemas in steps: add, backfill, switch, then remove. Test the restore, not just the backup.

## Prefer reversible decisions

When unsure, pick the option that's cheap to undo. Plan the undo before any step you can't take back.

**Why:** Most decisions are wrong in small ways. Reversible ones let you find out cheaply.
**In practice:** Use flags, additive migrations, and small PRs. Slow down on deletes, public API changes, email, and money.

## Scale from evidence

Add scale when a measurement or a real requirement says so.

**Why:** Premature scale is daily complexity for a load that may never come.
**In practice:** Profile before you optimize. One Postgres instance handles more than most side projects will ever see.

## Verify, don't assume

Tests, logs, rendered UI, and measurements beat confidence. "It compiles" is not evidence.

**Why:** AI-written code looks plausible by default. Whether it works is a separate question.
**In practice:** Run it, and watch it fail when it should. For UI, look at the page at phone width.

## Make it operable

When something breaks, someone should be able to tell what and why without archaeology.

**Why:** Debugging time is where ops costs hide.
**In practice:** Errors say what failed, with enough context to find it. See [observability](concerns/observability.md).

## Automate what you've repeated

Turn a task that keeps coming back into a script, check, or lint rule.

**Why:** A mistake caught by a check stays caught. One caught by memory comes back.
**In practice:** If you write the same review comment twice, make it a lint rule or a test.

## AI speeds up implementation, not judgment

Agents can do the mechanical work. Decisions that matter still need a person who understands them.

**Why:** AI makes it cheaper to build the wrong thing faster.
**In practice:** Give agents goals, context, and a way to check their work. Read the decisions, not just the diff.
