---
title: Accessibility in practice
description: Building interfaces that work with a keyboard, a screen reader, zoom, and imperfect vision, what shadcn/ui handles for you, and the five-minute check that catches most of the rest.
domain: frontend
stage: build
freshness: durable
status: draft
track: 9
reviewed: 2026-10-06
concerns: [accessibility, responsive, visual-design]
---

Accessibility is whether someone can use your app without a mouse, without seeing the screen, or with the text at twice the size. If they can't sign up, the signup form is broken for them, the same way it's broken when it returns a `500`. That's why I treat it as [correctness](../principles.md#accessibility-is-correctness), not polish.

The good news: native HTML elements already work with keyboards and screen readers. Most accessibility bugs are places where someone replaced a working element with a `div` and didn't rebuild what they threw away.

## Who you're building for

Picture real people, not a checklist. Someone with a tremor who uses only a keyboard. A blind user hearing your page through VoiceOver or NVDA. Someone with low vision at 200% zoom. Someone colorblind who can't tell your red error border from your green one. Someone with a vestibular disorder who gets nauseous from big animations. Then add the temporary versions: a broken wrist, a phone in bright sunlight, a dead trackpad.

Here's how it bites. An agent builds your signup page with a styled `<div onClick>` as the "Create account" button. It looks perfect. A keyboard user presses Tab, focus skips right past it, and there's no way to sign up. Your analytics just show a visitor who left.

## When it matters

For any UI people use, from day one. Retrofitting is far more expensive than building it right, because the fixes touch every component.

There's legal exposure too. In the US, lawsuits over inaccessible websites are filed under the ADA. In the EU, the European Accessibility Act has applied since 28 June 2025 to a range of products and services, including e-commerce. Whether any of it covers your project depends on where you operate and what you sell, so check once you're charging money.

## Start with the element that already works

A native `<button>` gives you a lot for free: it's in the tab order, Enter and Space activate it, screen readers announce it as a button, `disabled` really disables it, and inside a form it submits.

```tsx
// Looks the same. Only one of these works without a mouse.
<div className="btn" onClick={save}>Save</div>
<button className="btn" onClick={save}>Save</button>
```

To make the `div` match, you'd need `role="button"`, `tabIndex={0}`, key handlers, and disabled handling. Nobody remembers all of it. Use the right element:

- `<button>` for actions, `<a href>` for navigation. If it changes the URL, it's a link.
- `<label>` tied to every input, with `htmlFor` matching the input's `id`.
- Real headings (`h1` to `h3`) in order. Screen reader users jump between headings to skim a page.
- Landmarks like `<nav>` and `<main>`, so people can skip straight to the content.

Reach for ARIA only when no native element fits. ARIA changes what assistive technology announces. It doesn't add any behavior.

## Every control needs a name a screen reader can say

The accessible name is what a screen reader reads out for a control. A visible label gives you one. These lose it:

- **Icon-only buttons.** A trash icon is read as "button", with no hint of what it does. Add `aria-label="Delete invite"`, or visually hidden text.
- **Placeholder as label.** It vanishes when you type, it's usually low contrast, and it isn't a reliable name. Use a real label.
- **Images.** Meaningful images need `alt` text that says what matters. Decorative ones get `alt=""`, so they're skipped.
- **Vague links.** Ten "Learn more" links are useless when a screen reader lists all the links on the page.

## Focus should be visible and go where the user expects

Focus is the keyboard's cursor. Users need to see it and predict where it moves.

- **Never remove the outline without a replacement.** `outline: none` with no `:focus-visible` style makes the keyboard invisible. shadcn's components ship with a focus ring. Keep it.
- **DOM order is focus order.** If CSS moves things around visually, Tab still follows the source. Reorder the markup, not just the layout.
- **Dialogs manage focus.** On open, focus moves inside and Tab stays inside. Escape closes it. On close, focus returns to the button that opened it. Without that last step, keyboard users land at the top of the page.
- **Route changes.** Next.js has a built-in route announcer that reads the new page's title on client-side navigation, falling back to the `h1` and then the URL. So give every page a unique, descriptive `<title>`.

## Errors and updates have to be announced

A red border says nothing to a screen reader, and nothing to someone who can't see red. A field error needs three things: the error as text, `aria-invalid` on the input, and `aria-describedby` linking the input to that text, so the screen reader reads the error when focus lands on the field.

```tsx
<>
  <Input
    id="email"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && <p id="email-error">{error.message}</p>}
</>
```

shadcn's `FieldError` renders with `role="alert"`, so the error is announced when it appears, but it doesn't link itself to the input. Give it an `id` and point `aria-describedby` at it.

For updates without a page change, like "Saved" or "3 results", use a live region. `role="status"` waits until the screen reader finishes speaking. `role="alert"` interrupts, so save it for errors. The region has to be in the DOM before its text changes. One that mounts already full is often not announced.

## Contrast, zoom, motion, and color

These are the WCAG 2.2 AA numbers worth knowing:

- **Text contrast.** At least 4.5:1 against the background. Large text (18pt, or 14pt bold) needs 3:1.
- **UI contrast.** Input borders, icons that carry meaning, and focus indicators need 3:1 against what's next to them.
- **Resize.** Text can grow to 200% without losing content or function.
- **Reflow.** Content works at 320 CSS pixels wide without scrolling in two directions. That's what a 1280px laptop window looks like at 400% zoom.
- **Target size.** Pointer targets are at least 24 by 24 CSS pixels, or spaced so they don't crowd each other.

Two more without numbers. Don't use color as the only signal: pair the red border with an icon and text. And respect `prefers-reduced-motion` by toning down parallax, big slides, and autoplaying animation.

## What shadcn/ui handles, and what it doesn't

shadcn/ui is built on Radix or Base UI primitives, which do the hard behavioral parts. Dialogs trap focus, close on Escape, and return focus to the trigger. Menus, selects, and tabs support arrow keys and set the right roles and states. That's hard to get right by hand, and it's the main reason I use them.

They can't handle what only you know:

- Your labels, alt text, and `aria-label`s.
- Your heading order and page structure.
- Your DOM order, if your layout rearranges things.
- Your custom colors and whether they meet contrast.
- Whether you linked your errors to their fields.
- Whether you used their `Button`, or a `div` you styled yourself.
- A `DialogTitle`. The dialog's accessible name comes from it, so don't delete it because the design has no visible title. Hide it visually instead.

## The five-minute check

1. **Keyboard only.** Put the mouse away. Tab through the whole flow, Shift+Tab back, use Enter, Space, and Escape. Can you see focus at every step? Can you finish the task? Does focus come back after the dialog closes?
2. **Zoom to 200%.** Does anything overlap, clip, or need sideways scrolling?
3. **axe DevTools.** Run the browser extension and fix what it flags. Missing names, contrast failures, and broken ARIA show up here.
4. **VoiceOver for two minutes.** On a Mac, Command-F5 turns it on. VO is Control-Option. VO-Right Arrow moves through the page, and VO-U opens the rotor, which lists headings, links, and form controls. Do the main task once and listen for unnamed buttons and errors that never get read.

Automated tools are step 3 of 4 for a reason. When the UK's Government Digital Service ran ten checkers on a page seeded with 143 known barriers, the best single tool found about 40%, and 29% weren't found by any tool. A tool can tell that an image has alt text. It can't tell whether the alt text is right.

## What the vibe-coded version misses

- **`<div onClick>` instead of a button.** Keyboard users can't reach it, so the action doesn't exist for them.
- **Placeholder as the label.** The field loses its name the moment someone types, and screen readers may not announce one at all.
- **Icon buttons with no name.** A screen reader says "button, button, button" across the toolbar.
- **Focus lost when a modal closes.** Keyboard users get dumped at the top of the page, mid-task.
- **Errors shown only in red.** Colorblind and screen reader users resubmit without knowing why it fails.
- **Toast-only feedback.** The message shows up far from the field it's about and disappears before slow readers or zoomed-in users find it.
- **Autoplaying motion.** Big animations with no reduced-motion fallback can make people physically ill.

## What I'd do

shadcn/ui for anything interactive, native elements for everything else, and a label on every input. I'd run the five-minute check before merging any UI change, and ask the agent to run axe through `@axe-core/playwright` in the tests for my main flows, so regressions fail CI.

I'd add more for anything people pay for: a screen reader pass with NVDA on Windows as well as VoiceOver, a written list of known barriers I haven't fixed, and a proper audit if I'm selling to schools, governments, or enterprises.

## What changes at scale

- **Audits by specialists** and testing with disabled users. They find what checklists can't.
- **An accessibility conformance report** (a VPAT), which larger customers ask for during procurement.
- **A design system that bakes it in**, so contrast, focus styles, and component behavior are right once and inherited everywhere.

## Sources

- [W3C: WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) and [Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [GOV.UK: What we found when we tested tools on the world's least-accessible webpage](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/)
- [AccessibleEU (European Commission): The EAA comes into effect in June 2025](https://accessible-eu-centre.ec.europa.eu/content-corner/news/eaa-comes-effect-june-2025-are-you-ready-2025-01-31_en)
- [Radix Primitives: Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [shadcn/ui: `field.tsx` source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/field.tsx)
- [Next.js: Accessibility](https://nextjs.org/docs/architecture/accessibility)
- [Apple: Turn VoiceOver on or off](https://support.apple.com/guide/voiceover/turn-voiceover-on-or-off-vo2682/mac) and [Use the VoiceOver rotor](https://support.apple.com/guide/voiceover/with-the-voiceover-rotor-mchlp2719/mac)
