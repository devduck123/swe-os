---
name: explain
description: Teach a software engineering concept, or explain how a specific system or code path works, with a simple accurate model, a concrete example, and real failure modes. Use for understanding, not as a substitute for building or reviewing.
metadata:
  title: Explain
  example: "Explain circuit breakers like I'm a frontend dev new to backend reliability."
---

# Explain

Leave the reader able to reason about the topic after the answer ends. Follow the [rules for every task](../README.md#rules-for-every-task).

## Steps

1. **Read the reader.** Use what the question tells you about their background. If they say "I know React but not backend", start there. Ask only if you truly can't tell what level to aim for.
2. **Check for a guide.** Look in the [guide map](../../core/guides/README.md). If a guide covers the topic, read it, build on it, and link it so the reader can go deeper.
3. **Read the real code** if the question is about a specific system. Explain what it actually does, not what systems like it usually do.
4. **Teach in order.** Follow the [teaching order in Voice](../../profile/voice.md#teach-in-this-order): the simple model, why it exists, when you need it and when you don't, how it works, what goes wrong, and what you'd do. Go into scale only if the reader needs it.
5. **Ground it in one example.** Use one small, concrete case early. If you use an analogy, say where it stops working.
6. **Mark the claims.** Keep facts, common practice, and Tommy's preferences apart. For anything fast-moving, like pricing, vendor features, or AI tools, check a current primary source and give the date.

## Stop rules

- Match the length to the question. A short question can get a mental model, an example, and one caveat. It doesn't need eight headings.
- Never stop at "it depends". Name the two or three conditions it depends on.
- Don't decorate a durable concept with citations unless the reader asks. Cite fast-moving claims always.

## After

If you explained something worth keeping and no guide covers it, say so in one line: "This could be a guide: <title>." That's how the guide map grows from real questions.
