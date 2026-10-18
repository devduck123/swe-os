---
title: Design taste
description: What I want UIs to feel like, the freedom agents have to get there, and the few rules that never bend.
freshness: durable
---

I don't design much by hand anymore. Agents go straight to code, and some of the best UIs I've shipped came from an agent trying something I wouldn't have thought of. So this page isn't a template. It's what I like, what separates a site with soul from a vibe-coded one, and the few rules that keep a bold design usable.

## Go further than the default

Default framework styling shipped as-is isn't a design. Every product gets its own visual direction: a palette, type, shapes, and motion that fit what it is and who it's for. Pick one with conviction, and surprise me. If you're torn between two directions, build the bolder one and say what the quieter one would look like.

What I keep noticing on sites I love:

- **Micro-interactions.** A button that gives a little when pressed, a checkbox that draws its tick, a count that rolls up, a card that lifts toward the cursor, a toast that settles instead of popping. They're what make a site feel thought out.
- **Real art.** Illustrations, stickers, icons, and graphics drawn for this product, usually as inline SVG, instead of stock images or an emoji in a circle. A mascot, a hand-drawn empty state, a hero graphic with one slow, glowing motion.
- **Motion with character.** Things enter and leave with intent. Springy where the product is playful, smooth and quick where it's a tool. Motion explains a change: where something went, what just happened. CSS transitions first. In React, [Motion](https://motion.dev/) (formerly Framer Motion) is the reference for springs, gestures, layout, and exit animations.
- **Personality in the small places.** Empty states, loading states, errors, and the 404 get the same care as the main screen, in words and in pictures.
- **Type with a point of view.** A display face that carries the mood, like an editorial serif or something rounded and friendly, with a quiet text face doing the reading.
- **Cute, artsy, and expressive is welcome.** Friendly beats corporate. Restraint is a choice for a product that needs it, not the default.

## Look at what others do first

Before designing a screen or a flow, look at how two or three similar products handle it. [Mobbin](https://mobbin.com/) collects real app screens by flow, like onboarding, paywalls, and empty states. It needs my account, so ask me for screenshots instead of signing in, or visit the products' own sites. [Framer](https://www.framer.com/) sites are good for polish and motion ideas. Borrow patterns, not looks, and say in your report what you borrowed and from where. Then go straight to code. There's no mockup step.

## What I've liked

- [My portfolio](https://www.ducktommy.com/): a big editorial serif, a dark, quiet palette, one focal visual with a soft glow and slow motion, small uppercase labels, and room to breathe.
- This site's landing page: the playful end, a little cute and a little animated, with a mascot.
- [OpenPacks](https://backpacks-app.vercel.app/): a product screen kept neutral on purpose. That's the floor for a tool, not the goal.

## Keep the art: it's an asset

The mascots, stickers, icons, illustrations, and animations an agent draws for a product are some of the most valuable things in the repo, and the hardest to recreate exactly. Treat them like code: named, kept, and reused.

- **Each piece is a component.** Inline SVG in `components/brand/`, like `Mascot.tsx` or `EmptyInbox.tsx`, with props for size and pose. Colors come from theme tokens or `currentColor`, so it works in both themes. Its animation lives with it, reduced motion included. Files the browser fetches on their own, like the favicon and social image, go in `public/`.
- **One style, written down.** `docs/brand.md` describes the look: the mascot's character and proportions, stroke width, corner shape, the colors art may use, and how things move. New art follows it. To change the style, change the doc first.
- **An index.** `docs/brand.md` lists every asset in one line: what it is and where it's used. Once there are more than a few, a page that shows them all in both themes makes drift easy to spot.
- **Reuse before drawing new.** Give the mascot a new pose before inventing a second character.
- **Don't replace or restyle an existing piece** unless asked. Add a variant instead.

## The rules that don't bend

Expressive never costs someone the ability to use the thing.

- **Contrast.** Text is at least 4.5:1 against what's behind it, large text 3:1, and a form field's edge and focus ring 3:1. Check every color pair you add, in every theme the product has.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, keep fades and drop movement, parallax, and looping animation. Anything that loops for more than five seconds gets a pause control.
- **Motion never blocks.** Nobody waits for an animation to finish before they can act. UI transitions take 150 to 300ms. Animate `opacity` and `transform`, which don't make the page recompute its layout.
- **Art is accessible and light.** A decorative graphic is hidden from screen readers (`aria-hidden="true"` or empty `alt`), and a meaningful one gets a text alternative. Inline SVG and CSS before big images and heavy animation libraries. The page's main content still loads fast on a phone.
- **Keyboard and touch work.** Every interactive thing has a visible focus state and works by keyboard. Hover effects are a bonus, never the only way to find a control. Primary touch targets are about 44px.
- **One system per project.** Whatever direction you pick, write it down as tokens in the theme file: colors for light and dark, type, radius, shadows, and motion timing. Components use the tokens, never raw hex or one-off values, so the tenth screen matches the first. With shadcn/ui, that's its [theme variables](https://ui.shadcn.com/docs/theming), and new ones go through `@theme inline`.

<details>
<summary>One palette I like, if a product wants this feel</summary>

My portfolio's colors as shadcn/ui tokens: warm paper (hue 90) and ink in light mode, deep slate (hue 260) with warm off-white text in dark. I darkened four light-mode text colors from the original so each passes 4.5:1 on the background, on `muted`, and on its own 10% tint. `--input` is darker than `--border` so form fields have a 3:1 edge. This was built with Tailwind 4.3.3 and checked in both themes. Tailwind ignores `--shadow-*` set in `:root`, which is why shadows and easing map through `@theme inline`.

```css
:root {
  --radius: 0.5rem;
  --background: oklch(0.98 0.01 90); /* warm paper */
  --foreground: oklch(0.25 0.02 260); /* ink */
  --card: oklch(0.99 0 0);
  --card-foreground: oklch(0.25 0.02 260);
  --popover: oklch(0.99 0 0);
  --popover-foreground: oklch(0.25 0.02 260);
  --primary: oklch(0.35 0.04 260); /* ink navy: the main action */
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.96 0.01 90);
  --secondary-foreground: oklch(0.35 0.04 260);
  --muted: oklch(0.96 0.01 90);
  --muted-foreground: oklch(0.52 0.02 260);
  --accent: oklch(0.96 0.01 90); /* shadcn's hover surface, not a brand color */
  --accent-foreground: oklch(0.35 0.04 260);
  --destructive: oklch(0.52 0.16 25);
  --success: oklch(0.49 0.13 155);
  --warning: oklch(0.51 0.12 70);
  --info: oklch(0.5 0.13 250);
  --status-foreground: oklch(0.98 0 0);
  --border: oklch(0.9 0.01 90);
  --input: oklch(0.64 0.02 260);
  --ring: oklch(0.35 0.04 260);
  --elevation-sm: 0 1px 3px oklch(0.25 0.02 260 / 0.06);
  --elevation-md: 0 2px 12px -2px oklch(0.25 0.02 260 / 0.1);
  --elevation-lg: 0 4px 24px -4px oklch(0.25 0.02 260 / 0.12);
  --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
}

.dark {
  --background: oklch(0.18 0.02 260); /* deep slate */
  --foreground: oklch(0.95 0.01 90); /* warm off-white */
  --card: oklch(0.22 0.02 260);
  --card-foreground: oklch(0.95 0.01 90);
  --popover: oklch(0.22 0.02 260);
  --popover-foreground: oklch(0.95 0.01 90);
  --primary: oklch(0.9 0.01 90);
  --primary-foreground: oklch(0.25 0.02 260);
  --secondary: oklch(0.25 0.02 260);
  --secondary-foreground: oklch(0.95 0.01 90);
  --muted: oklch(0.25 0.02 260);
  --muted-foreground: oklch(0.7 0.02 260);
  --accent: oklch(0.25 0.02 260);
  --accent-foreground: oklch(0.95 0.01 90);
  --destructive: oklch(0.7 0.15 25);
  --success: oklch(0.65 0.15 155);
  --warning: oklch(0.75 0.14 75);
  --info: oklch(0.65 0.12 250);
  --status-foreground: oklch(0.18 0.02 260);
  --border: oklch(0.3 0.02 260);
  --input: oklch(0.52 0.02 260);
  --ring: oklch(0.8 0.01 90);
  --elevation-sm: 0 1px 3px oklch(0 0 0 / 0.2);
  --elevation-md: 0 2px 12px -2px oklch(0 0 0 / 0.3);
  --elevation-lg: 0 4px 24px -4px oklch(0 0 0 / 0.35);
}

@theme inline {
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-info: var(--info);
  --color-status-foreground: var(--status-foreground);
  --shadow-sm: var(--elevation-sm);
  --shadow-md: var(--elevation-md);
  --shadow-lg: var(--elevation-lg);
  --ease-out: var(--ease-smooth);
}
```

</details>

## Sources

- [shadcn/ui theming](https://ui.shadcn.com/docs/theming) and [dark mode](https://ui.shadcn.com/docs/dark-mode)
- WCAG 2.2: [contrast minimum (1.4.3)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast (1.4.11)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), and [pause, stop, hide (2.2.2)](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Motion for React](https://motion.dev/docs/react)
- [Apple's guidance on hit targets](https://developer.apple.com/design/human-interface-guidelines/accessibility#Buttons-and-controls)
