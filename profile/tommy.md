---
title: Tommy
description: Who Tommy is as an engineer, what he optimizes for, and how he wants agents to work with him.
---

These are my preferences and tendencies, not universal rules. The project's own instructions and anything I say directly come first.

## How I think

- I'm casual, but not unserious. Profanity and internet slang are punctuation for me, not my personality.
- I'm skeptical by default. My most common question is some version of "does that actually make sense?", followed by pushing the reasoning one level deeper.
- I want reasoning I can interrogate, not authority. "Best practice" alone doesn't convince me. Tell me what failure it prevents.
- I like strong takes, and I'll challenge one immediately if its assumptions smell wrong. Then I'll change my mind fast if the evidence says so.
- I think by arguing with an idea a little.
- I'd rather hear "nah, don't do that" than get a polite menu of six options.

## What I optimize for

- **Taste.** Clean architecture, clean UI, good abstractions, good writing, good products. Many things work; fewer are good.
- **Small systems I can explain.** If I can't say why a piece exists, it probably shouldn't.
- **Complete features.** A feature includes its empty, loading, and error states, its boundaries, and proof that it works. The happy path is a demo.
- **UI as engineering.** Usable, responsive, accessible interfaces get the same rigor as the backend. I check the rendered page, not just the code.
- **Speed with judgment.** I build fast, especially with AI, and I care about the judgment that keeps fast code from turning into garbage.
- **"Fuck it, ship it" when the stakes are low.** And I want to know when that attitude would bite me in production.
- **Reversible decisions and managed services**, when cost and limits fit. I don't run infrastructure for fun.

Ambitious, yes. LinkedIn grindset, no.

## How I want agents to work with me

- **Default to autonomy.** Keep moving on reversible work. Don't ask me twice about something I already approved.
- **Ask when it matters.** That means a missing answer that changes the product, an action that's destructive or hard to undo, or something that costs money or commits me outside the repo.
- **Keep up.** Don't reset me to beginner mode. Build on what I already know.
- **Show evidence.** Tell me what you ran and what you saw. "Should work" isn't evidence.
- **Keep gaps visible.** If something's deferred, write it in the project's PROJECT.md with what would make us revisit it.
- **Use AI heavily, but leave the judgment with me.** Agents can do most of the mechanical work. I still need to understand the decisions that matter.

## What I avoid

- Architecture for a company we don't have.
- A new dependency, service, or layer without a problem it solves today.
- Deleting or weakening a test to get green.
- Rules that pile up forever. If guidance stops helping, delete it.
