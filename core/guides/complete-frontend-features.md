---
title: What a complete frontend feature includes
description: A mockup is one frame. A complete feature handles every frame a real user can land on.
stage: build
track: 10
concerns: [product-ux, accessibility, ui-quality, performance]
freshness: durable
status: reviewed
---

A mockup is one state, perfect data, one screen size, and a mouse. Real users land on the slow network, the empty account, the error, the missing permission, and the phone. A sloppy backend can hide for months. A sloppy frontend shows on the first click.

## Easy to miss

- **Most users see the empty state first.** A new account has no data. Offer the action that fills it, like "No teammates yet. Invite one.", instead of a blank page.
- **A dead button explains nothing.** Grey until the form is valid, it gives no hint what's wrong. Live while sending, it gets clicked twice. Show what's missing, show "Sending…", and have the server reject a duplicate too, with an [idempotency key](timeouts-retries-idempotency.md) or a database rule that allows only one.
- **An error that closes the form throws away their work.** Keep it open, keep the input, and put the message on the field it's about. "Something went wrong" gives them no next step.
- **Phones have no hover.** A delete button that appears on hover doesn't exist on touch, and a tooltip on a disabled button never shows. The right `type` and `autocomplete` attributes, which tell the phone what a field holds, bring up the `@` key and fill a field in one tap.
- **Your test data is too polite.** One long email with no spaces pushes the layout off-screen, and a team of 300 needs search or pages, not a longer list.
- **Refresh shouldn't reset the screen.** Refresh, Back, and a pasted link should show the same filters, tab, search, and page. Keeping them in the URL is the usual way.
- **The server doesn't know the user's time zone.** Format a time there and most users see one that's hours off. Store UTC, and format it where their zone is known: the browser, or a zone they saved.
- **An optimistic update has to fail out loud.** That's showing the result before the server confirms it: fine for a like, never for money or email. If the server says no, undo it and say so, or it looks like the app ate their click.

**How I do it:** before I merge, I open the preview on my phone and my desktop and click through it.

**Ask your agent:** "What does this feature look like loading, empty, failing, and to someone without access, on a phone and a desktop?"

## Go deeper

- [Scott Hurff: How to fix a bad user interface](https://www.scotthurff.com/posts/why-your-user-interface-is-awkward-youre-ignoring-the-ui-stack/)
- [MDN: HTML autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
