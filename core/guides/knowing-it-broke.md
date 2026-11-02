---
title: Knowing it broke before your users do
description: If finding out what broke, for whom, and why takes a user's email or a new log line and a redeploy, you don't have observability yet.
stage: operate
track: 18
concerns: [observability, reliability]
freshness: durable
status: draft
---

Observability means you can answer three questions from data you already collected: is it broken, for whom, and why. For one person, the setup is small. You need it the moment strangers use the app, or it does anything you can't watch happen.

## Easy to miss

- **Users are a slow, lossy monitor.** Most people who hit a bug just leave. The ones who write do it days later, after your host has deleted that day's logs.
- **Up isn't the same as working.** An uptime check, a service that loads your site every few minutes, proves the server answers, not that signups or payments work. Count the outcomes that mean the product is doing its job, like signups per day, or payments Stripe received against orders your app marked paid.
- **A job that never runs throws no error.** Webhooks (calls other services like Stripe make to your app), scheduled jobs, and emails fail where no page breaks. Have each important job ping a heartbeat monitor, a service that expects a ping on schedule and alerts you when one doesn't come.
- **A minified stack trace is a riddle.** Minified code is squeezed into a few unreadable lines, so an error points at `a.js:1:48213`. Source maps translate that back to your file and line. Tag every error with the commit it came from too (Sentry calls this a release), so you can say "this started in the 2 p.m. deploy".
- **A request ID turns a complaint into a search.** It's a random ID made fresh for each request. Put it on every log line from that request, and show it on the error screen so the user can send it to you.
- **Logs leak.** Request bodies hold passwords, tokens, and emails, and logs get copied to more places than your database. Log IDs, not contents.
- **An alert that cries wolf hides the real one.** Every alert should mean "stop and do something". Break each alerted thing once on purpose and watch it fire.

**How I do it:** before the first real user, I set up Sentry with source maps and releases, a request ID on every log line, one uptime check, and a daily email with yesterday's signups, payments, and failed jobs.

**Ask your agent:** "Set up Sentry with source maps and the commit on every error, give every request an ID that shows up in the logs and on the error page, and add a heartbeat check to each scheduled job. Then send me a daily email with yesterday's signups, payments, and failed jobs."

## Go deeper

- [Google SRE book: Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Sentry: Source maps for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/)
