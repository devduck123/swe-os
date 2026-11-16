---
title: Launch
description: Putting a site, page, or signup in front of strangers, and what has to be true before the link goes out.
---

**Triggered by:** a site, page, or signup going public for the first time; a new or changed domain; a form that collects emails from the public.

## Minimum bar

- Every public page has its own title and description, and a social card that shows up in a real link preview, not just in the code. URLs in metadata are absolute and on the real domain.
- Search engines index production only. Previews stay out, and when a project has two domains, one is canonical and the other redirects to it.
- A signup form says what happens next, keeps out the easy bots without a CAPTCHA first (a hidden field, a rate limit), and records when and where each person signed up.
- Any personal data, even one email address, gets a privacy page. It says what you keep, why, who else sees it, and how to get removed. The form links to it.
- Decide what you'll measure before launch, and set it up before the link goes out. Prefer analytics that don't set cookies, so you don't need a banner.
- A commercial product doesn't run on a host's plan that forbids commercial use, like Vercel Hobby.

## When stakes rise

- Sending email: send from a domain you own, with SPF, DKIM, and DMARC set, a day or more before the first big send. Put one-click unsubscribe on everything that isn't a receipt. Send a test to Gmail and Outlook and check it lands in the inbox.
- Waitlists get double opt-in: the address confirms before you send it anything else.
- Find every limit an announcement can hit: daily email sends, function runs, database connections, model spend. Know what happens at each one.
- Turn on auto-renew and the registrar lock for the domain.
- Add terms of service once people post content or pay.

## Common misses

- The social card shows a preview URL, an old title, or the framework's default image, and the platform cached the first version it fetched.
- The `vercel.app` address competes with the real domain in search.
- Launch email lands in spam because the domain was set up that morning.
- Analytics added the day after launch, so the one spike goes uncounted.
- Waitlist emails sit in a table with no record of consent and no way to export them.

## Why, and more of what people miss

- [Going public](../guides/going-public.md)
- [Privacy](privacy.md), for what you collect and how people get removed
- [Security](security.md), for the form and anything it writes
- [Cost](cost.md), for the limits an announcement hits
