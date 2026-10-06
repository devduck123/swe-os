---
title: Writing
description: Prose rules for anything SWE OS writes down, from guides and skills to PR descriptions.
---

These rules apply to pages, skills, docs, commit messages, and PR descriptions. They serve the [voice](voice.md): talk like a normal person who knows exactly what they mean.

## Use the plain word

Use contractions. Write "use", not "utilize". Write "help", not "facilitate". Write "this breaks because…", not "this may result in undesirable behavior due to…".

Cut words that perform instead of communicate. "In order to" is "to". "It is important to note that", "generally speaking", and "from a software engineering perspective" usually disappear entirely. If a sentence could appear unchanged in a consulting deck, rewrite it.

## Name the mechanism

Vague claims sound smart and teach nothing. Make the reader see the gears.

| Instead of                            | Write                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| This makes the system more robust.    | Each worker has a bounded queue, so one slow dependency can't take every thread.               |
| This improves scalability.            | The workers are stateless, so you can add more as traffic grows.                               |
| This is safer.                        | The unique constraint makes a duplicate impossible, even when two requests race.               |
| This violates separation of concerns. | This controller now validates, saves, and calls the API. Changing one means testing all three. |

Words like "robust", "scalable", and "flexible" are fine when you say what they mean. Kill slop, not vocabulary.

## Make sentences easy to read once

- One idea per sentence. Split a sentence the reader has to read twice. Keep a long sentence that carries a condition or a consequence.
- Use the active voice: "The server rejects the request", not "The request is rejected".
- Put the condition first: "If the write fails, retry once."
- Make every "it" and "this" point at one obvious thing. Repeat the noun when in doubt.

## Don't sound like an AI

Leave out:

- "delve", "crucial", "seamless", "comprehensive", "powerful", "leverage", "landscape", "in today's world", "it's worth noting"
- "Not only X, but also Y" and other fake dramatic contrasts
- lists forced into threes
- intros that restate the question, and summaries that restate the answer
- "Key takeaway" sections and closing pep talks
- praise for the question instead of an answer to it

## Let structure serve the thought

Use prose when ideas connect. Use bullets for steps, options, or anything the reader scans. Use a table when a relationship is easier to see in a grid. Don't force every answer into TL;DR, Why, How, Pros, Cons.

Headings say the point: "Retry only what is safe to repeat", not "Retries". Someone reading only the headings should still learn something. Use sentence case. Bold a lead-in that names an item, and little else.

## Pick the kind of page first

A guide explains (opinions welcome). A how-to gets someone to a goal (steps only). Reference is for lookup (dry and complete). Don't mix them on one page. Split and link instead.

These rules borrow from poteto's `unslop` and `technical-writing` skills in [pstack](https://github.com/cursor/plugins/tree/main/pstack), the Google developer documentation style guide, and Diátaxis.
