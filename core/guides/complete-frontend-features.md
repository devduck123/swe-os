---
title: What a complete frontend feature includes
description: Why "it matches the screenshot" isn't done, and the states, forms, layouts, and invisible details that separate a real UI from a demo.
domain: frontend
stage: build
freshness: durable
status: draft
track: 8
reviewed: 2026-10-06
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

A mockup is one frame of a movie: one state, perfect data, one screen size, a mouse. A complete feature handles every frame a real user can land on, like the slow network, the empty account, the error, the phone, and the keyboard.

This is where vibe-coded apps visibly fall apart. The backend can be sloppy for months before anyone notices. The frontend is sloppy in front of every user, on the first click.

## One dialog, five ways

Say you ask an agent for an "Invite teammate" dialog: an email field, a role picker, and a Send button. It looks great. Now watch five people use it.

1. **On a laptop with good wifi.** It works. This is the screenshot.
2. **On a train.** Send does nothing visible for three seconds, so they click again. Two invites go out.
3. **With an email that's already on the team.** A toast says "Something went wrong", the dialog closes, and their input is gone.
4. **On a phone.** The keyboard covers the Send button, and the dialog is wider than the screen.
5. **As a member, not an admin.** They fill out the whole form and get a raw `403`.

None of these is exotic. Every one shipped because the feature was judged by how it looked in one state.

## When you need all of this, and when you don't

You need it for anything another person uses. The first time someone sees your feature, it's probably empty, on a phone, and slower than your dev machine.

For a throwaway prototype you demo on your own laptop, skip most of it. Keep the loading and error states anyway. They're cheap, and without them you can't tell slow from broken.

## Every screen has more states than the mockup

- **Loading.** Something appears right away. A blank white area reads as broken.
- **Empty.** What every new user sees first. Say what goes here and offer the action that fills it: "No teammates yet. Invite one."
- **Error.** What happened and what to do next, in the user's words.
- **Partial.** One panel fails and the rest works. Give sections their own error and Suspense boundaries, so one bad query doesn't blank the whole dashboard.
- **No permission.** Hide or disable controls the user can't use, and say why. Then enforce it on the server anyway. The UI is a convenience, not a control. See [trust boundaries](trust-boundaries.md).
- **Offline or flaky.** Keep what the user typed and offer a retry.
- **Long content.** A 40-character name, an email with no spaces, a team of 300. Flex children won't shrink below their content by default, so one long email pushes everything off-screen. `min-w-0` plus `truncate` fixes it.

A cheap habit: render the component in all of its states side by side on one dev page. Gaps jump out.

## Forms are where users get hurt

**Validate twice, with one schema.** Client validation is for speed. Server validation is for truth, because anyone can skip your client and call the endpoint directly. Write the rules once in Zod and import them in both places.

```ts
// lib/schemas/invite.ts, imported by the form and the server action
export const inviteSchema = z.object({
  email: z.email('Enter a valid email address'),
  role: z.enum(['member', 'admin']),
});
```

**Show that it's working, and block the second click.** react-hook-form sets `formState.isSubmitting` while an async submit runs. Use it to disable the button and change its label to "Sending…". That stops most double submits. A unique constraint on the server stops the rest. [Timeouts, retries, and idempotency](timeouts-retries-idempotency.md) covers why you need both.

**Keep the input after an error, and put the error on its field.**

```tsx
async function onSubmit(values: InviteInput) {
  const result = await inviteTeammate(values); // re-parses with inviteSchema
  if (!result.ok) {
    // Dialog stays open, input stays put, error lands on the right field.
    form.setError(result.field ?? 'root', { message: result.message });
    return;
  }
  setOpen(false);
}
```

shadcn/ui's `Field` and `FieldError` components handle the layout. You still have to link the error text to its input so screen readers hear it. [Accessibility in practice](accessibility-in-practice.md#errors-and-updates-have-to-be-announced) shows how.

## Phones, zoom, and tables

Open the page at about 375px wide with real content, not lorem ipsum.

- **Touch targets.** WCAG 2.2 AA sets a floor of 24 by 24 CSS pixels. I aim for 44, which is what Apple's guidelines recommend for anything a thumb has to hit.
- **200% zoom.** Your layout gets half the width. Fixed heights clip text, and sticky headers eat the screen.
- **Hover doesn't exist on touch.** Anything that only appears on hover, like a row's delete button, is unreachable on a phone.
- **Tables.** Wrap a wide table in its own `overflow-x-auto` container so only the table scrolls, not the page. Or drop low-priority columns at narrow widths, or turn rows into stacked cards.
- **Dialogs.** Cap the height and let the body scroll, so the button stays reachable with the keyboard open.

## Reserve space so nothing jumps

Layout shift is when content moves after the page appears: you go to tap "Cancel" and an image loads above it, so you tap "Delete". Google measures this as Cumulative Layout Shift (CLS), and a good score is 0.1 or less.

The usual causes are images and embeds without dimensions, content injected after load, and web fonts swapping in. The fix for all of them is to reserve the space before the content arrives. `next/image` uses `width` and `height` to set the aspect ratio, so the browser holds the box while the image loads. It also lazy-loads and serves resized images. For the one big image at the top, use `loading="eager"` or `fetchPriority="high"`. Next.js 16 deprecated the old `priority` prop.

A 4 MB hero image is the classic miss: fine on your fiber, painful on a phone. See [performance and cost](performance-and-cost.md).

## Make it feel fast without lying

**Skeletons vs. spinners.** Use a skeleton when you know the shape of what's coming, like a list. The page feels further along, and nothing jumps when data arrives. For actions, use a pending label on the button. A full-page spinner hides even the parts that were ready.

**Optimistic updates.** Show the result before the server confirms it. React's `useOptimistic` does this, and it reverts on its own if the action throws. Use it when the action almost always succeeds and a revert costs little: a like, a checked todo, a reordered list. Skip it when the server often says no, when the next step depends on the result, or when money or an outgoing email is involved. If it fails, tell the user. A silent revert looks like the app ate their click.

## Feedback should explain what happened

Every action needs a visible result. A save that changes nothing on screen gets clicked again.

Put feedback where the user is looking. Errors about a field go next to the field. A toast is fine for "Invite sent", but toast-only errors disappear before people read them and are easy for screen reader users to miss.

Motion is feedback too: a row sliding out shows where the deleted item went. Keep it short, and respect `prefers-reduced-motion`. Some people get dizzy or nauseous from large movement and have told their OS so. In Tailwind, put animations behind the `motion-safe:` variant.

## Keyboards and screen readers are users too

Native buttons and links, a label on every input, visible focus, and focus that moves into a dialog and back out. shadcn/ui handles much of this. The 30-second test: invite a teammate using only Tab, Enter, and Escape. [Accessibility in practice](accessibility-in-practice.md) has the rest.

## The invisible parts

Nobody puts these in a mockup, and everyone notices when they're missing:

- **Page titles.** A unique `<title>` per page, set with Next.js `metadata` or `generateMetadata`. It's the tab, the bookmark, and what a screen reader announces on navigation.
- **Meta and Open Graph tags.** A description, and an `opengraph-image` file in the route. Without it, your link shows up in iMessage and Slack as a bare URL.
- **A 404 page and error boundaries.** `not-found.tsx` and `error.tsx` per route segment, so a bad URL or a thrown error shows a way back instead of a framework default.
- **Dark mode that works.** Hard-coded colors like `text-gray-900` turn into dark text on a dark background. Use theme tokens (`text-foreground`, `bg-background`) and check contrast in both themes.

## What the vibe-coded version misses

- **A blank screen while loading.** Users assume it's broken and refresh.
- **An empty state that's just nothing.** New users don't know what the feature is for.
- **"Something went wrong" with no next step.** Users can't fix it, so they leave.
- **A submit button that fires twice.** Duplicate invites, duplicate orders, duplicate charges.
- **Input wiped on error.** The user retypes a long form, or gives up.
- **Controls shown to people who can't use them.** They fill out the whole form and hit a `403` at the end.
- **Horizontal scrolling on phones.** One long email or wide table breaks the whole page.
- **Unsized images and no OG image.** The page jumps under people's thumbs, and shared links look broken.

## What I'd do

shadcn/ui on Tailwind, react-hook-form plus Zod, and one schema shared by the form and the server action. Before every PR, I'd check each state (loading, empty, error, no permission, long content) and use the rendered page at phone and desktop widths with a keyboard. An agent can do most of that with Playwright and screenshots. I'd still look at the screenshots.

I'd add Playwright tests for the error and permission paths once a flow matters to revenue or trust, and Storybook once components are shared across many screens.

## What changes at scale

- **A design system.** Shared tokens and components, so states are designed once instead of per feature.
- **Visual regression tests.** Screenshots compared on every PR, so a CSS change can't quietly break forty screens.
- **Real-user monitoring.** CLS and other Core Web Vitals from real devices, not just your laptop.

## Sources

- [web.dev: Web Vitals](https://web.dev/articles/vitals) and [Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [W3C: Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Apple: UI design dos and don'ts](https://developer.apple.com/design/tips/)
- [Next.js: Image component](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js: opengraph-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [React: useOptimistic](https://react.dev/reference/react/useOptimistic)
- [shadcn/ui: React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form)
