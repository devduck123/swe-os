---
title: Vibe coder vs. engineer
description: What actually separates someone who can get AI to build a demo from someone who ships software that holds up, and how to cross the gap.
domain: foundations
stage: understand
freshness: durable
status: outline
track: 1
concerns: []
---

**After this page, the reader can say** what separates the two, which isn't typing speed or tools, and knows where the rest of the track takes them.

## The happy path is the easy 20%

- A vibe coder gets the demo working: right input, fast network, one user, nobody malicious, never touched again.
- Engineering is everything else: wrong input, slow or failing services, many users at once, attackers, money, and you coming back in six months.
- One concrete story: the same feature, vibe-coded and engineered, side by side. An avatar upload or a checkout button works well.

## AI writes the code for both of them

- Both people use agents now. Writing the code by hand isn't the difference.
- The thesis: AI made code cheap, and judgment is still the expensive part.
- What judgment means in practice: knowing what to build, what can go wrong, and how you'd know it works.

## Engineers ask more questions before they're done

- Turn the concerns into plain questions. Who's allowed to do this? What if it fails halfway? What does it cost at 10x? How would I know it broke? Can I undo it?
- Link [concerns](../concerns/README.md) as the full list. Agents use the same list.
- Make the point that asking is cheap. Not asking is what gets expensive.

## Vibe coding is fine, until it isn't

- Prototypes, throwaway tools, and learning projects: vibe away.
- The floors that never get a pass: secrets, auth, money, personal data, and deleting data.
- Proportion: a weekend project doesn't need Google's infrastructure, and a real product shouldn't inherit weekend shortcuts.

## How you close the gap

- Walk the track. Each stop covers one thing the happy path hides.
- Learn from your own agents' work: "Worth learning" notes and walkthroughs before you merge (see [learning with agents](learning-with-agents.md)).
- Ship something real and keep score.

## What the vibe-coded version misses

A preview list, each item linking to the stop that covers it:

- secrets in the client bundle
- forms that break on double submit
- no loading, empty, or error states
- surprise bills from free-tier cliffs
- retries that charge twice
- packages that don't exist
- code nobody, including the author, can explain

## What I'd do

- Vibe code to find out whether the idea is worth anything. Engineer the parts that cross a floor.
- Start with the simplest thing that works, and make every added piece earn its place.

## Sources to check before writing

- The METR study on perceived vs. actual speed, and Anthropic's skill-formation study, both already cited in [learning with agents](learning-with-agents.md).
