---
title: Design system
description: My design taste as rules and tokens. Every project with a UI starts from these colors for light and dark, type, spacing, radius, shadows, and motion, unless it has its own.
freshness: durable
---

I don't design much by hand anymore. Agents go straight to code, and that's fine as long as the result has taste. Taste an agent can follow has to be written down as rules and values, so here they are. A project with its own design system keeps it. Everything else starts here.

The values come from my [portfolio](https://www.ducktommy.com/) and [OpenPacks](https://backpacks-app.vercel.app/), with a few colors darkened so text passes contrast.

## What I'm going for

- **Quiet surfaces, one focal point.** Each screen has one thing that's obviously most important. Everything else steps back.
- **Color means something.** Tinted neutrals carry the page. One primary color marks the main action. Red, green, amber, and blue appear only to say error, success, warning, or info.
- **Never pure black or white.** Light mode is warm paper. Dark mode is deep slate with warm off-white text. A little tint keeps both from feeling sterile.
- **Type makes the hierarchy, not boxes.** Size, weight, and tight tracking on big headings do the work before borders and cards do.
- **Dark mode is designed, not inverted.** Surfaces get lighter as they rise. Borders do more of the work than shadows.
- **Motion is small and has a reason.** It shows that something changed or where it went. Only one focal visual per page gets to move slowly.
- **Product screens stay minimal. Personal and landing pages get more character.** Product screens look like OpenPacks: neutral, but not bland. My portfolio and this site's landing page show the other end: a big editorial serif, small uppercase labels, a soft glow, and room to breathe.

Default framework styling shipped as-is isn't a design. Neither is decoration that fights the content.

## Start from these tokens

They use [shadcn/ui's](https://ui.shadcn.com/docs/theming) token names, so every shadcn component picks them up. Put them in the global CSS file (`app/globals.css`) in place of the defaults `shadcn init` writes.

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

Notice what the numbers do. Every neutral shares one hue (260, a cool slate) or the paper's warm 90, so nothing clashes. Lightness is the only thing that changes between surfaces.

- **Status colors are text-safe.** Each passes 4.5:1 as text on the background, on `muted`, and on its own 10% tint. So an error reads as `bg-destructive/10 text-destructive`, and a solid badge as `bg-success text-status-foreground`.
- **`--input` is darker than `--border` on purpose.** A form field's edge needs 3:1 contrast so people can find it. A card's border is decoration and can stay faint.
- **To brand a product,** change `--primary` and `--ring` to the brand's hue at the same lightness, and check contrast again. Keep the neutrals.

## Type

- **Product screens:** one sans. The system stack (`ui-sans-serif, system-ui`) is fine, or one webfont loaded with `next/font`. Two weights carry most screens: 400 and 600.
- **Personal and landing pages:** add an editorial serif for big display text only.
- **Scale:** Tailwind's steps. Body is 16px (`text-base`) at line height 1.5. Secondary text is 14px (`text-sm`). Nothing smaller than 12px.
- **Headings** tighten as they grow: `tracking-tight` from 24px up. Reading text stays under about 70 characters a line (`max-w-prose`).
- **Labels:** 12px, uppercase, medium weight, a little tracking (`text-xs uppercase font-medium tracking-wide text-muted-foreground`). Use them sparingly.

## Space, shape, and depth

- **Spacing:** Tailwind's 4px steps, mostly 2, 3, 4, 6, 8, 12, and 16 (8px to 64px). Related things sit closer than unrelated things. When in doubt, add space before adding a border.
- **Phones:** a 16px side gutter (`px-4`), and touch targets at least 44px tall for primary actions.
- **Radius:** `--radius` is 8px. shadcn derives the rest from it, so buttons and inputs come out a little rounder than sharp and cards a little more. Full pills are only for tags and avatars.
- **Depth:** in light mode, the three soft shadows above, and only on things that float (menus, dialogs, a hovered card). In dark mode, a lighter surface (`card`, `popover`) shows height better than a shadow.

## Motion

- **150ms** for hover and press, **200 to 250ms** for menus, dialogs, and toasts, always with the `ease-out` class, which these tokens point at the smooth curve. Things enter faster than you'd think, and leave faster still.
- **Slow motion** (half a second or more) only for one focal visual, like a hero glow.
- **Animate opacity and transform only.** They don't make the page recompute its layout.
- **Respect reduced motion.** Under `prefers-reduced-motion: reduce`, keep the fades and drop the movement.

## Icons

[Lucide](https://lucide.dev/), at 16px inline with text and 20px in buttons, in `currentColor`, so they follow the text color in both themes.

## How agents use this

- **New project with a UI:** set these tokens up during [start-project](../skills/start-project/SKILL.md), with dark mode following the system setting by default and a toggle to override it.
- **In features:** use the tokens only. No hex values or palette classes like `bg-blue-500` in components. If a color is missing, add a token with a light and a dark value, and check its contrast.
- **Check every screen in both themes,** at phone and desktop widths.
- **An existing project's design system wins.** Match it, and only suggest moving toward this one.

## Sources

- [shadcn/ui theming](https://ui.shadcn.com/docs/theming) and [dark mode](https://ui.shadcn.com/docs/dark-mode)
- [WCAG 2.2: contrast minimum (1.4.3)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast (1.4.11)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [Apple's guidance on hit targets](https://developer.apple.com/design/human-interface-guidelines/accessibility#Buttons-and-controls)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Lucide](https://lucide.dev/)
