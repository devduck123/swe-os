---
title: What a complete frontend feature includes
description: A mockup is one frame. A complete feature handles every frame a real user can land on.
stage: build
track: 9
concerns: [product-ux, accessibility, ui-quality, performance]
freshness: durable
status: draft
---

A mockup is one state, perfect data, one screen size, and a mouse. Real users land on the slow network, the empty account, the error, the missing permission, and the phone. A sloppy backend can hide for months. A sloppy frontend shows on the first click.

## Easy to miss

- **Most users see the empty state first.** A new account has no data. Offer the action that fills it, like "No teammates yet. Invite one.", instead of a blank page.
- **Disable Submit only while it's sending.** A button that stays grey until the form is valid gives no hint what's wrong. One that stays live while sending gets clicked twice, so show "Sending…" and have the server reject the duplicate too, with an [idempotency key](timeouts-retries-idempotency.md) or a database rule that allows only one.
- **An error that closes the form throws away their work.** Keep it open, keep the input, and put the message on the field it's about. "Something went wrong" gives them no next step.
- **Phones have no hover.** A delete button that appears on hover doesn't exist on touch, and a tooltip on a disabled button never shows. The right `type` and `autocomplete` attributes, which tell the phone what a field holds, bring up the `@` key and fill a field in one tap.
- **Your test data is too polite.** One long email with no spaces pushes the layout off-screen, and a team of 300 needs search or pages, not a longer list.
- **Filters kept in React state die on refresh.** Filters, tabs, search, and the page number belong in the URL, so refresh, Back, and a pasted link all show the same thing.
- **The server doesn't know the user's time zone.** Format a time on the server and most users see one that's hours off. Store a UTC timestamp and format it in the browser, which knows their zone.
- **An optimistic update has to fail out loud.** That's showing the result before the server confirms it: fine for a like, never for money or email. If the server says no, undo it and say so, or it looks like the app ate their click.

**How I do it:** before every PR, an agent screenshots the loading, empty, error, and no-permission states at 375px and desktop width, and I look at them myself.

**Ask your agent:** "Screenshot this feature loading, empty, failing, and seen by a user without access, at phone and desktop width. Fake each one however you need: a slow network, a failing request, a brand-new user."

## Go deeper

- [Scott Hurff: How to fix a bad user interface](https://www.scotthurff.com/posts/why-your-user-interface-is-awkward-youre-ignoring-the-ui-stack/)
- [MDN: HTML autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
