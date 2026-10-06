---
title: Principles
description: Fourteen short rules of engineering judgment. Everything else in SWE OS builds on these.
freshness: durable
---

These change slowly. Apply them together, with more depth where more is at stake. When two pull in different directions, say which one you picked and why.

## Start with the user's problem

Know whose problem gets better and how you'll tell, before you pick a tool.

**Why:** The most expensive bug is building the wrong thing well.
**In practice:** Write the outcome in one sentence: "A busy parent can plan five dinners in under ten minutes." If you can't, you're not ready to choose a stack.

## Start simple, and make complexity earn its place

Build the simplest thing that fully solves today's problem. Every service, layer, dependency, and abstraction needs a reason that exists now.

**Why:** Complexity costs you on every change, every bug, and every new person who reads the code. Most of it never pays for itself.
**In practice:** Before adding a queue, cache, or microservice, name the problem it solves and the evidence that the problem is real. "We might need it later" is not that evidence. Be boring where boring works, and clever only where cleverness buys something. Prefer code that's hard to misuse over code that needs a warning comment.

## Understand before you change

Read the code, trace the request, and check the history before you redesign anything.

**Why:** Code that looks wrong is often handling a case you haven't seen yet.
**In practice:** Reproduce the behavior first. Read the callers. Run `git log` on the file. Then change it.

## Fundamentals before tools

Reason about state, contracts, latency, and failure before naming a framework or vendor.

**Why:** Tools change every few years. The problems they solve don't. If you understand caching, you can evaluate any cache.
**In practice:** Say "we need a durable queue with retries" before you say "let's use SQS". A pattern earns its place by the failure it prevents, not because senior engineers use it.

## Validate at the boundaries

Check untrusted input and enforce permissions where trust changes: at the API, the upload, the webhook. Never only in the UI.

**Why:** Anyone can skip your UI and call the API directly.
**In practice:** The server validates every request and checks that this user may touch this record, even if the frontend already did.

## Accessibility is correctness

A feature that fails for keyboard users, screen reader users, or small screens is a broken feature.

**Why:** It's a real share of users, and fixing it after the fact costs far more than building it right.
**In practice:** Use native elements, label every control, keep visible focus, and try the flow with only a keyboard.

## Design for failure

Decide what happens when a dependency is slow, input is wrong, or work stops halfway.

**Why:** In production, every one of those happens. The only question is whether you chose the outcome or it chose you.
**In practice:** Every network call gets a timeout. Every retry is safe to repeat. Every error message tells the user what to do next.

## Protect data through change

Data outlives code. Plan for existing rows, old app versions, concurrent writers, and recovery.

**Why:** You can redeploy code in a minute. You can't redeploy a dropped column.
**In practice:** Change schemas in steps: add, backfill, switch, then remove. Test the restore, not just the backup.

## Prefer reversible decisions

When you're unsure, pick the option that's cheap to undo, and plan the undo before any step you can't take back.

**Why:** Most decisions are wrong in small ways. Reversible ones let you find out cheaply.
**In practice:** Use feature flags, additive migrations, and small PRs. Slow down on deletes, public API changes, and anything that sends email or moves money.

## Scale from evidence

Know how systems scale. Add scale when a measurement or a real requirement says so.

**Why:** Premature scale is complexity you pay for daily against a load that may never come.
**In practice:** Profile before you optimize. Load test before you shard. One Postgres instance handles more than most side projects will ever see.

## Verify, don't assume

Tests, logs, rendered UI, and measurements beat confidence. "It compiles" is not evidence.

**Why:** Plausible-looking code is the default output of an AI. Whether it works is a separate question.
**In practice:** Run it. Watch it fail when it should fail. For UI, look at the page on a phone-sized screen.

## Make it operable

When something breaks, someone should be able to tell what and why without archaeology.

**Why:** Debugging time is where ops costs hide.
**In practice:** Errors say what failed and include enough context to find it, without secrets or personal data. Know what your system costs to run.

## Automate what you've repeated

Turn a task into a script, check, or lint once you've done it by hand a few times and it keeps coming back.

**Why:** A mistake caught by a check stays caught. A mistake caught by memory comes back next month.
**In practice:** If you write the same review comment twice, make it a lint rule or a test. Don't automate a task you've done once.

## AI speeds up implementation, not judgment

Agents can do most of the mechanical work. Decisions that matter still need a person who understands them.

**Why:** AI makes it cheaper to build the wrong thing faster.
**In practice:** Give agents goals, constraints, context, and a way to check their work. Read the decisions, not just the diff. Delete guidance that doesn't make results better.
