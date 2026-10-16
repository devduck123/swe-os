---
title: What a complete frontend feature includes
description: Why "it matches the screenshot" isn't done, and the states, forms, layouts, and invisible details that separate a real UI from a demo.
domain: frontend
stage: build
freshness: durable
status: reviewed
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
- **Partial.** Give each section its own loading and error fallback (React's `<Suspense>` and an error boundary), so one bad query doesn't blank the page.
- **No permission.** Hide or disable controls the user can't use, and say why in visible text. A disabled button can't take focus and phones have no hover, so a tooltip on it never shows. Then enforce it on the server anyway, as [trust boundaries](trust-boundaries.md) explains.
- **Long content.** One long email with no spaces pushes everything off-screen. `min-w-0` plus `truncate` fixes it.
- **Lots of content.** A team of 300 isn't a longer list. It needs pagination or search.

## Forms are where users get hurt

**Validate twice, with one schema.** Client validation is for speed. Server validation is for truth, because anyone can call the endpoint directly. Write the rules once in Zod and import them in both places.

**Tell the phone what you're asking for.** `type="email"` brings up the keyboard with `@`, and `inputMode="numeric"` the number pad. `autocomplete="email"` (or `tel`, `one-time-code`, `new-password`) lets the browser fill it in one tap. It's the cheapest mobile win there is.

**Disable Submit only while submitting.** A button that stays grey until the form is valid gives no hint what's wrong. Let them click, then show errors on the fields. While the request runs, disable it with react-hook-form's `formState.isSubmitting` and show "Sending…". The server still has to stop double submits ([timeouts, retries, and idempotency](timeouts-retries-idempotency.md)).

**Keep the input after an error, and put the error on its field.** Notice the early `return`: on failure, the dialog stays open.

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

The server formats dates in its own time zone, not the user's, and on Vercel you can't change it. So `toLocaleString()` on the server shows most users a time that's hours off. In a client component it's worse: the server's HTML says 3 PM, the browser renders 6 PM, and React throws a hydration error (the browser's first render didn't match the server's HTML). Store `timestamptz` (Postgres's time-zone-aware type), then format with the user's saved time zone (`Intl.DateTimeFormat` with `timeZone`), or format only in the browser after mount.

## Reserve space so nothing jumps

You go to tap "Cancel", an image loads above it, and you tap "Delete". Reserve the space before the content arrives: `next/image` uses `width` and `height` to hold the box. More in [performance and cost](performance-and-cost.md).

## Make it feel fast without lying

Use a skeleton that holds the shape of what's loading. A full-page spinner hides even the parts that were ready.

**Optimistic updates.** React's `useOptimistic` shows the result before the server confirms it, and reverts if the action throws. Use it for a like or a checked todo, not for money or an outgoing email. If it fails, tell the user. A silent revert looks like the app ate their click.

**Put feedback where the user is looking.** A save that changes nothing on screen gets clicked again. A toast-only error disappears before people read it.

## The invisible parts

- **A link preview.** Add a description and an `opengraph-image` file to the route. Without them, your link shows up in iMessage and Slack as a bare URL.
- **A 404 and an error page.** `not-found.tsx` and `error.tsx`, so a bad URL shows a way back instead of a framework default.
- **Theme colors, not fixed ones.** `text-foreground` flips with dark mode. `text-gray-900` stays dark on a dark background.

## What the vibe-coded version misses

- **A submit button that fires twice.** Two invites, two charges, and a support email for each.
- **Input wiped on error.** The user retypes a long form, or gives up.
- **Submit disabled until valid.** Nobody can tell which field is wrong, so they leave.
- **Filters kept in component state.** Refresh resets them, and shared links open the wrong view.
- **Server-formatted times.** Everyone outside the server's time zone sees the wrong time.

## What I'd do

- **The stack:** shadcn/ui on Tailwind, react-hook-form plus Zod, and one schema shared by the form and the server action.
- **Before every PR,** ask your agent: "Use Playwright to screenshot this feature's loading, empty, error, and no-permission states at 375px and desktop width." Then look at them yourself, and try the flow with only a keyboard.
- **For a throwaway prototype,** skip most of this but keep loading and error states. Without them you can't tell slow from broken.

I'd add Playwright tests for the error and permission paths once a flow matters to revenue or trust.

## Sources

- [web.dev: Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [MDN: `inputmode`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode) and [HTML `autocomplete`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)
- [Next.js: Hydration errors](https://nextjs.org/docs/messages/react-hydration-error) and [Vercel: Reserved environment variables (`TZ`)](https://vercel.com/docs/environment-variables/reserved-environment-variables)
- [Next.js: Image component](https://nextjs.org/docs/app/api-reference/components/image) and [opengraph-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [React: useOptimistic](https://react.dev/reference/react/useOptimistic)
- [shadcn/ui: React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form)
