---
title: My palette
description: My portfolio's colors as shadcn/ui theme tokens, checked for contrast in both themes. Use it only when a product wants this feel.
freshness: durable
---

This is one palette I like, not a default. Use it when a product wants this feel, and pick the product's own colors otherwise (see [Design taste](design.md#start-from-what-the-product-is)).

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
