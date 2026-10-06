---
title: Security
description: Who can do what, what input you trust, and where secrets live.
---

**Triggered by:** untrusted input, uploads, auth or permissions, secrets, payments, calls to outside services, exposed APIs.
**Floor:** secrets, auth, and payments always get "when stakes rise", even in a prototype.

## Minimum bar

- Name the trust boundaries: where does data come from someone you don't control?
- Validate on the server. The UI is a convenience, not a control.
- Check authorization on every protected action: is this user allowed to touch _this_ record?
- Keep secrets out of client code, logs, error messages, and Git. Load them from the environment.
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

## Learn more

- [Validate at the boundaries](../principles.md#validate-at-the-boundaries)
