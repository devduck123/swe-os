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

- **The agent says it's done either way.** It handles the cases you named, skips the rest, and reports success. Ask it to list every decision you didn't specify, and read that before the diff.
- **The demo trusts the request.** An upload route often takes the user's ID from the form, so anyone can change anyone's photo. The server takes who's asking from the session.
- **Real data is meaner than demo data.** Zero rows, 100,000 rows, a 40 MB photo, an emoji in a name. A file's name and type come from the client too, so check them, or your storage becomes free hosting on your bill.
- **Failing halfway leaves leftovers.** If the upload works and the database write fails, the file sits in storage with nothing pointing to it. A double click does it twice.
- **Vibe coding is fine when nobody can get hurt.** Simon Willison's test: if this has a bug or a security hole, could anyone lose money, reputation, or worse? If not, speed wins.
- **Some things never get a pass.** Secrets, auth, money, personal data, and deletes are the floors, even in a prototype. You can't take them back: a key is leaked the moment it's pushed.
- **Code you can't explain isn't yours yet.** When it breaks, you're the one reading it. Have the agent walk you through it before you merge.

**How I do it:** I vibe code throwaway prototypes on a branch I won't merge, engineer the floors from the first commit, and read the agent's list of unspecified decisions before the diff.

## Go deeper

- [Simon Willison: Not all AI-assisted programming is vibe coding](https://simonwillison.net/2025/Mar/19/vibe-coding/)
