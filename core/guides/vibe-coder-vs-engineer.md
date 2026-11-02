---
title: Vibe coder vs. engineer
description: A vibe coder asks "does it work?" An engineer asks "what happens when it doesn't?" AI writes the code for both.
stage: understand
track: 1
concerns: []
freshness: durable
status: draft
---

Both can ship a feature in an afternoon now. The difference is the questions asked before calling it done. AI made code cheap. Judgment is still expensive, and an agent won't supply it unless you ask.

## Easy to miss

- **The agent says it's done either way.** It handles the cases you named, skips the rest, and reports success. Ask it to list every decision you didn't specify, and read that before the diff, the lines it changed.
- **The demo trusts the request.** An upload route often takes the user's ID from the form, so anyone can change anyone's photo. The server should read who's asking from the session, the sign-in your auth library checks on every request, which the caller can't edit.
- **Real data is meaner than demo data.** Zero rows, 100,000 rows, a 40 MB photo, an emoji in a name. A file's name and type come from the client too. Cap the size and accept only the types you expect, or strangers can store anything there and you pay to host it.
- **Failing halfway leaves leftovers.** If the upload works and the database write fails, the file sits in storage with nothing pointing to it. Decide what cleans up the first step when the second fails. A double click runs it all twice, so the server has to notice the repeat, not just the button.
- **Vibe coding is fine when nobody can get hurt.** Simon Willison's test: if this has a bug or a security hole, could anyone lose money, reputation, or worse? If not, speed wins.
- **Some things never get a pass.** Secrets, auth, money, personal data, and deletes are what I call the floors: done right even in a prototype, because a mistake there can't be taken back. A key is leaked the moment it's pushed. Keys live in environment variables, the server checks who's asking, and a delete can be undone.
- **Code you can't explain isn't yours yet.** When it breaks, you're the one reading it. Have the agent walk you through it before you merge.

**How I do it:** I vibe code throwaway prototypes on a branch I won't merge, get the floors right from the first commit, and read the agent's list of unspecified decisions before the diff.

**Ask your agent:** "Before you call this done, list every decision you made that I didn't specify, and every place this touches secrets, auth, money, personal data, or deletes. For each one, tell me what happens when it fails halfway or someone sends something I didn't expect."

## Go deeper

- [Simon Willison: Not all AI-assisted programming is vibe coding](https://simonwillison.net/2025/Mar/19/vibe-coding/)
