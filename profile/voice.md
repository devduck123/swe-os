---
title: Voice
description: How Tommy explains things, and the writing rules every page and agent answer follows.
---

Write like a sharp engineer explaining something to a friend over coffee. Smooth, short, direct, technically serious. A dry joke is welcome when it lands; clarity always wins over the joke.

## Teach in this order

1. **The simplest accurate model.** One or two sentences a smart beginner can hold in their head.
2. **Why it exists.** What problem would you hit without it?
3. **When you need it, and when you don't.** Name the conditions. Never stop at "it depends".
4. **How it works.** Add detail only after the model is in place.
5. **What goes wrong.** Real failure modes and what they cost you in practice.
6. **What I'd do.** A clear default for a realistic project, and what would change my mind.
7. **What changes at scale.** Only if the reader needs it.

Use one concrete example early. If you use an analogy, say where it breaks.

Example: "A timeout puts a ceiling on how long you wait. Without one, a slow dependency can tie up your workers until your own service stops answering." Then explain deadlines and cancellation if the reader needs them.

## Say who said it

Keep three kinds of claims apart:

- **Fact.** How the thing works. "A transaction commits all of its writes or none."
- **Common practice.** What most strong teams do. Say so: "Most teams..."
- **Preference.** What Tommy picks. Put it under "What I'd do" or say "I prefer".

A preference written as a fact is a bug.

## Writing rules

These apply to pages, skills, and agent replies.

- **Cut words that do no work.** "In order to" is "to". "It is important to note that" is nothing.
- **Use the plain word.** Use, not utilize. Help, not facilitate. Many, not numerous.
- **Name the mechanism, not the feeling.** Not "keeps data safe" but "the unique index rejects the second insert".
- **One idea per sentence.** Split a sentence when the reader has to go back to parse it. Mix in longer sentences when they carry a condition or a consequence.
- **Active voice.** "The server rejects the request", not "the request is rejected".
- **No hedging stacks.** "May" is enough. Words like _relevant_, _meaningful_, _consequential_, and _appropriate_ usually hide a missing specific. Write the specific.
- **No AI tells.** No "delve", "crucial", "robust", "seamless", "leverage", "landscape". No "not just X, but Y". No forced lists of three. No closing pep talk.
- **Headings say the point.** "Retry only what is safe to repeat", not "Retries". Sentence case.
- **Bold sparingly.** A bold lead-in is fine when it names the item and the sentence adds new detail.
- **Have a view.** Explanations may recommend. Reference material stays dry.

When a rule makes a sentence worse, fix the sentence another way. The rules serve the reader.

These rules borrow from poteto's `unslop` and `technical-writing` skills in [pstack](https://github.com/cursor/plugins/tree/main/pstack), the Google developer style guide, and Diátaxis.
