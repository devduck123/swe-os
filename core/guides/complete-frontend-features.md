---
title: What a complete frontend feature includes
description: Why "it matches the screenshot" isn't done, and the states, edge cases, and invisible details that separate a real UI from a demo.
domain: frontend
stage: build
freshness: durable
status: outline
track: 3
concerns:
  [
    product-ux,
    accessibility,
    responsive,
    visual-design,
    components,
    performance,
  ]
---

**After this page, the reader can** look at an AI-built screen and list what's missing before a user finds it.

## Matching the screenshot isn't done

- A mockup shows one state, with perfect data, on one screen size, used with a mouse.
- Real users bring empty accounts, slow phones, long names, keyboards, and impatience.

## Every screen has more states than the mockup

- Loading, empty, error, partial data, no permission, offline, and very long content.
- Show the same component in all of its states, side by side.

## Forms are where users get hurt

- Validate on the client for speed and on the server for truth. Same Zod schema for both.
- Double submits, the pending state, keeping input after an error, errors tied to their fields.
- react-hook-form plus Zod as the simple default.

## Keyboards and screen readers are users too

- Native elements, labels, visible focus, and focus management in modals.
- The 30-second keyboard test anyone can run.
- Link [accessibility](../concerns/accessibility.md).

## Phones, slow networks, and big fonts

- Narrow widths, touch targets, 200% zoom.
- Images: sizes, formats, lazy loading, and layout shift.
- Link [responsive](../concerns/responsive.md) and [performance](../concerns/performance.md).

## Feedback makes it feel fast

- Optimistic updates and when they're safe.
- Toasts vs. inline messages.
- Motion that explains what happened, with reduced motion respected.

## The invisible parts

- Page titles, meta and OG tags, favicon, a 404 page, error boundaries, and dark mode that actually works.
- What shows up when someone shares your link.

## What the vibe-coded version misses

- A blank screen while loading, and an empty state that's just nothing.
- "Something went wrong" with no next step.
- Submit buttons that fire twice.
- `div`s with click handlers that a keyboard can't reach.
- Horizontal scrolling on phones.
- A 4 MB hero image.
- No OG image, so shared links look broken.

## What I'd do

- shadcn/ui on Tailwind, react-hook-form plus Zod, and the five-state checklist before every PR.
- Look at the rendered page on a phone and use it with a keyboard. Agents can do this with Playwright.

## What changes at scale

- Design systems, visual regression tests, and accessibility audits with real assistive tech.

## Sources to check before writing

- WCAG 2.2 quick reference. web.dev on Core Web Vitals. shadcn/ui forms docs.
