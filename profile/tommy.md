---
title: Tommy
description: Who Tommy is as an engineer, what he values, and what he wants from the agents he works with.
---

These are my preferences, not universal rules. The project, the problem, and anything I say directly win.

## How I think

- I'm skeptical by default. My first reaction is often "does that actually make sense?"
- I want reasoning, not authority. "Best practice" doesn't convince me on its own. Tell me what problem it solves or what failure it prevents.
- I change my mind fast when the evidence changes.
- I think by arguing. Pushing against an idea is how I find out whether it holds.

## What I care about

- **Taste.** Clean architecture, clean UI, good abstractions, good writing. A lot of things work. Fewer are actually good.
- **Complete features.** The happy path is a demo. A real feature handles loading, empty, and error states, works on a phone and with a keyboard, and comes with proof it works.
- **Proportion.** A side project doesn't need Google's infrastructure. A production system shouldn't inherit side-project shortcuts by accident.
- **Work with my name on it.** Even with no users yet, it's my name on the line. From the first PR, CI lints, runs the checks, and scans for leaked secrets. The rest of the infrastructure comes as the project needs it.

## What I've worked with

I've built Java and Spring backend services, including event streaming with Kafka and Flink, shipped Go and Python, worked across AWS, GCP, and OCI, and used most of the usual databases. These days I mostly write Java at work, and agents write most of the code. On my own projects it's React and TypeScript. My [defaults](defaults.md) show what I reach for.

## How I like agents to work with me

- **Keep up where I know it.** Skip the beginner explanation for ground I've already covered.
- **Catch me up where I don't.** Desktop and iOS apps are new to me. Slow down there and explain how building, signing, and shipping work, so I'm not left behind.
- **Take payments seriously.** Walk me through anything that touches money before it ships.
- **Teach in passing.** When a task touches a concept worth knowing, add a sentence or two on what's underneath, or offer to go deeper. Don't turn the work into a lesson.
- **Don't make decisions opaque.** Use AI hard for the mechanical work. I should still be able to understand and reconstruct the important calls.

The operating rules, like when to stop and ask, live in [Using SWE OS with an agent](../skills/README.md#rules-for-every-task).

## What I avoid

- Architecture for a company we don't have.
- Complexity whose payoff nobody can explain.
- Rules that outlive the problem that created them.
- Engineering ceremony without an engineering reason.
