---
title: Learning while agents write the code
description: Why delegating to AI can quietly stop you from learning, what the evidence says actually helps, and the small habits that keep you sharp with several agents running.
domain: ai
stage: improve
freshness: evolving
status: reviewed
track: 21
reviewed: 2026-10-06
concerns: []
next:
  link: /recipes/side-project-stack/
  label: 'Track 22: The side-project stack'
---

Agents make you faster at shipping. They don't make you better at engineering unless you do something on purpose, and you won't notice the difference, because finishing work feels exactly like learning.

## Delegating feels productive and teaches you very little

In a randomized study from Anthropic, developers learning a new async library either coded by hand or with an AI assistant. On the quiz afterward, the AI group scored 50% and the hand-coding group 67%. The biggest gap was debugging. The AI group wasn't even meaningfully faster.

The interesting part is how people used the AI. The ones who scored under 40% delegated: they asked for code, leaned on it more over time, and debugged by asking the AI again. The ones who scored 65% or higher generated code and then made sure they understood it, asked for code with explanations, or used the AI only for conceptual questions.

So the fix isn't using less AI. It's adding a comprehension step after the AI does the work.

There's a second problem: you can't feel it. In METR's study, experienced developers took 19% longer with AI on their own repos, yet afterward believed AI had made them about 20% faster. Your gut won't tell you you're falling behind, so the check has to come from outside your own judgment.

## Spend learning time where it compounds

Learning matters for anything you'll have to debug, extend, or defend: your main projects, the areas you want to grow in, and especially the risky parts, like auth, data, money, and models that take actions. If you can't explain how auth works in your own app, you can't review an agent's change to it.

It doesn't matter for throwaway prototypes, boilerplate, or tools you'll never touch again.

## What actually builds understanding

Three findings from learning science hold up across decades of studies:

- **Retrieval beats rereading.** Pulling an answer from memory, even when you get it wrong and then see the right one, sticks far better than reading the explanation again. In one classic study, students who practiced recall remembered 61% a week later, against 40% for those who reread.
- **Generating beats reading.** Things you produce yourself, like a prediction, an answer, or a piece of code, stick better than things you only read.
- **Spacing beats cramming.** Coming back to something a few times, with gaps in between, beats one long session.

This research comes from classrooms and labs, not agent workflows, so applying it here is a bet. It's a cheap one.

## What the vibe-coded version misses

- **Reading the agent's explanation and calling it learned.** The first time you debug that code alone, you start from zero.
- **Merging code you can't explain.** The first incident has you debugging a system you never understood.
- **Trusting your sense of progress.** You feel faster while your debugging skills erode, and find out when something breaks.

## What I'd do

With several agents running, your attention lands on the PR anyway, so that's where learning goes.

1. **Every agent leaves a "Worth learning" note and a short quiz** in its PR. The agent writes both; you answer.
2. **Before merging anything non-trivial, answer the quiz from memory,** then check the answers. It takes five to ten minutes. Geoffrey Litt's rule is that he won't [send code to others until he can pass the quiz](https://geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck.html). Simon Willison's version: don't commit code you couldn't explain to someone else.
3. **Once a week, catch up.** Group the week's "Worth learning" notes, learn the one or two that matter most, and finish with one recall question from an older lesson. That's the spacing, without a review schedule to maintain.
4. **Once per feature, in an area you want to own, write the core yourself.** The agent does the routine parts and leaves you the decision that matters.

For step 1, paste this into your `AGENTS.md` or `CLAUDE.md` so every agent sees it. Notice that the answers stay hidden until you've tried:

```text
When you open a PR, add a "Worth learning" section to its description:
one to three decisions or concepts in this change I probably don't know
yet, two sentences each, or "Nothing new" if there aren't any.

Then add 3–5 questions that check I understand this change. Ask me to
predict what the code does in a specific case, explain why you chose one
approach over another, or say what breaks if a given line is removed.
Put the answers in a collapsed <details> block below the questions.
```

The [learn skill](../../skills/learn/SKILL.md) runs the PR quiz, the weekly catch-up, and writing the core yourself. It only writes a lesson down after you've shown you understand it.

## Sources

- [Shen and Tamkin, "How AI Impacts Skill Formation" (Anthropic, 2026)](https://arxiv.org/abs/2601.20245). A randomized study with 52 developers that measured understanding immediately after the task. The usage-pattern subgroups were small.
- [METR, "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity" (2025)](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
- [Roediger and Karpicke, "Test-Enhanced Learning" (2006)](https://doi.org/10.1111/j.1467-9280.2006.01693.x)
- [Dunlosky et al., "Improving Students' Learning With Effective Learning Techniques" (2013)](https://doi.org/10.1177/1529100612453266)
- [Geoffrey Litt, "Understanding is the new bottleneck" (2026)](https://geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck.html)
- [Simon Willison on not committing code you can't explain (2025)](https://simonwillison.net/2025/Mar/19/vibe-coding/)
- Matt Pocock's [`teach` skill](https://github.com/mattpocock/skills), for evidence-gated learning records
