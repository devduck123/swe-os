---
title: 'Trust boundaries: validation and authorization'
description: Everything from outside your server is a suggestion. Most security bugs in small apps are a missing check on who owns the record.
stage: design
track: 6
concerns: [security, api-contracts, privacy]
freshness: durable
status: draft
---

A trust boundary is any line where data crosses from something you don't control into something you do. At each one, ask two questions. Is this shaped like what I expect? That's validation: check types and sizes, and reject the rest. Is this caller allowed to touch this exact thing? That's authorization. People forget the browser is outside because they wrote it. Anyone can edit the request.

## Easy to miss

- **Logged in isn't allowed.** If a page checks that someone's signed in, then loads `/invoices/8f3a` by ID, any user can read any invoice by changing the URL. Put the owner in the query itself, and answer 404 for both "doesn't exist" and "not yours".
- **Identity comes from the session, never the request.** A `userId` or `role` in the body is whatever the caller typed. Read the user from the session, the sign-in your auth library verifies, and the role from your database.
- **A server action is a public endpoint.** It looks like a function call, but Next.js gives it an address anyone can POST to. A check in the page or in middleware, code that runs before pages, doesn't cover it. Check inside the action.
- **Copying the whole request into an update hands out admin.** The form sends name and bio, but someone can add `role`. Name the fields you accept.
- **Whatever you hand the client is public.** Pass a whole user row to a client component and every column is in the page source. Return only what the screen shows.
- **If the browser talks to the database, the database is the guard.** With Supabase, row-level security, database rules on which rows each user can see, is your only authorization. A table without it is open to anyone with the anon key, which ships in your JavaScript.
- **Bots find tiny apps too.** Login, signup, email sends, and AI routes need rate limits, a cap on tries per minute, by IP and by account. Keep the counts in the database, since each [serverless instance](how-a-request-travels.md) has its own memory.

**How I do it:** a data access layer, one file every database read goes through, that takes the user from the session, filters by owner, and returns only what the UI shows. Plus a test where user B asks for user A's record and gets a 404.

**Ask your agent:** "Make every read and write in this app take the user from the session and touch only rows that user owns. Then test that a second user asking for the first user's records gets a 404."

## Go deeper

- [OWASP API1:2023 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)
- [Next.js: How to think about data security](https://nextjs.org/docs/app/guides/data-security)
