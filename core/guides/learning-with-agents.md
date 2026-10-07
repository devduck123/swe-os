---
title: Learning while agents write the code
description: Why delegating to AI can quietly stop you from learning, what the evidence says actually helps, and the small habits that keep you sharp with several agents running.
domain: ai
stage: improve
freshness: evolving
status: draft
track: 7
reviewed: 2026-10-06
concerns: []
next:
  link: /recipes/side-project-stack/
  label: 'Track 8: The side-project stack'
---

Agents make you faster at shipping. They don't make you better at engineering unless you do something on purpose, and you won't notice the difference, because finishing work feels exactly like learning.

## Delegating feels productive and teaches you very little

In a randomized study from Anthropic, developers learning a new async library either coded by hand or with an AI assistant. On the quiz afterward, the AI group scored 50% and the hand-coding group 67%. The biggest gap was debugging. The AI group wasn't even meaningfully faster.

The interesting part is how people used the AI. The ones who scored under 40% delegated: they asked for code, leaned on it more over time, and debugged by asking the AI again. The ones who scored 65% or higher used it differently. They generated code and then made sure they understood it, asked for code with explanations, or used it only for conceptual questions.

So the fix isn't using less AI. It's adding a comprehension step after the AI does the work.

There's a second problem: you can't feel it. In METR's study, experienced developers were 19% slower with AI on their own repos while believing they were about 20% faster. Your gut won't tell you you're falling behind, so the check has to come from outside your own judgment.

## When this matters, and when it doesn't

It matters for anything you'll have to debug, extend, or defend. That means your main projects, the areas you want to grow in, and especially the risky parts: auth, data, money, and models that take actions. If you can't explain how auth works in your own app, you can't review an agent's change to it.

It doesn't matter for throwaway prototypes, boilerplate, or tools you'll never touch again. Spend learning time where it compounds.

## What actually builds understanding

Three findings from learning science hold up across decades of studies:

- **Retrieval beats rereading.** Pulling an answer from memory, even when you get it wrong and then see the right one, sticks far better than reading the explanation again. In one classic study, students who practiced recall remembered 61% a week later, against 40% for those who reread.
- **Generating beats reading.** Things you produce yourself, like a prediction, an answer, or a piece of code, stick better than things you only read.
- **Spacing beats cramming.** Reviewing something a few times, with growing gaps in between, beats one long session.

Most of this research comes from classrooms and labs, not agent workflows, so applying it here is an informed bet. It's the best bet available, though, and it's cheap to try.

## What goes wrong

- **Quizzes in the middle of work.** They're annoying, so you'll turn them off. Checks belong at a natural pause, like before a merge, not mid-flow.
- **Mistaking agent memory for your own.** CLAUDE.md notes, learnings files, and retros make the agent smarter. They teach you nothing.
- **Recording coverage as learning.** "Read the PR walkthrough" isn't evidence you understood it. Answering a question about it is.
- **Walkthroughs without a check.** A great explanation you skim feels like understanding and isn't. Reading is the weakest form of learning on this list.

## What I'd do

With several agents running, your attention lands on the PR anyway, so that's where learning goes.

1. **Every agent leaves a "Worth learning" note** in its PR: one to three non-obvious decisions or concepts, or "nothing new". It costs nothing.
2. **Before merging anything non-trivial, take the walkthrough.** Read the change in the order of its decisions, then answer three to five questions from memory. It takes five to ten minutes. Geoffrey Litt uses the same rule: no review until he can pass the quiz. Simon Willison's version: don't commit code you couldn't explain to someone else.
3. **Once a week, run a short review** of past lessons. Five questions at most, ideally while agents are working.
4. **Once per feature, in an area you want to own, write the core yourself.** The agent does the routine parts and leaves you the decision that matters.

The [learn skill](../../skills/learn/SKILL.md) runs all four. It only writes a lesson down after you've shown you understand it.

## What changes on a team

Reviewing AI-written code takes the exact skills that delegating can erode. Teams feel this first. A reviewer who doesn't understand the code can't catch what's wrong with it, so an "explain it before you merge it" norm matters more as more of a team's code comes from agents.

## Sources

- [Shen and Tamkin, "How AI Impacts Skill Formation" (Anthropic, 2026)](https://arxiv.org/abs/2601.20245). A randomized study with 52 developers that measured understanding immediately after the task. The usage-pattern subgroups were small.
- [METR, "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity" (2025)](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
- [Roediger and Karpicke, "Test-Enhanced Learning" (2006)](https://doi.org/10.1111/j.1467-9280.2006.01693.x)
- [Dunlosky et al., "Improving Students' Learning With Effective Learning Techniques" (2013)](https://doi.org/10.1177/1529100612453266)
- [Geoffrey Litt, "Understanding is the new bottleneck" (2026)](https://geoffreylitt.com/2026/07/02/understanding-is-the-new-bottleneck.html)
- [Simon Willison on not committing code you can't explain (2025)](https://simonwillison.net/2025/Mar/19/vibe-coding/)
- Matt Pocock's [`teach` skill](https://github.com/mattpocock/skills), for evidence-gated learning records
