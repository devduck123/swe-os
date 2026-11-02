---
title: Reading and reviewing code you didn't write
description: An agent can write a 600-line PR in minutes, and whether it's good is still your call. Don't merge what you can't explain.
stage: verify
track: 15
concerns: [testing, security]
freshness: durable
status: draft
---

Reading code is how you find out what's true, not what the agent's summary says. Reviewing is deciding whether a change deserves to exist. Before you merge anything that matters, you should be able to say what it does, why it's built this way, and how it fails. If you can't, you've read it, not reviewed it.

## Easy to miss

- **Green CI only checks what the tests check.** CI, the checks that run on every PR, passes an export route that takes the team ID from the URL, because every test uses the test user's own team. Anyone can change that number and download another team's data.
- **The worst bugs are what's missing.** A missing ownership check leaves nothing wrong in the diff to see. You catch it by knowing what every route that reads or changes data must do: check who's signed in, check they own or may touch _this_ record, and reject bad input.
- **Bugs sit where the diff meets code it didn't touch.** If a change alters what a function returns, open its callers, every place that uses it. Your editor or the agent can list them.
- **Agents sound just as sure when they're wrong.** The PR description is a set of claims. Check a few against the code.
- **Style comments can make a review worse.** Ten notes on naming and none on the missing check still ends in "approved".
- **Spend attention where a mistake costs most.** Read every line of auth, money, deletes, migrations (files that change the database's structure), and paid API calls. Skim copy and styling.
- **Big PRs get skimmed, and agents don't feel the cost.** Ask for the database change, the server logic, and the UI as separate PRs, merged in that order.
- **A finding with a reproduction gets fixed.** A reproduction is the steps that make the bug happen. "Request team 7's export as a user on team 3" ends the argument. "This feels risky" starts one.

**How I do it:** a small PR for every change even when I'm the only reviewer, line by line on anything touching auth, money, deletes, or the database, and a second opinion from a fresh session or a different agent.

**Ask your agent:** "Review this PR as if a stranger wrote it. For every route it touches, tell me who can call it and what stops them from touching someone else's records, and give me a request that proves each problem you find."

## Go deeper

- [Google engineering practices: what to look for in a code review](https://google.github.io/eng-practices/review/reviewer/looking-for.html)
- [Google engineering practices: small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
