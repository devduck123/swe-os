---
title: Background jobs and webhooks
description: Work outside the request shows up late, twice, or never, so make the repeat harmless and give every failure somewhere to land.
stage: build
track: 13
concerns: [concurrency, reliability, observability]
freshness: durable
status: draft
---

A background job is work you promise to do later, outside the request that asked for it. A webhook is someone else's background job calling you, like Stripe posting to your URL when a payment lands. Both can arrive late, twice, or never. If the work is fast and the user needs the result, keep it in the request. Moving it out adds a quieter place to fail.

## Easy to miss

- **Fire-and-forget loses work without a trace.** Work you start without waiting, like an email sent after the response, has no record or retry. Write anything that must happen to a table first.
- **Every job runs twice eventually.** One that finishes and crashes before recording success looks like one that never started. Make each write check the row's status, or hit a unique constraint (a database rule that rejects a duplicate).
- **Anyone can call your webhook URL.** Without checking its signature, a stranger can post a fake "payment succeeded". The signature covers the exact text sent, so check it on the raw body before parsing it as JSON, or the check fails and tempts you to skip it.
- **Store the event before you answer 200.** Answer first and crash, and the sender never retries. Saving it under the provider's event ID also makes a repeat do nothing.
- **Events arrive out of order.** "Paid" can land before "created". Treat each event as a nudge to fetch the current state from the provider.
- **Cron is weaker than it looks.** Cron, your host calling a route on a schedule, won't retry a failed run, can fire twice, and can start before the last run ends. Have each run mark a job as taken in the same statement that picks it, so a second run skips it. The route is public too, so it checks a secret first.
- **A failure needs somewhere to land.** Count attempts, save the last error, give up after a few, and report it. A growing age on the oldest pending job is the first sign processing stopped.

**How I do it:** a `jobs` table with each job's status, attempts, and last error, and a cron run every few minutes that works through what's pending. When a failure can't wait for the next run, I add a hosted job service that retries for me.

**Ask your agent:** "Find every webhook, cron route, and after-response task in this app. Check webhook signatures on the raw body, put must-happen work in a jobs table two runs can't both claim, and make every job safe to run twice."

## Go deeper

- [Stripe: receive events in your webhook endpoint](https://docs.stripe.com/webhooks)
- [Vercel: managing cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
