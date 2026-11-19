---
title: Desktop apps
description: An app on someone else's computer, in whatever version they installed, that you can't redeploy.
---

## Minimum bar

- Every public build is signed, and on macOS notarized. Test the downloaded build on a machine that has never run the app, not the one you built it on.
- Auto-update works from the first public release. Test updating from the previous release to the new one.
- Every endpoint, license check, and download link the app calls keeps working for each version still installed. The app sends its version with each request.
- The app still opens and works when a server it calls is slow or down.
- Crash reporting is on, and asks before sending anything that identifies the person.
- Each OS permission is explained before the prompt, and the app handles it being denied or revoked later.

## When stakes rise

- Release in stages, like a beta channel first, with a way to stop a rollout.
- Have a way to tell a version that's too old to update, and know which versions are still in use before you retire one.
- Keep signing certificates and keys in CI secrets, never in the repo or an agent's reach, and know when the certificate expires.
- Keep local data where the OS expects it, migrate it between versions, and never lose it on update.

## Common misses

- It works on the build machine, and macOS blocks it everywhere else.
- Auto-update added in version 1.3, so everyone on 1.0 to 1.2 stays there.
- A server change that breaks the version most people still run.
- A signing certificate that expires the week of a release.

## Why, and more of what people miss

- [Shipping a desktop app](../guides/shipping-a-desktop-app.md)
- [API contracts](api-contracts.md), for the server every old version still calls
- [Security](security.md), for signing keys and updates
- [Privacy](privacy.md), for crash reports
