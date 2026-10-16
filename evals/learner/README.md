# Learner test

Does each stop on the track teach its reader what it means to? Claude reads every stop in character as the reader the track is for, then reports what it would remember, where it got lost, which words it didn't know, and whether it could act on "What I'd do".

The reader is in [reader.md](reader.md): self-taught, ships Next.js and Supabase apps with AI agents, reads on a phone, and can't define index, transaction, race, or idempotency. Collapsed "Going deeper" blocks and Sources are removed before reading, because this reader skips them.

## Run it

```sh
node evals/learner/run.mjs                    # every stop, 2 readers each
node evals/learner/run.mjs --only 5,6 --readers 3
```

Run it from a normal terminal. It uses whatever account the `claude` CLI is logged into, and stops on a failed login or a usage limit. Each run writes `results/<date>/summary.md` and one JSON file per stop with every reader's answers.

## How to read the numbers

- **Match** is the most useful number: whether the reader's one-sentence takeaway is what the stop's opening says it teaches.
- **Clarity and usefulness** (1–5) are noisy. A fresh reader finds fresh things to stumble on, so compare runs with the same number of readers, and look at the quotes in "Lost at" more than the scores.

## Results so far

October 2026, before this harness existed: four agents read the stops by hand, using the same reader. After the edits in PR #16, four different agents read them again.

|                                      | Before         | After    |
| ------------------------------------ | -------------- | -------- |
| Takeaway matched the intended lesson | 15 of 22 stops | 20 of 22 |
| Usefulness                           | 4.6            | 4.7      |
| Clarity                              | 3.7            | 3.7      |

What still holds clarity back: the code examples use Drizzle and Neon while this reader is on Supabase, and every reader skims "What the vibe-coded version misses" because it repeats the body. What readers liked most: the opening failure stories, a "Notice…" sentence before each code block, and copyable "Ask your agent" prompts.
