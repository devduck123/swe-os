---
title: Background jobs and webhooks
description: Work outside the request shows up late, twice, or never, so make the repeat harmless and give every failure somewhere to land.
stage: build
track: 13
concerns: [concurrency, reliability, observability]
freshness: durable
status: draft
---

A background job is work you promise to do later, outside the request that asked for it. A webhook is someone else's background job calling you. Both can arrive late, twice, or never. If the work is fast and the user needs the result, keep it in the request: a queue is a second place to fail, and a quieter one.

## Easy to miss

- **Fire-and-forget loses work without a trace.** Work that runs after the response has no record and no retry. Anything that must happen gets written to a table first.
- **Every job runs twice eventually.** One that finishes and crashes before recording success looks like one that never started. Make each write check the row's status, or hit a unique constraint (a database rule that rejects a duplicate).
- **Anyone can call your webhook URL.** Without checking the provider's signature, a stranger can post a fake "payment succeeded". Check it against the request exactly as it arrived, before you parse it, or the check fails and tempts you to skip it.
- **Store the event before you answer 200.** Answer first and crash, and the sender never retries. Saving it by event ID also makes a repeat delivery do nothing.
- **Events arrive out of order.** "Paid" can land before "created". Use the event to learn what changed, then fetch its current state.
- **Cron is weaker than it looks.** A scheduled run that fails isn't retried, a run can arrive twice, and a slow one can still be going when the next starts. Make sure two runs can't grab the same work.
- **A cron route is a public URL.** Anyone who finds it can trigger the job, so it checks a secret before doing anything.
- **A failure needs somewhere to land.** Count attempts, save the last error, give up after a few, and report it. A growing age on the oldest pending job is the first sign processing stopped.

**How I do it:** a `jobs` table that records each job's status, attempts, and last error. A scheduled sweep picks up whatever's pending, until retries can't wait for the next sweep and a hosted job service earns its place.

## Go deeper

- [Stripe: receive events in your webhook endpoint](https://docs.stripe.com/webhooks)
- [Vercel: managing cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
