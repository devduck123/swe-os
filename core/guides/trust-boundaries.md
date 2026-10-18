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

Parse input once, at the boundary, into a type the rest of your code can trust. One Zod schema (a description of the shape you expect, checked when the code runs) serves the form and the server. Notice `z.coerce`: FormData values are always strings, so a plain `z.number()` would fail every submit.

```ts
// lib/schemas.ts, imported by the form and the server
export const updateInvoice = z.object({
  title: z.string().trim().min(1).max(200),
  amountCents: z.coerce.number().int().positive(),
  dueDate: z.coerce.date(),
});
```

On the server, `updateInvoice.safeParse(input)` is the actual control. If it fails, a server action returns the field errors for the form to show, and a route handler returns a `400` (bad request).

## Take identity from the session, and scope every query to it

Your auth library says who's calling. Whether they can touch this record is your code's job, because only your code knows invoices belong to organizations.

**Never read identity from the request.** If the body says `{ userId: "abc" }` or `role: "admin"`, ignore it. Read the user from the session your auth library verified, and their role from your database.

**Put the owner in the `where` clause**, so the wrong user can't even fetch the row. Notice `org_id` comes from the session:

```ts
const [invoice] = await sql`
  select * from invoices
  where id = ${id} and org_id = ${session.orgId}
`;
if (!invoice) notFound(); // same response for "doesn't exist" and "not yours"
```

`sql` stands for your database client. With supabase-js, it's `.eq('id', id).eq('org_id', orgId)`.

Do this on every read, update, and delete, including exports and downloads. An admin route needs a role check in the handler. Hiding the link only hides the link.

## Check auth where the data is, not only in `proxy.ts`

Server actions look like function calls, but they're public endpoints. Anyone can POST to an exported action directly, and a check on the page doesn't cover its actions.

Agents love one check in `proxy.ts` (`middleware.ts` before Next.js 16), which runs before matching routes. In 2025, a Next.js bug let anyone skip it with one header. Vercel-hosted apps were safe, but the advice since holds everywhere: don't make it the only protection. Check auth in each action, or in a data access layer (query functions every action goes through).

## Send the client only what it shows

Props passed to a client component get written into the page. Pass the whole user row to `<Profile user={user} />` and every column, from email to Stripe IDs, is in the page source. A server action's return value works the same way.

The fix: your query functions return `{ name, avatarUrl }`, not the row.

## Mass assignment: the spread that grants admin

Notice that the whole request body goes straight into `.update()`:

```ts
await supabase
  .from('profiles')
  .update(await req.json()) // the form only sends name and bio
  .eq('id', user.id);
```

Anyone can add `"role": "admin"` to the body, and `.update()` writes it. Name the fields you accept. A Zod schema with only `name` and `bio` does that, because unknown keys get stripped.

## Rate-limit what an attacker can repeat

Bots try leaked passwords on tiny apps too. From day one, limit login, signup, password reset, code and email sends, and every AI route, by IP and by account: a password bot rotates IPs, and an email bomber targets one inbox.

Better Auth and Supabase Auth limit their own endpoints (on Supabase, under **Authentication → Rate Limits**). Your own routes need your own counter. A row in Postgres is enough ([AI features in production](ai-features-in-production.md)).

<details>
<summary>Going deeper: Better Auth's limiter on serverless</summary>

Better Auth's limiter keeps counts in memory by default, and its docs warn this may not suit serverless: each function instance keeps its own count. Set `rateLimit.storage` to `"database"`.

</details>

## On Supabase, RLS is your authorization

If the browser talks to Supabase directly, no server sits in between, so row-level security (RLS) is the check: rules in the database, called policies, that decide which rows each user can read or write. A table in `public` (the part of the database Supabase's API serves) without RLS is readable and writable through the publishable key, and that key ships in your JavaScript. In 2025, a researcher found 170 of 1,645 Lovable-built apps with missing or weak RLS, exposing emails, payment details, and API keys.

Here's the invoice check as a policy. Notice that the signed-in user, `auth.uid()`, must belong to the invoice's org:

```sql
alter table invoices enable row level security;

create policy "Members can read their org's invoices"
on invoices for select
to authenticated
using (
  exists (
    select 1 from org_members m
    where m.org_id = invoices.org_id
      and m.user_id = (select auth.uid())
  )
);
```

- **`enable row level security`** turns RLS on. With no policies, the API returns nothing.
- **`for select`** covers reads. Inserts, updates, and deletes each need their own policy.
- **`to authenticated`** covers signed-in users. Signed-out visitors get nothing.
- **`using (…)`** is the test each row must pass to come back.
- **`exists (select 1 from org_members m …)`** asks: is there a membership row? `m` is short for `org_members`.
- **`m.org_id = invoices.org_id`**: for this invoice's org.
- **`m.user_id = (select auth.uid())`**: for the signed-in user. Wrapped in `select`, `auth.uid()` runs once per query, not once per row.

Update policies also need `with check`, which tests the row after the change, so nobody moves an invoice into another org. `org_members` needs a policy that lets users read their own rows.

## How I do it

On my own side projects:

- Ask your agent for a data access layer: query functions that take the user from the session, filter by owner, return only what the UI shows, and answer `404` when the row isn't theirs.
- Rate-limit my own email and AI routes with a counter in Postgres, by IP and by account. On Better Auth, store its counts in Postgres too, with the one setting in the [recipe](../recipes/side-project-stack.md#rate-limit-auth-in-the-database).
- Ask your agent: "For each resource, write a test where user B requests user A's record by ID and gets a `404`." It's the cheapest test against the most common bug.

On Supabase, the dashboard's Security Advisor flags tables in `public` without RLS. Turn it on for each, add policies like the one above, and run the user-B test.

## The standard

- **Postgres RLS backs up the server's checks as a second wall.** Do it once a forgotten `where` would leak a real customer's data to another. Connect as a role that doesn't own the tables, since owners skip RLS unless it's forced.
- **Permissions live in one place,** like a `can(user, action, resource)` function and a roles table, not `if`s scattered across handlers. Do it once roles stop fitting in one `if`.
- **Someone walks the abuse cases:** sends what an attacker would, and checks the result. Do it once real users or real money show up ([security](../concerns/security.md)).
- **Every copy of personal data is traced, and deletion reaches each one.** Do it once you hold real users' data. If any live in the EU, GDPR already gives them that right ([privacy](../concerns/privacy.md)).
- **The API has a written contract that changes only by adding fields.** Do it when a mobile app or outside developers call it ([API contracts](../concerns/api-contracts.md)).

## Before you ship, check

Paste this to your agent before you merge:

- Every action and route handler parses its input with a Zod schema first.
- Every query on user data filters by the owner from the session, not only by an ID from the request.
- Each server action checks auth itself or through the data access layer, never only in `proxy.ts`.
- Client components get only the fields the UI shows.
- Login, signup, password reset, email, and AI routes are rate-limited, with counts every function instance shares, not kept in memory.
- On Supabase, every table in `public` has RLS on, with a policy for each operation the app needs. No policy means denied.

## Sources

- [OWASP API Security Top 10, 2023 edition](https://api-security.owasp.org/editions/2023/en/0x11-t10/)
- [OWASP API1:2023 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP API3:2023 Broken Object Property Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [Next.js: How to think about data security](https://nextjs.org/docs/app/guides/data-security)
- [Next.js 16: `middleware.ts` renamed to `proxy.ts`](https://nextjs.org/blog/next-16)
- [Next.js advisory GHSA-f82v-jwr5-mffw (CVE-2025-29927)](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw) and [Vercel's postmortem](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass), for the self-hosted bypass, affected versions, and why Vercel-hosted apps weren't affected
- [Better Auth: Rate limit](https://www.better-auth.com/docs/concepts/rate-limit)
- [Supabase Auth: Rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Matt Palmer: Statement on CVE-2025-48757](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), for `auth.uid()`, `using` and `with check`, `to authenticated`, wrapping `auth.uid()` in `select`, and membership checks through another table
- [Supabase: Database advisors](https://supabase.com/docs/guides/database/database-advisors), for the RLS-disabled check
- [Zod: Objects](https://zod.dev/api#objects)
