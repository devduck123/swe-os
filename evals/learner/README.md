# Learner test

Does each stop on the track teach its reader what it means to? Claude reads every stop in character as the reader the track is for, then reports what it would remember, where it got lost, which words it didn't know, and whether it could act on "How I do it".

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

Rounds 1 and 2 were run by hand before this harness existed (four agents, one reader per stop). Round 3 used the harness with two readers per stop, so its match rate counts readers, not stops.

| Round | What changed before it                                               | Takeaway matched | Clarity | Usefulness |
| ----- | -------------------------------------------------------------------- | ---------------- | ------- | ---------- |
| 1     | (baseline)                                                           | 15 of 22 stops   | 3.7     | 4.6        |
| 2     | glosses, Going deeper blocks, Supabase lines, actionable What I'd do | 20 of 22 stops   | 3.7     | 4.7        |
| 3     | plain SQL first, "Before you ship, check"                            | 40 of 44 readers | 3.9     | 4.4        |

After round 3, a targeted pass on the two lowest stops moved the recipe from 3.0 to 3.5; stop 8 stayed at 3.5. What readers liked most, every round: the opening failure stories, a "Notice…" sentence before each code block, and copyable "Ask your agent" prompts. Summaries are in [results/](results/).
