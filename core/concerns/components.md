---
title: Components
description: Are UI pieces built once and reused, with clear props and state, instead of copied around?
---

**Triggered by:** new UI pieces that appear in more than one place, or changes to a shared component.

## Minimum bar

- Before building, look for an existing component that already does it.
- Extract a component on the second or third real use, not the first.
- Props describe what the component shows, not how a single caller uses it.
- Keep state in the lowest component that needs it. Derive values instead of syncing copies.

## When stakes rise

- Changing a shared component affects every caller. Find them and check them.
- Write down the variants it supports and stop there. A component with twelve boolean props is several components.
- Cover the component's states (empty, loading, error, disabled) once, where it's defined.

## Common misses

- The same button styled three different ways in three files.
- A "generic" component built for one use that now needs a flag for every new caller.
- Two pieces of state that must agree, kept in sync by hand.

## Learn more

- [What a complete frontend feature includes](../guides/complete-frontend-features.md)
