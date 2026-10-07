---
title: Security
description: Who can do what, what input you trust, and where secrets live.
---

**Triggered by:** untrusted input, uploads, auth or permissions, secrets, payments, exposed APIs and webhooks, model calls, new dependencies, and calls to outside services.
**Floor:** secrets, auth, and payments always get "when stakes rise", even in a prototype.

## Minimum bar

- Name the trust boundaries: where does data come from someone you don't control?
- Validate on the server. The UI is a convenience, not a control.
- Check authorization in every server action and route handler: is this user allowed to touch _this_ record? Each one is a public endpoint, so a check only in middleware (`proxy.ts` in Next.js 16) isn't enough. See [trust boundaries](../guides/trust-boundaries.md).
- Verify webhook signatures before parsing the body.
- On Supabase, turn on row-level security (RLS) for every exposed table, and keep the `service_role` or secret (`sb_secret_...`) key out of client code. Both bypass RLS.
- Keep secrets out of client code, logs, error messages, Git, and agent chats. Load them from the environment. Variables with a public prefix (`NEXT_PUBLIC_`, `VITE_`) ship to the browser.
- Give agents and tools their own scoped, dev-only keys. Production keys live only in the hosting platform. See [secrets and agent safety](../guides/secrets-and-agent-safety.md).
- Use parameterized queries and the framework's escaping. Never build SQL or HTML by string concatenation.

## When stakes rise

- Walk the abuse cases: what does an attacker send? Try it.
- For uploads, limit size before parsing, check the real content type, store under keys you generate, and serve from a separate origin or with `Content-Disposition: attachment`.
- Give each credential the least privilege it needs, and know how you'd rotate it.
- Rate-limit anything that costs money or can be brute-forced.
- Check new dependencies: who maintains them, and what do they get access to?

## Common misses

- `userId` taken from the request body instead of the session.
- An API key in a frontend bundle or a committed `.env`.
- Trusting a file's name or MIME type from the client.
- Admin routes protected only by being hidden from the menu.
- Detailed stack traces returned to users.
- A production key pasted into an agent chat, or exposed through a public env prefix.

## Learn more

- [Validate at the boundaries](../principles.md#validate-at-the-boundaries)
- [Secrets and safety when agents write your code](../guides/secrets-and-agent-safety.md)
- [How a request travels through your app](../guides/how-a-request-travels.md)
- [Trust boundaries: validation and authorization](../guides/trust-boundaries.md)
- [AI features in production](../guides/ai-features-in-production.md)
- [Reading and reviewing code you didn't write](../guides/reading-and-reviewing-code.md)
- [Local first, then managed services](../guides/local-first-then-managed.md)
- [The side-project stack](../recipes/side-project-stack.md)
