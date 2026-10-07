---
title: What a complete frontend feature includes
description: Why "it matches the screenshot" isn't done, and the states, forms, layouts, and invisible details that separate a real UI from a demo.
domain: frontend
stage: build
freshness: durable
status: draft
track: 9
reviewed: 2026-10-06
concerns: [product-ux, accessibility, ui-quality, performance]
---

A mockup is one frame of a movie: one state, perfect data, one screen size, a mouse. A complete feature handles every frame a real user can land on: the slow network, the empty account, the error, the phone. The backend can be sloppy for months before anyone notices. The frontend is sloppy in front of every user, on the first click.

## One dialog, five ways

You ask an agent for an "Invite teammate" dialog: an email field, a role picker, and Send. It looks great. Now watch five people use it.

1. **On a laptop with good wifi.** It works. This is the screenshot.
2. **On a train.** Send does nothing visible for three seconds, so they click again. Two invites go out.
3. **With an email that's already on the team.** A toast says "Something went wrong", the dialog closes, and their input is gone.
4. **On a phone.** The keyboard has no `@` key, and when it slides up it covers the Send button.
5. **As a member, not an admin.** They fill out the whole form and get a raw `403`.

Every one shipped because the feature was judged by how it looked in one state.

## Every screen has more states than the mockup

- **Loading.** Something appears right away. A blank white area reads as broken.
- **Empty.** What every new user sees first. Offer the action that fills it: "No teammates yet. Invite one."
- **Error.** What happened and what to do next, in the user's words.
- **Partial.** Give sections their own error and Suspense boundaries, so one bad query doesn't blank the whole dashboard.
- **No permission.** Hide or disable controls the user can't use, and say why in visible text. A disabled button can't take keyboard focus and phones have no hover, so a tooltip explaining it never shows. Then enforce it on the server anyway. The UI is a convenience, not a control. See [trust boundaries](trust-boundaries.md).
- **Long content.** Flex children won't shrink below their content, so one long email with no spaces pushes everything off-screen. `min-w-0` plus `truncate` fixes it.
- **Lots of content.** A team of 300 isn't a longer list. It needs pagination or search.

## Forms are where users get hurt

**Validate twice, with one schema.** Client validation is for speed. Server validation is for truth, because anyone can call the endpoint directly. Write the rules once in Zod and import them in both places.

**Tell the phone what you're asking for.** `type="email"` and `inputMode` pick the right keyboard. `autocomplete="email"` (or `tel`, `one-time-code`, `new-password`) lets the browser fill it in one tap. It's the cheapest mobile win there is.

**Disable Submit only while submitting.** A button that stays grey until the form is valid gives no hint what's wrong. Let them click, then show errors on the fields. While the request runs, use react-hook-form's `formState.isSubmitting` to disable it and show "Sending…". That stops most double submits, and a unique constraint on the server stops the rest. See [timeouts, retries, and idempotency](timeouts-retries-idempotency.md).

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

The same dialog also has to work with only Tab, Enter, and Escape, with each error read aloud on its field. [Accessibility in practice](accessibility-in-practice.md#errors-and-updates-have-to-be-announced) shows how.

## Phones and tables

Open the page at about 375px wide with real content.

- **Hover doesn't exist on touch.** A delete button that only appears on hover is unreachable on a phone.
- **Tables.** Wrap a wide table in its own `overflow-x-auto` container so only the table scrolls, or turn rows into stacked cards.
- **Dialogs.** Cap the height and let the body scroll, so Send stays reachable with the keyboard open.

## Put view state in the URL

Filters, tabs, search, and the page number belong in the query string (`?status=open&page=3`), not in `useState`. Then refresh keeps the view, Back works, and a pasted link shows the same thing.

## Show times where the user is

The server formats dates in its own time zone, not the user's, and on Vercel you can't change it (`TZ` is a reserved variable). In a server component, `toLocaleString()` shows most users a time that's hours off. In a client component, the browser formats it again in local time, React sees different text, and you get a hydration error too. Store `timestamptz` (Postgres's time-zone-aware type), then format with the user's saved time zone (`Intl.DateTimeFormat` with `timeZone`), or format only in the browser after mount.

## Reserve space so nothing jumps

You go to tap "Cancel", an image loads above it, and you tap "Delete". Google calls this Cumulative Layout Shift (CLS), and a good score is 0.1 or less. Reserve the space before the content arrives: `next/image` uses `width` and `height` to hold the box. For the one big image at the top, use `fetchPriority="high"`, since Next.js 16 deprecated `priority`. More in [performance and cost](performance-and-cost.md).

## Make it feel fast without lying

Use a skeleton that holds the shape of what's loading. A full-page spinner hides even the parts that were ready.

**Optimistic updates.** React's `useOptimistic` shows the result before the server confirms it, and reverts if the action throws. Use it for a like or a checked todo, not for money or an outgoing email. If it fails, tell the user. A silent revert looks like the app ate their click.

**Put feedback where the user is looking.** A save that changes nothing on screen gets clicked again. A toast is fine for "Invite sent", but a toast-only error disappears before people read it.

## The invisible parts

- **Open Graph tags.** A description, and an `opengraph-image` file in the route. Without it, your link shows up in iMessage and Slack as a bare URL.
- **A 404 page and error boundaries.** `not-found.tsx` and `error.tsx` per route segment, so a bad URL shows a way back instead of a framework default.
- **Colors from theme tokens** (`text-foreground`, not `text-gray-900`), so dark mode doesn't turn into dark text on a dark background.

## What the vibe-coded version misses

- **A submit button that fires twice.** Two invites, two orders, two charges, and a support email for each.
- **Input wiped on error.** The user retypes a long form, or gives up and you never hear why.
- **A Submit that stays disabled until valid.** The user can't tell which field is wrong, so the form looks broken and they leave.
- **Filters kept in component state.** Refresh resets them, and the link someone shares opens the wrong view.
- **Server-formatted times.** Every user outside the server's time zone sees the wrong time, and the hydration error hides other bugs in the console noise.

## What I'd do

shadcn/ui on Tailwind, react-hook-form plus Zod, and one schema shared by the form and the server action. Before every PR, I'd check each state and use the page at phone and desktop widths with a keyboard. An agent can grab the screenshots with Playwright. I'd still look at them. For a throwaway prototype I'd skip most of this, but keep loading and error states, because without them I can't tell slow from broken.

I'd add Playwright tests for the error and permission paths once a flow matters to revenue or trust.

## Sources

- [web.dev: Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [MDN: `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode) and [HTML `autocomplete`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
- [Next.js: Hydration errors](https://nextjs.org/docs/messages/react-hydration-error) and [Vercel: Reserved environment variables (`TZ`)](https://vercel.com/docs/environment-variables/reserved-environment-variables)
- [Next.js: Image component](https://nextjs.org/docs/app/api-reference/components/image) and [opengraph-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [React: useOptimistic](https://react.dev/reference/react/useOptimistic)
- [shadcn/ui: React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form)
