---
title: Accessibility
description: Can people use it with a keyboard, a screen reader, zoom, or less-than-perfect vision?
---

**Triggered by:** any UI.

## Minimum bar

- Use native elements: `<button>` for actions, `<a>` for navigation, `<label>` tied to every input.
- Every control has an accessible name. Icon buttons need `aria-label` or visible text.
- Focus is visible, and the whole flow works with only a keyboard.
- Errors appear next to the field, in text, and are linked to it with `aria-describedby`.
- Text has enough contrast: at least 4.5:1 for body text.
- Look at the rendered page. Source code alone can't tell you the focus order.

## When stakes rise

- Check 200% zoom and reduced motion.
- Make dynamic updates like "Saved" or new results announce themselves with a live region.
- Run an automated checker (axe), then do a manual keyboard pass. Tools find only part of the problems: in a [2017 GOV.UK test](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/), the best single tool caught about 40% of known barriers.
- Try the critical journey with a screen reader. Write down any barrier you can't fix yet.

## Common misses

- A `<div onClick>` that a keyboard can't reach.
- Placeholder text used as the only label.
- Color as the only signal for an error or status.
- A modal that doesn't trap focus or return it when it closes.

## Learn more

- [Accessibility is correctness](../principles.md#accessibility-is-correctness)
- [What a complete frontend feature includes](../guides/complete-frontend-features.md)
- [Accessibility in practice](../guides/accessibility-in-practice.md)
