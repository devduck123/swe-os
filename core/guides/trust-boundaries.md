---
title: 'Trust boundaries: validation and authorization'
description: Everything from outside your server is a suggestion. Most security bugs in small apps are a missing check on who owns the record.
stage: design
track: 6
concerns: [security, api-contracts, privacy]
freshness: durable
status: draft
---

A trust boundary is any line where data crosses from something you don't control into something you do. At each one, ask two questions. Is this shaped like what I expect? That's validation. Is this caller allowed to touch this exact thing? That's authorization. People forget the browser is outside, because they wrote the frontend. Anyone can edit the request.

## Easy to miss

- **Logged in isn't allowed.** If the page checks for a session and then loads `/invoices/8f3a` by ID, any user can read any invoice by changing the URL. Put the owner in the query itself, and answer 404 for both "doesn't exist" and "not yours".
- **Identity comes from the session, never the request.** A `userId` or `role` in the body is whatever the caller typed. Read the user from the session and the role from your database.
- **A server action is a public endpoint.** It looks like a function call, but anyone can POST to it. A check in middleware or on the page doesn't cover it.
- **Spreading the body into an update hands out admin.** The form sends name and bio, but someone can add `role`. Name the fields you accept.
- **Whatever you hand the client is public.** Pass a whole user row to a client component and every column is in the page source. Return only what the screen shows.
- **If the browser talks to the database, the database is the guard.** With a setup like Supabase, row-level security (rules in the database that decide which rows each user can see) is your only authorization. A table without it is open to anyone with the public key, which ships in your JavaScript.
- **Bots find tiny apps too.** Login, signup, password reset, email sends, and AI routes need rate limits from day one, by IP and by account. Keep the counts in the database, since each serverless instance has its own memory.

**How I do it:** a data access layer that takes the user from the session, filters by owner, and returns only what the UI shows, plus one test per resource where user B asks for user A's record and gets a 404.

## Go deeper

- [OWASP API1:2023 Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)
- [Next.js: How to think about data security](https://nextjs.org/docs/app/guides/data-security)
