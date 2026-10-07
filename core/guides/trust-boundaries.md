---
title: 'Trust boundaries: validation and authorization'
description: Where untrusted input enters your app, how to check its shape at the door, and how to make sure every user can only touch what's theirs.
domain: security
stage: design
freshness: durable
status: draft
reviewed: 2026-10-06
track: 6
concerns: [security, api-contracts, privacy]
---

A trust boundary is any line where data crosses from something you don't control into something you do. The browser, a webhook sender, an uploaded file, and a model's output are all on the far side of it. Your server is on the near side.

At every boundary, ask two questions. Is this shaped like what I expect? That's **validation**. Is this caller allowed to do this to _this_ thing? That's **authorization**. Most security bugs in small apps are one of those two questions left unasked.

## Everything from outside your server is a suggestion

Here's what crosses the boundary in a typical Next.js app:

- request bodies, form data, and server action arguments
- route params (`/invoices/[id]`) and query strings
- headers and cookies, including ones your own frontend set
- webhooks from Stripe, GitHub, or anyone else
- uploaded files, including their names and claimed content types
- responses from third-party APIs
- model output, which is text an attacker can influence through the prompt

The browser is the one people forget. You wrote the frontend, so it feels like yours. It isn't. Anyone can open devtools, edit the request, and send whatever they want. Your form's dropdown, disabled button, and hidden admin link are suggestions to well-behaved users. They do nothing against `curl`.

## The bug at the top of the list is the boring one

Say you built a small invoicing app. Invoices live at `/invoices/8f3a…`. The page loads the invoice by ID and checks that someone is logged in. A user changes the ID in the URL to one from an email a client forwarded, and now they're reading another company's invoice. If the IDs are sequential, they can just count upward and read all of them.

That's **broken object level authorization**, also called IDOR (insecure direct object reference). The OWASP API Security Top 10 ranks it first, ahead of broken authentication. It needs no clever exploit. The app checked "is anyone logged in?" when it needed to check "does this invoice belong to this person?"

## You need this on every server, from the first deploy

Validation and authorization belong on anything reachable over a network that holds data belonging to more than one person. That's every app with a login, plus anything that accepts webhooks or uploads.

The only places you can skip authorization are a static site with no user data, or a tool that runs on your own machine for you alone. You can't skip validation anywhere input arrives. A malformed payload can still crash a single-user app.

## Validate at the edge, with one schema

Parse input once, at the boundary, into a type the rest of your code can trust. With Zod, you write the schema once and use it on both sides:

```ts
// lib/schemas.ts, imported by the form and the server
export const updateInvoice = z.object({
  title: z.string().trim().min(1).max(200),
  amountCents: z.number().int().positive(),
  dueDate: z.coerce.date(),
});
```

On the client it gives instant error messages. On the server, `updateInvoice.safeParse(input)` is the actual control. If it fails, return a `400` with the field errors. If it passes, everything after that line works with typed, bounded data. By default `z.object` also strips keys you didn't declare, which matters for mass assignment below.

Treat model output the same way. If you ask a model for JSON, parse it with a schema before you act on it. More in [AI features in production](ai-features-in-production.md).

## Authentication says who, authorization says whether

**Authentication** establishes who's calling: a session cookie or a token, checked by your auth library. **Authorization** decides whether that person can do this action on this record. Better Auth and Clerk handle the first one. The second one is always your code, because only your code knows that invoices belong to organizations.

Two rules make authorization hard to forget.

**Take identity from the session, never from the request.** If the body says `{ userId: "abc" }`, ignore it. Read the user from the verified session on the server. The same goes for roles: a `role: "admin"` claim means nothing unless your server verified the token's signature. Decoding a JWT just reads it, and anyone can write one.

**Scope every query to the owner.** Don't load the record and then compare. Put the owner in the `WHERE` clause so the wrong user can't even fetch it:

```ts
const invoice = await db.query.invoices.findFirst({
  where: and(eq(invoices.id, id), eq(invoices.orgId, session.orgId)),
});
if (!invoice) notFound(); // same response for "doesn't exist" and "not yours"
```

Returning `404` for both cases means an attacker can't probe which IDs exist. Do this on every read, update, and delete, including list endpoints, exports, and file downloads.

Function-level checks matter too. An admin route needs a server-side role check in the handler itself. Hiding the link from non-admins only hides the link.

## Server actions are public endpoints

This one catches people because server actions look like function calls. They aren't. Next.js's own security guide says an exported server action is reachable by a direct POST request, not just through your UI. A page that redirects logged-out users doesn't protect the actions defined on it.

So every server action starts the same way: get the session, validate the input, check ownership, then act. I put that in a small data access layer (`requireUser()`, plus query helpers that always take the session) so an action can't skip it by accident.

## Mass assignment: the spread that grants admin

```ts
// The agent's version
await db
  .update(users)
  .set(await req.json())
  .where(eq(users.id, session.userId));
```

It looks fine. The form only sends `name` and `bio`. But anyone can add `"role": "admin"` or `"emailVerified": true` to the body, and the spread writes it. OWASP files this under broken object property level authorization. The fix is to name the fields you accept. A Zod schema with only `name` and `bio` does that, because unknown keys get stripped.

## Errors shouldn't explain your internals

When something fails, the user needs to know what to do next. They don't need your stack trace, SQL, table names, or the library version that threw. Those help an attacker map your system.

Return a plain message and a request ID. Send the full error, with context, to Sentry or your logs. For validation failures, field-level messages ("amount must be positive") are fine and helpful. They describe the contract, not the implementation. More on what to log in [knowing it broke](knowing-it-broke.md).

## What the vibe-coded version misses

- **`userId` from the request body.** The handler trusts whatever ID the client sent, so anyone can read or edit anyone's data by changing one field.
- **No ownership check.** The route checks that someone is logged in, then loads the record by ID. Every record in the table is one URL edit away.
- **Admin routes hidden only in the UI.** The menu item is gone for regular users, but the API route has no role check, so `curl` works fine.
- **Validation only on the client.** The form blocks a negative amount, and a direct request saves one anyway.
- **Trusting `role` from a JWT you didn't verify.** The code decodes the token and reads the claim. An attacker writes their own token with `role: "admin"`.
- **Server actions without an auth check.** The page is protected, the action isn't, and the action is a public POST endpoint.
- **Mass assignment.** The request body gets spread into an update, so a user promotes themselves by adding one key.
- **Stack traces in responses.** A `500` returns the error message from Postgres, including table and column names.

## What I'd do

For a Next.js app with Better Auth or Clerk and Drizzle:

- One Zod schema per input, shared by the form and the server. Every route handler and server action parses before doing anything.
- A `requireUser()` helper that reads the session server-side and throws if there isn't one. No handler reads identity from the request.
- Data access functions that take the session and put the owner or org in the `WHERE` clause. Pages and actions call those, not raw `db` queries.
- `404` for records the caller doesn't own.
- One test per resource where user B requests user A's record by ID and gets a `404`. It's the cheapest test you'll ever write against the most common bug.
- Webhooks verify the sender's signature before parsing anything. Details in [background jobs and webhooks](background-jobs-and-webhooks.md).

I'd add Postgres row-level security when the database is reachable from somewhere other than my server. On Supabase, if the browser talks to the database directly through the client SDK, RLS _is_ your authorization, so turn it on for every exposed table. I'd add a dedicated permissions model once roles stop fitting in a single `if`.

## What changes at scale

- **Row-level security as a second wall.** Even with app-level checks, RLS stops a forgotten `WHERE` clause from leaking another tenant's data.
- **Central policy.** Permission rules move into one module or a policy engine, so "who can edit an invoice" is answered in one place instead of 40 handlers.
- **Audit logs.** You record who read or changed sensitive records, so you can answer "did anyone else see this?"
- **Rate limits and abuse detection.** Enumeration attempts, like one account requesting thousands of IDs, get noticed and blocked.

## Sources

- [OWASP API Security Top 10, 2023 edition](https://api-security.owasp.org/editions/2023/en/0x11-t10/)
- [OWASP API1:2023 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP API3:2023 Broken Object Property Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [Next.js: How to think about data security](https://nextjs.org/docs/app/guides/data-security)
- [Zod: Objects](https://zod.dev/api#objects)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
