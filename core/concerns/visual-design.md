---
title: Visual design
description: Is it clear, consistent, and pleasant to look at, or does it just technically render?
---

**Triggered by:** any UI.

A feature isn't done because it resembles a screenshot. Visual design is how a user knows what matters, what's clickable, and what just happened.

## Minimum bar

- Make one thing on the screen obviously most important. Size, weight, and space should say so.
- Use the project's existing spacing, type, and color tokens. If there are none, pick a small set and stick to it.
- Align things. Inconsistent gaps and edges read as broken even when nothing is.
- Make interactive elements look interactive, with hover, focus, active, and disabled states.
- Check both light and dark themes if the project has them.

## When stakes rise

- Define tokens for spacing, type scale, color, and radius, and use only those.
- Review the screen at real size next to the rest of the product. Does it look like it belongs?
- Use motion to explain a change (where something went, what appeared). Respect `prefers-reduced-motion`.

## Common misses

- Five slightly different grays and font sizes.
- Everything bold, so nothing stands out.
- Default framework styling shipped as the design.
- Dark mode with unreadable contrast because colors were hard-coded.

## Learn more

- [What a complete frontend feature includes](../guides/complete-frontend-features.md)
- [Accessibility in practice](../guides/accessibility-in-practice.md)
