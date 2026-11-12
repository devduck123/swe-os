---
title: UI quality
description: Does the UI hold up on any screen, show every state, look like it belongs, and reuse what already exists?
---

**Triggered by:** any UI, including changes to a shared component.

## Minimum bar

- Check a phone width (about 375px) and a desktop width with real content. No horizontal scrolling or clipped buttons. Long names and empty values don't break the layout.
- Make touch targets at least 24 by 24px, the WCAG 2.2 AA minimum. Apple recommends 44 by 44 points, a good size for primary actions on touch.
- Make one thing on the screen obviously most important.
- Reuse the project's components and its spacing, type, and color tokens. If there are none, pick a small set and stick to it.
- Make interactive elements look interactive, with hover, focus, active, and disabled states.
- Design the empty, loading, success, and error states. The first time a user sees your feature, it's probably empty. Error messages say what happened and what to do next, when there is a next step.
- Check light and dark themes if the project has both.
- Nothing moves after the page first paints. Reserve space for what loads late, and don't hide content until a script runs. Keep layout shift (CLS) under 0.1.
- Where text sits on or beside art, check every width from 320px up to a very wide screen, not just two. A test that sweeps widths catches the collision two screenshots miss.

## When stakes rise

- Check in-between widths and landscape. On mobile, keep the main action reachable without scrolling past everything else.
- Before changing a shared component, find every caller and check them.
- Extract a component on the second or third real use, not the first. Props describe what it shows, not how one caller uses it.
- Keep state in the lowest component that needs it. Derive values instead of syncing copies.
- Look at the screen next to the rest of the product. Does it belong?

## Common misses

- A table that overflows on phones, or a hover-only control on touch.
- Fixed heights that cut off translated or user-generated text.
- Five slightly different grays, or one button styled three ways in three files.
- A "generic" component with a boolean prop for every new caller.
- A form with no feedback after submit, so users click twice.
- An empty state that's a blank screen.
- A sidebar or menu hidden until its script loads, so the page jumps when it appears.
- Dark mode with unreadable text because colors were hard-coded.

## Why, and more of what people miss

- [What a complete frontend feature includes](../guides/complete-frontend-features.md)
- [Accessibility in practice](../guides/accessibility-in-practice.md)
- [Accessibility](accessibility.md), for focus, contrast, zoom, and motion
- [Design taste](../../profile/design.md), for the look and feel I want
