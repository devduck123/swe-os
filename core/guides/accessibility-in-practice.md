---
title: Accessibility in practice
description: Building interfaces that work with a keyboard, a screen reader, zoom, and imperfect vision, what shadcn/ui handles for you, and the five-minute check that catches most of the rest.
domain: frontend
stage: build
freshness: durable
status: draft
track: 10
reviewed: 2026-10-06
concerns: [accessibility, ui-quality]
---

Accessibility is whether someone can use your app without a mouse, without seeing the screen, or with the text at twice the size. If they can't sign up, the signup form is broken for them, the same way it's broken when it returns a `500`. That's why I treat it as [correctness](../principles.md#accessibility-is-correctness), not polish. Native HTML elements already work with keyboards and screen readers. Most accessibility bugs are a working element swapped for a `div`, with nothing rebuilt.

## One `div` locks out every keyboard user

An agent builds your signup page with a styled `<div onClick>` as the "Create account" button. It looks perfect. A keyboard user presses Tab, focus skips right past it, and there's no way to sign up. Your analytics just show a visitor who left.

Build it right from day one, because retrofitting touches every component. There's legal exposure too: ADA lawsuits in the US, and the European Accessibility Act, which has applied since 28 June 2025 to services like e-commerce. The EAA exempts microenterprises providing services (fewer than 10 staff and €2 million or less in annual turnover or balance sheet), so check once you're charging money and growing.

## Start with the element that already works

A native `<button>` is in the tab order, Enter and Space activate it, and screen readers announce it as a button.

```tsx
// Looks the same. Only one of these works without a mouse.
<div className="btn" onClick={save}>Save</div>
<button className="btn" onClick={save}>Save</button>
```

To make the `div` match, you'd need `role="button"`, `tabIndex={0}`, key handlers, and disabled handling. Nobody remembers all of it. So use `<button>` for actions and `<a href>` for navigation, a `<label>` for every input, real headings in order (screen reader users skim by jumping between them), and `<nav>` and `<main>` landmarks. Reach for ARIA only when no native element fits. It changes what gets announced, not how anything behaves.

## Every control needs a name a screen reader can say

The accessible name is what a screen reader reads out. A visible label gives you one. These lose it:

- **Icon-only buttons.** A trash icon is read as "button". Add `aria-label="Delete invite"`.
- **Placeholder as label.** It vanishes when you type and isn't a reliable name. Use a real label.
- **Images.** Meaningful ones need `alt` text that says what matters. Decorative ones get `alt=""`.
- **Vague links.** Ten "Learn more" links are useless when a screen reader lists the links on the page.

## Focus should be visible and go where the user expects

- **Never remove the outline without a replacement.** shadcn's components ship with a focus ring. Keep it.
- **DOM order is focus order.** If CSS moves things around visually, Tab still follows the source.
- **Dialogs manage focus.** On open, focus moves inside and stays there. Escape closes it. On close, focus returns to the button that opened it.
- **Route changes.** Next.js has a route announcer that reads the new page's title on client-side navigation. So give every page a unique `<title>` with `metadata` or `generateMetadata`.

## Errors and updates have to be announced

A red border says nothing to a screen reader or to someone who can't see red. A field error needs the error as text, `aria-invalid` on the input, and `aria-describedby` linking the input to that text, so it's read when focus lands on the field.

```tsx
<>
  <Input
    id="email"
    autoComplete="email"
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && <p id="email-error">{error.message}</p>}
</>
```

shadcn's `FieldError` doesn't link itself to the input, so give it an `id` and point `aria-describedby` at it. Then three form habits:

- **On a failed submit, move focus to the first invalid field.** react-hook-form's `shouldFocusError` does this by default, as long as the input gets the field's `ref`. Don't turn it off. Without it, a screen reader user hears nothing after pressing Submit.
- **Don't disable Submit until the form is valid.** A disabled button drops out of the tab order, so keyboard users can't even find it, and nobody learns which field is wrong.
- **Add `autocomplete`** to fields about the user (`email`, `name`, `tel`, `new-password`). WCAG AA expects it (SC 1.3.5), and it saves everyone who types slowly from typing at all.

For updates without a page change, like "Saved" or "3 results", use a live region. `role="status"` waits until the screen reader finishes speaking. `role="alert"` interrupts, so save it for errors. The region has to be in the DOM before its text changes, or it often isn't announced.

## Contrast, zoom, motion, and color

The WCAG 2.2 AA numbers worth knowing:

- **Text contrast.** At least 4.5:1 against the background. Large text needs 3:1.
- **UI contrast.** Input borders, meaningful icons, and focus indicators need 3:1.
- **Resize and reflow.** Text grows to 200% without losing content, and the page works at 320 CSS pixels wide without scrolling sideways.
- **Target size.** At least 24 by 24 CSS pixels. I aim for 44, Apple's recommendation, for anything a thumb hits.

Don't use color as the only signal: pair the red border with an icon and text. And respect `prefers-reduced-motion`, since big movement makes some people dizzy or nauseous. In Tailwind, put animations behind `motion-safe:`.

## What shadcn/ui handles, and what it doesn't

shadcn/ui is built on Radix or Base UI primitives, which do the hard behavioral parts: focus in dialogs, arrow keys in menus and tabs, and the right roles. That's the main reason I use them. They can't fix your labels, alt text, heading order, colors, or a `div` you styled yourself. And keep the `DialogTitle`, since the dialog's accessible name comes from it. Hide it visually instead of deleting it.

## The five-minute check

1. **Keyboard only.** Do the whole flow with Tab, Shift+Tab, Enter, Space, and Escape. Can you always see focus and finish?
2. **Zoom to 200%.** Does anything overlap, clip, or need sideways scrolling?
3. **axe DevTools.** Run the browser extension and fix what it flags.
4. **VoiceOver for two minutes.** Command-F5 turns it on. VO (Control-Option) plus Right Arrow moves through the page, and VO-U opens a list of headings, links, and form controls. Do the main task once and listen.

Automated tools are step 3 of 4 for a reason. In 2017, the UK's Government Digital Service ran ten checkers on a page seeded with 143 known barriers. The best single tool found about 40%, and 29% weren't found by any tool. A tool can tell that an image has alt text. It can't tell whether the alt text is right.

## What the vibe-coded version misses

- **Icon buttons with no name.** A screen reader says "button, button, button", so the user guesses, and guessing near Delete loses data.
- **`outline: none` for looks.** Keyboard users navigate blind, and you never get the bug report because they just leave.
- **Submit disabled until valid.** Keyboard users can't reach it, and nobody can tell which field is blocking them, so signups quietly drop.
- **Focus left on the button after a failed submit.** A screen reader user hears nothing, assumes it worked, and walks away from an unsaved form.
- **Autoplaying motion with no reduced-motion fallback.** Some people get physically ill and never come back.

## What I'd do

shadcn/ui for anything interactive, native elements for everything else, and a label on every input. I'd run the five-minute check before merging any UI change, and ask the agent to run axe through `@axe-core/playwright` in the tests for my main flows, so regressions fail CI.

For anything people pay for, I'd add an NVDA pass on Windows and a list of known barriers. If I'm selling to schools, governments, or enterprises, I'd pay for a proper audit.

## Sources

- [W3C: WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/), [Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), and [Understanding SC 1.3.5 Identify Input Purpose](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html)
- [GOV.UK (2017): What we found when we tested tools on the world's least-accessible webpage](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/)
- [AccessibleEU (European Commission): The EAA comes into effect in June 2025](https://accessible-eu-centre.ec.europa.eu/content-corner/news/eaa-comes-effect-june-2025-are-you-ready-2025-01-31_en) and [Directive (EU) 2019/882, Articles 3(23) and 4(5)](https://eur-lex.europa.eu/eli/dir/2019/882/oj)
- [react-hook-form: `useForm` (`shouldFocusError`)](https://react-hook-form.com/docs/useform)
- [Radix Primitives: Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [shadcn/ui: `field.tsx` source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/field.tsx)
- [Next.js: Accessibility](https://nextjs.org/docs/architecture/accessibility)
- [Apple: UI design dos and don'ts](https://developer.apple.com/design/tips/)
- [Apple: Turn VoiceOver on or off](https://support.apple.com/guide/voiceover/turn-voiceover-on-or-off-vo2682/mac) and [Use the VoiceOver rotor](https://support.apple.com/guide/voiceover/with-the-voiceover-rotor-mchlp2719/mac)
