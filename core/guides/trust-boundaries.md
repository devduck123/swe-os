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

The browser is the one people forget. You wrote the frontend, so it feels like yours. It isn't. Anyone can edit the request in devtools and send whatever they want. Your disabled button and hidden admin link do nothing against `curl`.

## The bug at the top of the list is the boring one

Say you built a small invoicing app. Invoices live at `/invoices/8f3a…`. The page loads the invoice by ID and checks that someone is logged in. A user pastes in an ID from an email a client forwarded, and now they're reading another company's invoice.

That's **broken object level authorization**, also called IDOR (insecure direct object reference: the ID in the URL is the only thing standing guard). OWASP's API Security Top 10, the standard list of API risks, ranks it first. The app checked "is anyone logged in?" when it needed "does this invoice belong to this person?"

## Validate at the edge, with one schema

Parse input once, at the boundary, into a type the rest of your code can trust. One Zod schema serves the form and the server. Notice `z.coerce`: FormData values are always strings, so a plain `z.number()` would fail every submit.

```ts
// lib/schemas.ts, imported by the form and the server
export const updateInvoice = z.object({
  title: z.string().trim().min(1).max(200),
  amountCents: z.coerce.number().int().positive(),
  dueDate: z.coerce.date(),
});
```

On the server, `updateInvoice.safeParse(input)` is the actual control. If it fails, a server action returns the field errors for the form to show, and a route handler returns a `400`. By default `z.object` also drops keys you didn't declare, which matters for mass assignment below.

Treat model output the same way: parse it with a schema before you act on it ([AI features in production](ai-features-in-production.md)).

## Take identity from the session, and scope every query to it

Your auth library (Better Auth, Clerk, or Supabase Auth) says who's calling. Whether they can touch this record is always your code, because only your code knows invoices belong to organizations.

**Never read identity from the request.** If the body says `{ userId: "abc" }` or `role: "admin"`, ignore it. Read the user from the session your auth library verified, and their role from your database.

**Put the owner in the `WHERE` clause**, so the wrong user can't even fetch the row:

```ts
const invoice = await db.query.invoices.findFirst({
  where: and(eq(invoices.id, id), eq(invoices.orgId, session.orgId)),
});
if (!invoice) notFound(); // same response for "doesn't exist" and "not yours"
```

Do this on every read, update, and delete, including exports and downloads. An admin route needs a role check in the handler. Hiding the link only hides the link.

## Check auth where the data is, not only in `proxy.ts`

Server actions look like function calls, but they're public endpoints. Next.js's data security guide says anyone can POST to an exported action directly, and a check on the page doesn't cover its actions.

Agents love one check in `proxy.ts` (formerly middleware), which runs before every matching route. In 2025, a Next.js bug let anyone skip it on self-hosted apps with one header. Next.js's advice since: don't make it the only protection. Check auth in each action, or in a data access layer (one set of query functions every action goes through).

## Send the client only what it shows

Props passed to a client component get written into the page. Pass the whole user row to `<Profile user={user} />` and every column, from email to Stripe IDs, is in the page source. A server action's return value works the same way.

The fix: your query functions return `{ name, avatarUrl }`, not the row.

## Mass assignment: the spread that grants admin

Notice that the whole request body goes straight into `.set()`:

```ts
await db
  .update(users)
  .set(await req.json()) // the form only sends name and bio
  .where(eq(users.id, session.userId));
```

Anyone can add `"role": "admin"` to the body, and `.set()` writes it. Name the fields you accept. A Zod schema with only `name` and `bio` does that, because unknown keys get stripped.

## Rate-limit what an attacker can repeat

Tiny apps get hit by bots trying leaked passwords from other sites too. From day one, limit login, signup, password reset, one-time code and email sends, and every AI route. Limit by IP and by account, because a password bot rotates IPs and an email bomber targets one inbox.

Better Auth and Supabase Auth limit their own endpoints. On Supabase, tune them under **Authentication → Rate Limits**. Your own routes, like email sends and AI calls, need your own counter, and a row in Postgres is enough. [AI features in production](ai-features-in-production.md) shows one.

<details>
<summary>Going deeper: Better Auth's limiter on serverless</summary>

Better Auth's limiter keeps counts in memory by default, and its docs warn this may not suit serverless: each function instance keeps its own count. Set `rateLimit.storage` to `"database"`.

</details>

## On Supabase, RLS is your authorization

If the browser talks to Supabase directly, there's no server in between to check anything. Row-level security (RLS) is the check: rules in the database, called policies, that decide which rows each user can read or write. A table in an exposed schema (one Supabase's API serves, like `public`) without RLS is readable and writable through the publishable key, and that key ships in your JavaScript. In 2025, a researcher found 170 of 1,645 Lovable-built apps with missing or weak RLS, exposing emails, payment details, and API keys.

Here's the invoice check as a policy. Notice that `auth.uid()`, the signed-in user from their verified session, must be a member of the invoice's organization.

```sql
alter table invoices enable row level security;

create policy "Members can read their org's invoices"
on invoices for select
to authenticated
using (
  exists (
    select 1 from org_members m
    where m.org_id = invoices.org_id
      and m.user_id = (select auth.uid()) -- (select …) runs it once per query
  )
);
```

With RLS on and no policies, the API returns nothing, so add one policy per operation. Update policies also need `with check`, which tests the row after the change. `org_members` needs a policy that lets users read their own rows. Which Supabase keys are safe to ship is in [secrets and agent safety](secrets-and-agent-safety.md).

## What the vibe-coded version misses

- **No ownership check:** every record in the table is one URL edit away.
- **Auth only in `proxy.ts`:** one route left off its list, and every action behind it is open.
- **Whole rows passed to the client:** every column ends up in the page source.
- **No rate limit on password reset:** a bot sends 10,000 reset emails, and your email quota goes with them.
- **Supabase tables without RLS:** anyone with your publishable key, which is everyone, can read every row.

## What I'd do

For Next.js with Better Auth or Clerk and Drizzle:

- Ask your agent: "Parse every action's and route handler's input with a Zod schema before using it."
- A data access layer: `requireUser()`, query helpers that put the owner in the `WHERE` clause, and return values trimmed to what the UI shows.
- `404` for records the caller doesn't own, with error details going to your logs, not the user.
- Rate limits on auth, email, and AI routes, counted in Postgres.
- Ask your agent: "For each resource, write a test where user B requests user A's record by ID and gets a `404`." It's the cheapest test you'll ever write against the most common bug.

On Supabase, the dashboard's Security Advisor flags every table in `public` without RLS. Turn it on for each, add policies like the one above, and run the same user-B test.

I'd add Postgres RLS as a second wall when a forgotten `WHERE` would leak another company's data, and a real permissions model once roles stop fitting in one `if`.

## Sources

- [OWASP API Security Top 10, 2023 edition](https://api-security.owasp.org/editions/2023/en/0x11-t10/)
- [OWASP API1:2023 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP API3:2023 Broken Object Property Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [Next.js: How to think about data security](https://nextjs.org/docs/app/guides/data-security)
- [Next.js advisory GHSA-f82v-jwr5-mffw (CVE-2025-29927)](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw) and [Vercel's postmortem](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass), for the self-hosted bypass and affected versions
- [Better Auth: Rate limit](https://www.better-auth.com/docs/concepts/rate-limit)
- [Supabase Auth: Rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Matt Palmer: Statement on CVE-2025-48757](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), for `auth.uid()`, `using` and `with check`, and membership checks through another table
- [Supabase: Database advisors](https://supabase.com/docs/guides/database/database-advisors), for the RLS-disabled check
- [Zod: Objects](https://zod.dev/api#objects)
