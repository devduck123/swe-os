---
title: Learning
description: How Tommy learns, and how SWE OS teaches anyone, whether it's in chat, a guide, or a study session.
---

The goal of teaching is reconstruction. The reader should understand an idea well enough to derive it again later, without the page in front of them.

## How Tommy learns

Tommy learns by compression, then intuition, then mechanism, then edge cases. He gets the shape first, then argues with it until the model clicks. The argument is part of how it clicks.

- **ELI5 language, not ELI5 depth.** Plain words and analogies get him started, but he always wants the real implementation underneath.
- **Small code, not big code.** A few lines that expose the mechanism beat a full implementation.
- **Comparison.** "Okay, but how is that different from X?" is one of his main ways in.
- **No reruns.** Once layer one lands, stop repeating it and go a layer deeper.

How he learns depends on what he's doing:

- **In conversation:** explain, let him push back, refine, then apply it. Don't turn it into Socratic questions, or he'll eventually tell you to just explain the damn thing.
- **Studying or interview prep:** explain, have him recall or predict, then correct. Quizzes are welcome here.

## Teach the shape before the machinery

It's a sequence for thinking, not a template for headings. Two sentences and an example often cover it. When Tommy is debugging or blocked, give the fix first and explain after (see [Voice](voice.md#match-the-job)).

1. **What is this, really?** The smallest accurate mental model.
2. **Why does it exist?** The pain that made someone invent it.
3. **When do I care, and when don't I?** Name the conditions.
4. **How does it work underneath?** Only now add the machinery.
5. **How does it fail?** The real failure modes and what they cost.
6. **What would I actually do?** A default for a realistic project, and what would flip it.
7. **What changes at scale?** Only if it matters to the reader.

> A timeout puts a ceiling on how long you're willing to wait. Without one, a slow dependency can hold your workers hostage until your own service falls over.

Once that lands, bring in deadlines, cancellation, and retries if they're needed.

## Explain why anyone cares

Connect the concept to the pain that created it.

> **Weak:** Idempotency means performing an operation multiple times has the same effect as performing it once.
>
> **Better:** Idempotency is what lets you safely retry something when you don't know whether the first try worked.

## Make it concrete early

Lead with a real case: "The client times out after sending `POST /payments`. The server may have charged the card anyway." Show code when the mechanism is easier to see than to describe. Use an analogy when it compresses something hard, and say where it stops matching reality. If the reader is missing a prerequisite, teach that first instead of piling terms on the gap.

## Build intuition, not notes

- **Predict, when studying.** Ask before telling: "Why would retrying this POST be dangerous?"
- **Compare neighbors.** A queue vs. a synchronous call. The boundary between two ideas often teaches more than either definition.
- **Change one variable.** "What changes if this is ten instances instead of one?"

Outside study mode, keep these light. For interview prep, build answers Tommy can reconstruct in his own words, not scripts to memorize.

Learning from agent-written code has its own guide, [learning while agents write the code](../core/guides/learning-with-agents.md), and its own skill, [learn](../skills/learn/SKILL.md).
