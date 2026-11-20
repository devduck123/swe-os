---
title: Shipping a desktop app
description: There's no redeploy for an app on someone's laptop. Every version you ship stays shipped, so signing, updates, and old versions come first.
stage: ship
track: 21
concerns: [desktop-apps, api-contracts]
freshness: durable
status: reviewed
---

A website you can fix by deploying again. A desktop app lives on other people's machines, in whatever version they downloaded. So the things a web app can add later, like updates, crash reports, and a stable API, have to be in the very first public build.

## Easy to miss

- **Unsigned looks like malware.** macOS and Windows warn about or block apps from developers they can't verify. Signing needs a developer account and a certificate from each platform, and the rules change, so look them up and get a signed build through well before launch.
- **Every version you ship stays shipped.** People keep the build they downloaded for years unless the app updates itself. Add auto-update before the first public release, or everyone on it is stuck there.
- **Old versions keep calling your server.** Any API, license check, or download link the app uses has to keep working for every version still installed. Send the app version with each request so you know when one can retire.
- **Crashes happen where you can't see them.** There are no server logs on someone's laptop. Turn on crash reporting, and ask before sending anything that identifies the person.
- **Permissions are a user journey.** The system asks, not your app, and some, like accessibility and screen recording, can only be turned on in System Settings. Explain why before the prompt, and handle a denied or revoked permission.
- **A grant belongs to the signature.** macOS ties each permission to how the app is signed. Sign every build with one stable identity, or each rebuild loses its grants.
- **Your build machine lies.** It already trusts your certificate and has every permission granted. Test the downloaded build on a machine that has never run the app.
- **A store trades control for less work.** It handles updates and payments, but takes a cut, reviews every release, and limits what the app can do. Check its current rules against what your app needs before you build for it.

**How I do it:** I haven't shipped one yet. On the Mac utility I'm building, every build is signed with one stable identity. Before anyone else installs it, I'll pick a store or direct download, then add release signing, auto-update, and crash reports.

**Ask your agent:** "Look up what each platform we ship on currently requires to sign a build. Set up signing and auto-update in CI, so every release is a signed build an existing install updates to. Then list every server endpoint the app calls, so we keep them working for old versions."

## Go deeper

- [Apple: notarizing macOS software before distribution](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
- [Sparkle: updates for Mac apps](https://sparkle-project.org)
