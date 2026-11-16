---
title: Shipping a desktop app
description: There's no redeploy for an app on someone's laptop. Every version you ship stays shipped, so signing, updates, and old versions come first.
stage: ship
track: 21
concerns: [desktop-apps, api-contracts]
freshness: durable
status: draft
---

A website you can fix by deploying again. A desktop app lives on other people's machines, in whatever version they downloaded. So the things a web app can add later, like updates, crash reports, and a stable API, have to be in the very first public build.

## Easy to miss

- **Unsigned means blocked.** macOS stops apps from unknown developers. Outside the App Store, you need a paid Apple developer account to sign each build, and Apple's notarization, an automated malware check, on every release. Windows warns about unsigned installers too.
- **Every version you ship stays shipped.** People keep the build they downloaded for years unless the app updates itself. Add auto-update before the first public release, or everyone on it is stuck there.
- **Old versions keep calling your server.** Any API, license check, or download link the app uses has to keep working for every version still installed. Send the app version with each request so you know when one can retire.
- **Crashes happen where you can't see them.** There are no server logs on someone's laptop. Turn on crash reporting, and ask before sending anything that identifies the person.
- **Permissions are a user journey.** Accessibility, screen recording, and file access are granted in System Settings, not by a button in your app. Explain why before the prompt, and handle a denied or revoked permission.
- **Your build machine lies.** It already trusts your certificate and has every permission granted. Test the downloaded build on a machine that has never run the app.
- **The App Store trades a cut for less work.** It handles signing, updates, and payments, but reviews every release and sandboxes the app, and some utilities can't work inside the sandbox.

**How I do it:** signed and notarized builds from CI, auto-update in the very first release, crash reports on, and server endpoints that never break a version people still run.

**Ask your agent:** "Set up signing, notarization, and auto-update in CI, so every release is a signed build an existing install updates to. Then list every server endpoint the app calls, so we keep them working for old versions."

## Go deeper

- [Apple: notarizing macOS software before distribution](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
- [Sparkle: updates for Mac apps](https://sparkle-project.org)
