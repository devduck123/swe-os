---
title: Vibe coder vs. engineer
description: A vibe coder asks "does it work?" An engineer asks "what happens when it doesn't?" AI writes the code for both.
stage: understand
track: 1
concerns: []
freshness: durable
status: reviewed
---

Both can ship a feature in an afternoon now. The difference is the questions asked before calling it done. AI made code cheap. Judgment is still expensive, and an agent won't supply it unless you ask.

## Easy to miss

- **The agent says it's done either way.** It handles the cases you named, skips the rest, and reports success. Ask it to list every decision you didn't specify, and read that before the diff, the lines it changed.
- **The demo trusts the request.** An upload route takes the user's ID from the form, so anyone can change anyone's photo. Who's asking comes from the session, never the form ([trust boundaries](trust-boundaries.md)).
- **Real data is meaner than demo data.** Zero rows, 100,000 rows, a 40 MB photo, an emoji in a name. Cap what strangers can upload, or you pay to host whatever they send.
- **Failing halfway leaves leftovers.** The upload works, the database write fails, and the file sits in storage with nothing pointing to it. Decide what cleans up the first step when the second fails. A double click runs it all twice ([timeouts, retries, and idempotency](timeouts-retries-idempotency.md)).
- **Vibe coding is fine when nobody can get hurt.** Simon Willison's test: if this has a bug or a security hole, could anyone lose money, reputation, or worse? If not, speed wins.
- **Some things never get a pass.** Secrets and sign-in, money, sensitive or shared personal data, deletes, and AI that can take actions are what I call [the floors](../concerns/README.md#decide-how-deep-to-go): done right even in a prototype, because a mistake there can't be taken back. A key is leaked the moment it's pushed. Keys live in environment variables, the server checks who's asking, and a delete can be undone.
- **Code you can't explain isn't yours yet.** When it breaks, you're the one reading it. Have the agent walk you through it before you merge.

**How I do it:** I vibe code throwaway prototypes on a branch I won't merge, and get the floors right from the first commit. Before I merge, I read the agent's report and the decisions it made that I didn't, and the diff only where it touches a floor.

**Ask your agent:** "Before you call this done, list every decision you made that I didn't specify, and every place this touches secrets, sign-in, money, sensitive or shared personal data, deletes, or AI that can take actions. For each one, tell me what happens when it fails halfway or someone sends something I didn't expect."

## Go deeper

- [Simon Willison: Not all AI-assisted programming is vibe coding](https://simonwillison.net/2025/Mar/19/vibe-coding/)
