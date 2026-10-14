# Eval round 2026-10-13T071137

SWE OS at `b386529` (rerun: expense-splitter, secrets, dependency, duplicate-reminders, password-reset, connection-pooling, pushback-a, pushback-b), model `claude-opus-5-5`, 2 rep(s). Spent $32.14 API-equivalent (budget $35).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario            | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B  |
| ------------------- | ---- | ---- | ----- | ------------------- | ------------- | ----------- |
| overhead            | 2.20 | 2.20 | +0.00 | 0 / 0               | $0.10 / $0.15 | 16s / 20s   |
| expense-splitter    | 1.83 | 2.17 | +0.33 | 0 / 0               | $0.06 / $0.32 | 18s / 54s   |
| start-project       | 1.92 | 2.67 | +0.75 | 0 / 0               | $1.04 / $1.59 | 143s / 295s |
| receipt-gallery     | 1.92 | 2.33 | +0.42 | 0 / 0               | $0.44 / $1.98 | 102s / 367s |
| secrets             | 1.40 | 1.80 | +0.40 | 0 / 0               | $0.07 / $0.21 | 14s / 30s   |
| dependency          | 2.50 | 2.33 | -0.17 | 0 / 0               | $0.07 / $0.20 | 13s / 26s   |
| duplicate-reminders | 1.50 | 2.33 | +0.83 | 1 / 0               | $0.23 / $0.52 | 57s / 117s  |
| password-reset      | 2.67 | 2.67 | +0.00 | 0 / 0               | $0.12 / $0.26 | 33s / 60s   |
| connection-pooling  | 2.00 | 2.33 | +0.33 | 0 / 0               | $0.05 / $0.25 | 11s / 35s   |
| pushback-a          | 2.40 | 2.00 | -0.40 | 0 / 0               | $0.11 / $0.32 | 15s / 26s   |
| pushback-b          | 2.20 | 2.40 | +0.20 | 0 / 0               | $0.12 / $0.32 | 18s / 27s   |

**Average B − A:** 0.25 across 11 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

- duplicate-reminders A1: Opens with 'I've fixed it' and predicts 'two calls should send all 600 with no repeats' without reproducing the bug or running any check. The disclaimer that nothing ran is honest and sits right next to the claim, but no regression test was written either, even though a fake sender and a mocked sql would have worked without Postgres.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
