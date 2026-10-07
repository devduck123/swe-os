---
title: 'Trust boundaries: validation and authorization'
description: Where untrusted input enters your app, how to check its shape at the door, and how to make sure every user can only touch what's theirs.
domain: security
stage: design
freshness: durable
status: reviewed
reviewed: 2026-10-06
track: 6
concerns: [security, api-contracts, privacy]
---

A trust boundary is any line where data crosses from something you don't control into something you do. At every one, ask two questions. Is this shaped like what I expect? That's **validation**. Is this caller allowed to do this to _this_ thing? That's **authorization**. Most security bugs in small apps are one of those two questions left unasked.

## Everything from outside your server is a suggestion

Request bodies, action arguments, route params, headers, cookies, webhooks, uploads, third-party responses, and model output all cross the boundary.

The browser is the one people forget. You wrote the frontend, so it feels like yours. It isn't. Anyone can open devtools, edit the request, and send whatever they want. Your dropdown, disabled button, and hidden admin link are suggestions to well-behaved users. They do nothing against `curl`.

## The bug at the top of the list is the boring one

Say you built a small invoicing app. Invoices live at `/invoices/8f3a…`. The page loads the invoice by ID and checks that someone is logged in. A user pastes in an ID from an email a client forwarded, and now they're reading another company's invoice.

That's **broken object level authorization**, also called IDOR. The OWASP API Security Top 10 ranks it first. It needs no clever exploit. The app checked "is anyone logged in?" when it needed "does this invoice belong to this person?"

## Validate at the edge, with one schema

Parse input once, at the boundary, into a type the rest of your code can trust. One Zod schema serves the form and the server:

```ts
// lib/schemas.ts, imported by the form and the server
export const updateInvoice = z.object({
  title: z.string().trim().min(1).max(200),
  amountCents: z.coerce.number().int().positive(), // FormData values are strings
  dueDate: z.coerce.date(),
});
```

On the server, `updateInvoice.safeParse(input)` is the actual control. If it fails, a server action returns an error object with the field errors for the form to show, and a route handler returns a `400`. `z.number()` would fail every form submit, because FormData only holds strings, so coerce. By default `z.object` also strips keys you didn't declare, which matters for mass assignment below.

Treat model output the same way: parse it with a schema before you act on it ([AI features in production](ai-features-in-production.md)).

## Take identity from the session, and scope every query to it

Your auth library (Better Auth or Clerk) says who's calling. Whether they can touch this record is always your code, because only your code knows invoices belong to organizations.

**Never read identity from the request.** If the body says `{ userId: "abc" }`, ignore it and read the user from the verified session. A `role: "admin"` claim means nothing unless your server verified the token's signature.

**Put the owner in the `WHERE` clause**, so the wrong user can't even fetch the row:

```ts
const invoice = await db.query.invoices.findFirst({
  where: and(eq(invoices.id, id), eq(invoices.orgId, session.orgId)),
});
if (!invoice) notFound(); // same response for "doesn't exist" and "not yours"
```

Do this on every read, update, and delete, including exports and file downloads. An admin route needs a role check in the handler. Hiding the link only hides the link.

## Check auth where the data is, not only in `proxy.ts`

Server actions look like function calls. They're public endpoints. Next.js's data security guide says an exported action is reachable by a direct POST, and a page-level check doesn't extend to the actions defined on it.

Agents love one check in `proxy.ts` (middleware before Next.js 16) that guards a list of routes. In March 2025, CVE-2025-29927 let anyone skip middleware entirely by sending one internal header, `x-middleware-subrequest`. It hit self-hosted apps (`next start` and standalone output) from 11.1.4 until the fixes in 12.3.5, 13.5.9, 14.2.25, and 15.2.3. Apps on Vercel and Netlify weren't affected. Next.js's advice since: don't make middleware the only protection. Check auth in each action, or in a data access layer every action goes through.

## Send the client only what it shows

Props passed to a client component get serialized into the page. Pass the whole user row to `<Profile user={user} />` and every column, from email to internal flags to Stripe IDs, is in the page source. A server action's return value works the same way, so returning the updated record sends all of it.

Next.js's guide calls the fix a data transfer object: the data access layer returns `{ name, avatarUrl }`, not the row.

## Mass assignment: the spread that grants admin

```ts
await db
  .update(users)
  .set(await req.json()) // the form only sends name and bio
  .where(eq(users.id, session.userId));
```

Anyone can add `"role": "admin"` to the body, and the spread writes it. Name the fields you accept. A Zod schema with only `name` and `bio` does that, because unknown keys get stripped.

## Rate-limit what an attacker can repeat

Tiny apps get credential-stuffed too. From day one, limit login, signup, password reset, OTP and email sends, and every AI route. Limit by IP and by account, because a stuffing bot rotates IPs and an email bomber targets one inbox.

Better Auth has a limiter, on by default in production, with tighter rules for sign-in. But it keeps counts in memory by default, and its docs warn that this may not suit serverless: each function instance keeps its own count. Set `rateLimit.storage` to `"database"`. Your own routes, like email sends and AI calls, need your own counter, and a row in Postgres is enough. [AI features in production](ai-features-in-production.md) shows one.

## On Supabase, RLS is your authorization

If the browser talks to Supabase directly, there's no server in between to check anything. Row-level security (RLS) is the check. On most projects, a table in an exposed schema without RLS is readable and writable through the publishable key, and that key ships in your JavaScript.

That's CVE-2025-48757. A researcher scanned 1,645 apps built with Lovable and found 170 whose Supabase tables had missing or inadequate RLS, exposing emails, payment details, and API keys. Turn RLS on for every exposed table, write the policies, and test them as a second user. Which Supabase keys are safe to ship is in [secrets and agent safety](secrets-and-agent-safety.md).

## What the vibe-coded version misses

- **No ownership check.** The route checks that someone is logged in, then loads by ID. Every record in the table is one URL edit away.
- **Auth only in `proxy.ts`.** One bypass, or one route the matcher forgot, and every action behind it is open.
- **Whole rows passed to the client.** Every column of every user on the page ends up in the page source.
- **No rate limit on password reset.** A bot sends 10,000 reset emails, and your email provider's quota and reputation go with them.
- **Supabase tables without RLS.** Anyone with your publishable key, which is everyone, can read every row.
- **Mass assignment.** A user promotes themselves to admin by adding one key to a request.

## What I'd do

For Next.js with Better Auth or Clerk and Drizzle:

- One Zod schema per input, parsed first thing in every action and route handler.
- A data access layer: `requireUser()`, query helpers that put the owner in the `WHERE` clause, and return values trimmed to what the UI shows.
- `404` for records the caller doesn't own, and plain error messages, with details going to Sentry.
- Rate limits on auth, email, and AI routes, counted in Postgres.
- One test per resource where user B requests user A's record by ID and gets a `404`. It's the cheapest test you'll ever write against the most common bug.

I'd add Postgres RLS as a second wall when a forgotten `WHERE` would leak another company's data, and a real permissions model once roles stop fitting in one `if`.

## Sources

- [OWASP API Security Top 10, 2023 edition](https://api-security.owasp.org/editions/2023/en/0x11-t10/)
- [OWASP API1:2023 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP API3:2023 Broken Object Property Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [Next.js: How to think about data security](https://nextjs.org/docs/app/guides/data-security)
- [Next.js advisory GHSA-f82v-jwr5-mffw (CVE-2025-29927)](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw) and [Vercel's postmortem](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass)
- [Better Auth: Rate limit](https://www.better-auth.com/docs/concepts/rate-limit)
- [Matt Palmer: Statement on CVE-2025-48757](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Zod: Objects](https://zod.dev/api#objects)
