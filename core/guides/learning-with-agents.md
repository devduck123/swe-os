---
title: Learning while agents write the code
description: Finishing work feels exactly like learning, so delegating to agents can quietly stop you from getting better unless you add a comprehension step on purpose.
stage: improve
track: 21
concerns: []
freshness: durable
status: draft
next:
  link: /recipes/side-project-stack/
  label: 'Track 22: The side-project stack'
---

Agents make you faster at shipping. They don't make you better at engineering unless you do something on purpose, and you won't notice the difference, because finishing work feels exactly like learning. The fix isn't less AI. It's a step after the agent's work where you check that you understood it.

## Easy to miss

- **Delegating teaches almost nothing.** In a randomized study from Anthropic, developers learning a new library with AI scored 50% on a quiz afterward, against 67% for those coding by hand. The biggest gap was debugging, and the AI group wasn't meaningfully faster.
- **How you use it matters more than whether.** People who generated code and then made sure they understood it, or asked only how things work instead of asking for code, scored well. Those who debugged by asking the AI again scored worst.
- **You can't feel it.** In a study by METR, an AI research nonprofit, experienced developers took 19% longer with AI on their own repos and believed it made them about 20% faster. The check has to come from outside your gut.
- **Answering beats rereading.** Pulling an answer from memory, even getting it wrong first, sticks far better than reading the explanation again. Coming back after a gap beats one long session. This comes from classrooms, not agent workflows, so using it here is a bet. A cheap one.
- **Spend it where you'll have to debug.** Auth, data, money, and AI features in your app that act on their own, like one that sends emails. If you can't explain how auth works in your app, you can't review an agent's change to it. Throwaway prototypes and boilerplate can go by.

**How I do it:** every agent PR carries a "Worth learning" note from the agent and three questions it asks me, which I answer from memory before merging. A wrong answer means I reread that part first. I catch up on the week's notes once a week, and once per feature in an area I want to own, I write the central piece myself, like the check that decides who can see what. The [learn skill](../../skills/learn/SKILL.md) runs all three.

**Ask your agent:** "Before I merge this, tell me the one or two things in it worth learning, then ask me three questions about how it works, starting with the auth and data parts. Don't show the answers until I've tried."

## Go deeper

- [Shen and Tamkin, "How AI Impacts Skill Formation" (Anthropic, 2026)](https://arxiv.org/abs/2601.20245)
- [Geoffrey Litt, "Understanding is the new bottleneck"](https://geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck.html)
