---
title: Payments
description: Who has paid for what right now, and what happens when that changes.
---

**Floor:** payments always get "when stakes rise", even in a prototype.

## Minimum bar

- Grant access from the payment provider's verified webhook, never from the success page or its URL. The success page only says you're confirming. A buyer who closes the tab still gets what they paid for, and someone who guesses the URL gets nothing.
- Look up prices on the server by product ID. Never trust an amount the browser sends.
- Give each user one customer record at the provider, save its ID on the user, and reuse it. Otherwise a second checkout makes a second customer and a second subscription.
- Save what the provider says, like the subscription's status and when the paid period ends, and decide access from it in one place on the server.
- Handle the events that take access away, not just the one that grants it: a cancellation, a failed renewal, a refund, and a dispute.
- Events arrive twice and out of order. Record each event ID once, and fetch the current state of the subscription instead of trusting the event's copy.
- Use test keys everywhere except production, previews included.

## When stakes rise

- Let people cancel and update their card themselves, through the provider's hosted billing page if it has one.
- Test a renewal, a failed payment, and a cancel at period end before launch, not just the first checkout. Stripe's test clocks fast-forward time for this.
- Check now and then that everyone with access has an active subscription at the provider, and the other way around.
- Decide what an upgrade or downgrade mid-period costs, and say it on the page before they click.
- Selling to other countries can mean collecting sales tax or VAT. Use the provider's tax tools, or a merchant of record that handles it for a bigger cut.

## Common misses

- The paid plan unlocks on `/success?session_id=...`.
- Only `checkout.session.completed` is handled, so cancelled and unpaid users keep access forever.
- A refund or a lost dispute never removes access.
- The price comes from a hidden form field.
- A preview deploy runs on live keys.

## Why, and more of what people miss

- [Background jobs and webhooks](../guides/background-jobs-and-webhooks.md)
- [Timeouts, retries, and idempotency](../guides/timeouts-retries-idempotency.md)
- [Security](security.md), [data](data.md), and [concurrency](concurrency.md), the other floors money touches
