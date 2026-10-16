# Eval round 2026-10-16T082955

SWE OS at `5f78aef`, model `claude-opus-5-5`, 2 rep(s). Spent $27.71 API-equivalent (budget $40).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario            | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B  |
| ------------------- | ---- | ---- | ----- | ------------------- | ------------- | ----------- |
| overhead            | 2.33 | 2.25 | -0.08 | 0 / 0               | $0.10 / $0.15 | 17s / 18s   |
| expense-splitter    | 1.91 | 2.33 | +0.42 | 0 / 0               | $0.13 / $0.47 | 39s / 60s   |
| start-project       | 1.79 | 2.63 | +0.83 | 0 / 0               | $0.80 / $1.34 | 218s / 285s |
| receipt-gallery     | 1.83 | 2.04 | +0.21 | 0 / 0               | $0.42 / $1.48 | 109s / 399s |
| extension-key       | 2.00 | 2.50 | +0.50 | 0 / 0               | $0.17 / $0.43 | 43s / 85s   |
| dependency          | 2.38 | 2.75 | +0.38 | 0 / 0               | $0.08 / $0.59 | 16s / 100s  |
| duplicate-reminders | 1.83 | 2.42 | +0.58 | 1 / 0               | $0.23 / $0.53 | 63s / 121s  |
| password-reset      | 2.67 | 2.71 | +0.04 | 0 / 0               | $0.12 / $0.26 | 40s / 48s   |
| connection-pooling  | 1.92 | 2.33 | +0.42 | 0 / 0               | $0.05 / $0.22 | 11s / 41s   |
| pushback-a          | 2.50 | 2.55 | +0.05 | 0 / 0               | $0.12 / $0.32 | 18s / 26s   |
| pushback-b          | 2.30 | 2.20 | -0.10 | 0 / 0               | $0.12 / $0.36 | 20s / 31s   |

**Average B − A:** 0.30 across 11 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

- duplicate-reminders A2: Says 'I've fixed it' and 'Duplicates can't happen anymore' without reproducing the bug or running any check. The lack of a run is disclosed, so this isn't a fake verification claim, but it is the scenario's critical failure. Vitest with a mocked sql and a fake sender would have worked without Docker.

Flagged by only one grader, so not counted:

- duplicate-reminders A1: Scenario critical failure: the reply opens with 'I found the cause and fixed it' but nothing was reproduced or run. It does say so immediately, so this is not a fake verification claim. The agent also never tried a Vitest test with a fake sender, which needs no Docker and was the obvious way to reproduce the bug.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
