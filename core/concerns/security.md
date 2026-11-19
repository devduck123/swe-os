---
title: Security
description: Who can do what, what input you trust, and where secrets live.
---

**Triggered by:** untrusted input, uploads, auth or permissions, secrets, payments, exposed APIs and webhooks, model calls, new dependencies, and calls to outside services.
**Floor:** secrets, auth, and payments always get "when stakes rise", even in a prototype.

## Minimum bar

- Name the trust boundaries: where does data come from someone you don't control?
- Validate on the server. The UI is a convenience, not a control.
- Check authorization in every server action and route handler: is this user allowed to touch _this_ record? Each one is a public endpoint, so a check only in middleware isn't enough. See [trust boundaries](../guides/trust-boundaries.md).
- Verify webhook signatures before parsing the body.
- If the browser talks to the database directly, as with Supabase, turn on row-level security (RLS) for every exposed table, and keep any key that bypasses it out of client code.
- Keep secrets out of client code, logs, error messages, Git, and agent chats. Load them from the environment. Variables with a public prefix (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`) ship to the browser or the app, where anyone can read them.
- Give agents and tools their own scoped, dev-only keys. Production keys live only in the hosting platform. See [secrets and agent safety](../guides/secrets-and-agent-safety.md).
- Use parameterized queries and the framework's escaping. Never build SQL or HTML by string concatenation.

## When stakes rise

- Walk the abuse cases: what does an attacker send? Try it.
- For uploads, limit size before parsing, check the real content type, store under keys you generate, and serve from a separate origin or with `Content-Disposition: attachment`.
- Give each credential the least privilege it needs, and know how you'd rotate it.
- Rate-limit anything that costs money or can be brute-forced. Per-user limits need accounts that cost something to make, like a verified email, or 200 throwaway signups get 200 times the limit. Anything users can publish or send, like profiles, files, or invites, can be used for spam or phishing from your domain.
- Send a Content-Security-Policy that blocks scripts you didn't write, and check the real response headers instead of assuming the host adds them.
- Check the account flows past sign-in. Trust an email only once it's verified, including before linking a Google sign-in to an existing account. Compare emails ignoring case. Reset and verification links expire and work once. A password change or account deletion ends every other session. Auth libraries leave some of this off by default, so read the settings.
- Check new dependencies: who maintains them, and what do they get access to?

## Common misses

- `userId` taken from the request body instead of the session.
- An API key in a frontend bundle or a committed `.env`.
- Trusting a file's name or MIME type from the client.
- Admin routes protected only by being hidden from the menu.
- Detailed stack traces returned to users.
- A Google sign-in linked to an account whose email was never verified, so whoever signed up first with that address takes the account.
- User-written Markdown or rich text rendered as raw HTML, and a login that redirects to whatever `?next=` says.
- A production key pasted into an agent chat, or exposed through a public env prefix.

## Why, and more of what people miss

- [How a request travels through your app](../guides/how-a-request-travels.md)
- [Trust boundaries: validation and authorization](../guides/trust-boundaries.md)
- [Local first, then managed services](../guides/local-first-then-managed.md)
- [AI features in production](../guides/ai-features-in-production.md)
- [Secrets and safety when agents write your code](../guides/secrets-and-agent-safety.md)
- [Reading and reviewing code you didn't write](../guides/reading-and-reviewing-code.md)
- [The side-project stack](../recipes/side-project-stack.md)
- [Validate at the boundaries](../principles.md#validate-at-the-boundaries)
