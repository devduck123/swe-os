---
name: shape-project
description: Shape or challenge a new app idea or a big product direction, from the user's problem to a first build slice. Use before choosing a stack. Not for small, already-specified code changes.
metadata:
  title: Shape a project
  example: 'I want to build an AI meal planner for busy people. Use my SWE OS to shape it.'
---

# Shape a project

Turn an idea into a small, testable first version, and only then pick tools. Follow the [rules for every task](../README.md#rules-for-every-task).

## Steps

1. **Get the problem straight.** Answer these. Fill in what you can from context and mark guesses as assumptions. Ask the user only about answers that would change the direction.
   - Who exactly has this problem, and what do they do about it today?
   - What's painful about that workaround? If nothing is, there's no product.
   - What's the smallest change that would make their week better?
   - How will we know it worked? What result would make us stop?
2. **Challenge the idea.** Name the weakest assumption plainly. Propose the cheapest way to test it before building: a spreadsheet, a fake door, five conversations, a manual version. It's fine to conclude that the idea needs no software, or that the AI part isn't the valuable part.
3. **Design the smallest valuable journey.** How the user arrives, the one core action, and how they know it worked. Include the empty state and the main error state. Assume a phone and a keyboard user. List the tempting extras you're leaving out.
4. **Derive the requirements from that journey.** What data it stores, who it trusts, what it integrates with, its cost ceiling, and how much upkeep it can afford. Use the [concerns table](../../core/concerns/README.md#pick-the-concerns) to catch what's missing, like auth, personal data, or payments.
5. **Now pick the stack.** Start from [Defaults](../../profile/defaults.md) and anything the user already has. For each component, say why it's there. Say what you left out and what would make you add it. Check current pricing and limits from primary sources. Never invent free-tier numbers.
6. **Name the next step.** Usually it's the experiment from step 2 or the first build slice. If the user decides to build, create `AGENTS.md` and `PROJECT.md` from the [templates](../../templates/project/AGENTS.md) and record the decisions there.

## Stop rules

- No framework or vendor names before step 4.
- Don't wait on a long questionnaire. Give useful reasoning with stated assumptions, then ask the one or two questions that matter most.
- Shaping alone doesn't authorize deploying, signing up for services, or spending money.

## Report

Keep it to about a page. Use these headings, and drop any that don't apply:

```
## The problem
Who, the painful situation, today's workaround.

## What I'd challenge
The weakest assumption, and a cheap way to test it.

## Success and stop signals

## First version
The journey, step by step. What's out of scope.

## Requirements
Only the ones that change the build.

## Stack
Each component and why. What's left out, and what would make you add it.

## Next step
```
