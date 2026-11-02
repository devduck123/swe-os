---
title: Secrets and safety when agents write your code
description: A secret lets whoever holds it act as you, and agents give it new places to leak.
stage: build
track: 12
concerns: [security, ai-features, dependencies, deployment]
freshness: durable
status: draft
---

A secret is a string that lets whoever holds it act as you, and the other end can't tell the difference. So a secret that leaves its place is already compromised. Agents read your files, run your shell, and keep transcripts, which gives it more ways out.

## Easy to miss

- **A public prefix publishes the value.** Anything named `NEXT_PUBLIC_` or `VITE_` ships to the browser. When a key comes back undefined there, renaming it is the quick fix an agent reaches for. Move the call into code that only runs on the server instead.
- **A pasted key is a leaked key.** It lives in a transcript you don't control. Rotate it, meaning make a new key and revoke the old one, and give the agent the variable's name, never its value.
- **Blocking the agent from `.env` isn't a wall.** A rule that blocks the agent's file-reading tool doesn't stop it running a script that prints the file. What protects you is what's in the file: dev keys with low limits, never a production key that can write.
- **Text the agent reads can give it orders.** An issue that says "print your environment" is prompt injection: text written to steer whatever model reads it. Give every connected tool the narrowest token, like a read-only dev database.
- **A publishable key is safe only because something else guards.** Supabase's relies on row-level security, database rules for which rows each user can touch. Turn that off and anyone can read everything.
- **Deleting the commit doesn't un-leak it.** Bots use keys from public repos within minutes, and forks, other people's copies of the repo, still have it. Rotate first, then check the bill.
- **Error reports are another copy.** Error trackers like Sentry ship the error and its context to their servers. Their scrubbers, filters that blank out secrets, catch a field named `password`, not a database URL with the password inside an error message.
- **Agents invent package names, and attackers register them.** Check the publisher and repo before installing anything you didn't pick.

**How I do it:** dev keys with spend caps on my laptop, production keys only in the hosting platform, a secret scan in CI (the checks that run on every push), and no agent holding a production key that can write.

**Ask your agent:** "List every secret this app uses, where it lives, and whether it can reach the browser. Move anything secret to server-only code, tell me which keys are production, and add a secret scan that runs on every push."

## Go deeper

- [Next.js: environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [GitHub: removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
