---
title: Accessibility in practice
description: Native HTML already works with a keyboard and a screen reader. Most accessibility bugs are a working element swapped for a div.
stage: build
track: 10
concerns: [accessibility, ui-quality]
freshness: durable
status: draft
---

Accessibility is whether someone can use your app without a mouse, with a screen reader (software that reads the page aloud), or with the text at twice the size. If they can't sign up, signup is broken for them, the same as a 500. That's why I treat it as [correctness](../principles.md#accessibility-is-correctness), and why I build it in from day one: retrofitting touches every component.

## Easy to miss

- **A clickable div is invisible to a keyboard.** It looks like a button, but Tab skips it, Enter does nothing, and a screen reader doesn't call it a button. Use `<button>` for actions and `<a href>` for navigation. ARIA attributes like `role="button"` don't fix it. They change what a screen reader announces, not what works.
- **An icon has no name.** An icon-only trash button is read as "button". Give it a label that says the action, like "Delete invite". A placeholder isn't a label, since it vanishes when you type.
- **A red border says nothing.** Not to a screen reader or to someone who can't see red. A field error needs visible text tied to its input with `aria-describedby`, so it's read with the field, and a failed submit should move focus to the first bad field.
- **New text isn't read aloud unless the spot was already there.** For "Saved" or "3 results", use a live region, an element marked so screen readers announce its changes. Render it on page load and change only its text.
- **Focus has to go somewhere sensible.** Focus is the element the keyboard is on, shown by an outline. Never remove the outline without a replacement. A dialog should move focus inside, keep Tab from leaving, close on Escape, and send focus back to the button that opened it. Component libraries handle that, not your labels or colors.
- **Checkers miss most of it.** In GOV.UK's 2017 test, the best of ten tools found about 40% of the known barriers. A tool can tell an image has alt text, not whether the text is right.

**How I do it:** shadcn/ui for anything interactive, native elements for everything else, and a five-minute check before merging any UI change: keyboard only, 200% zoom, axe (a free browser extension), then two minutes with VoiceOver, the Mac's built-in screen reader.

**Ask your agent:** "Make this page work with the keyboard alone. Swap clickable divs for real buttons, name every icon button, and tie each error message to its field. Then tell me what axe can't catch, so I check it by hand."

## Go deeper

- [W3C: WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [GOV.UK: What we found when we tested tools on the world's least-accessible webpage](https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/)
