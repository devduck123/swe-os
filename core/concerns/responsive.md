---
title: Responsive design
description: Does it hold up on a phone, a laptop, and everything between?
---

**Triggered by:** any UI.

## Minimum bar

- Check a phone width (about 375px) and a desktop width with real content, not lorem ipsum.
- No horizontal scrolling. No clipped buttons.
- Touch targets are at least 44px.
- Long names, long words, and empty values don't break the layout.

## When stakes rise

- Check in-between widths, like a tablet or a narrow laptop window.
- Check landscape and 200% zoom.
- Keep the most important action reachable without scrolling past everything else on mobile.

## Common misses

- A table that overflows on phones.
- Hover-only interactions that don't exist on touch.
- Fixed heights that cut off translated or user-generated text.
- Testing only in the desktop browser the code was written in.

## Learn more

- [What a complete frontend feature includes](../guides/complete-frontend-features.md)
- [Accessibility in practice](../guides/accessibility-in-practice.md)
