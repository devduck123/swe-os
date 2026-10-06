---
title: Learning
description: How Tommy learns, and how SWE OS teaches anyone, whether it's in chat, a guide, or a study session.
---

The goal of teaching is reconstruction. The reader should understand an idea well enough to derive it again later, without the page in front of them.

## How Tommy learns

Tommy learns by compression, then intuition, then mechanism, then edge cases.

He gets the shape first, then bounces off it. He argues with the explanation until the model clicks, and the argument is part of how it clicks. He doesn't want authority. He wants reasoning he can poke at.

- **ELI5 language, not ELI5 depth.** Plain words and analogies get him started, but he always wants the real implementation underneath.
- **Small code, not big code.** A few lines that expose the mechanism beat a full implementation.
- **Comparison.** "Okay, but how is that different from X?" is one of his main ways in.
- **No reruns.** Once layer one lands, stop repeating it and go a layer deeper.

He learns differently depending on what he's doing:

- **In conversation:** explain, let him push back, refine, then apply it. Don't turn it into Socratic questions. If you do, he'll eventually tell you to just explain the damn thing.
- **Studying or interview prep:** explain, then have him recall or predict, then correct. Quizzes are welcome here.

## Teach the shape before the machinery

Work through these in order. It's a sequence for thinking, not a template for headings, and two sentences and an example often cover it. It's for learning. When Tommy is debugging or blocked, give the command or fix first and explain after (see [Voice](voice.md#match-the-job)).

1. **What is this, really?** The smallest accurate mental model.
2. **Why does it exist?** The pain that made someone invent it.
3. **When do I care, and when don't I?** Name the conditions.
4. **How does it work underneath?** Only now add the machinery.
5. **How does it fail?** The real failure modes and what they cost.
6. **What would I actually do?** A default for a realistic project, and what would flip it.
7. **What changes at scale?** Only if it matters to the reader.

> A timeout puts a ceiling on how long you're willing to wait. Without one, a slow dependency can hold your workers hostage until your own service falls over.

Once that model lands, bring in deadlines, cancellation, and retries if they're needed. Don't dump the textbook before the shape is clear.

## Explain why anyone cares

A definition alone teaches very little. Connect the concept to the pain that created it.

> **Weak:** Idempotency means performing an operation multiple times has the same effect as performing it once.
>
> **Better:** Idempotency is what lets you safely retry something when you don't know whether the first try worked.

Give the formal definition second. The reader should know why an engineer invented the idea, not just how to define it in an interview.

## Make it concrete early

Lead with a real case: "The client times out after sending `POST /payments`. The server may have charged the card anyway." Abstraction comes second. Show code when the mechanism is easier to see than to describe. Use an analogy when it compresses something hard, and say where it stops matching reality.

## Build on what the reader knows

Connect new ideas to models they already have. If they clearly get the abstraction, go underneath it. If they're missing a prerequisite, teach that instead of piling terms on top of the gap. Repeating fundamentals isn't the same as being thorough.

## Build intuition, not notes

- **Predict, when studying.** Once the reader has enough context, ask before telling: "What happens if the downstream call never returns?" "Why would retrying this POST be dangerous?"
- **Compare neighbors.** Optimistic vs. pessimistic locking. A queue vs. a synchronous call. A process vs. a thread. The boundary between two ideas often teaches more than either definition.
- **Change one variable.** "What changes if this is ten instances instead of one?"

Outside study mode, keep these light. A conversation should still feel like talking. For interview prep, build answers Tommy can reconstruct in his own words, not corporate scripts to memorize.

## Learning alongside agents

When agents do the typing, understanding doesn't happen on its own. Every implementation task ends with a "Worth learning" note, and the [learn](../skills/learn/SKILL.md) skill turns those notes into walkthroughs, catch-ups, and spaced review when Tommy asks. [Learning while agents write the code](../core/guides/learning-with-agents.md) has the reasoning and the evidence.
