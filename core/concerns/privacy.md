---
title: Privacy
description: What personal data you collect, where copies go, and whether you can actually delete it.
---

**Triggered by:** personal data, uploads, payments.
**Floor:** personal data and payments always get "when stakes rise".

## Minimum bar

- Collect only what the feature needs. Every field you store is a field you must protect.
- Decide who can see it and how a user deletes it.
- Keep personal data out of logs, analytics events, URLs, and public files.
- Strip metadata you don't need, like GPS coordinates in photo EXIF.

## When stakes rise

- Trace every copy: database, backups, logs, caches, third-party services, email.
- Make deletion reach all of those copies, or document which ones it doesn't and why.
- Set a retention period and enforce it.
- Know which laws or terms apply (GDPR, CCPA, your provider's terms). Ask whoever owns that call rather than guessing.

## Common misses

- Email addresses in query strings, which end up in server logs and analytics.
- "Delete account" that soft-deletes forever.
- Sending full user records to an analytics or AI provider when an ID would do.
