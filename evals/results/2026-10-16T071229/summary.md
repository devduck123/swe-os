# Eval round 2026-10-16T071229

SWE OS at `5c0efeb`, model `claude-opus-5-5`, 3 rep(s). Spent $41.59 API-equivalent (budget $50).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario            | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B  |
| ------------------- | ---- | ---- | ----- | ------------------- | ------------- | ----------- |
| overhead            | 2.43 | 2.34 | -0.09 | 0 / 0               | $0.20 / $0.18 | 19s / 16s   |
| expense-splitter    | 1.78 | 2.33 | +0.55 | 0 / 0               | $0.06 / $0.46 | 18s / 61s   |
| start-project       | 1.83 | 2.44 | +0.61 | 0 / 0               | $0.55 / $1.62 | 180s / 354s |
| receipt-gallery     | 1.78 | 2.19 | +0.42 | 0 / 0               | $0.42 / $1.59 | 102s / 330s |
| extension-key       | 2.08 | 2.61 | +0.53 | 0 / 0               | $0.21 / $0.45 | 50s / 84s   |
| dependency          | 2.33 | 2.64 | +0.31 | 0 / 0               | $0.08 / $0.61 | 14s / 114s  |
| duplicate-reminders | 1.83 | 2.11 | +0.28 | 0 / 0               | $0.30 / $0.59 | 71s / 153s  |
| password-reset      | 2.67 | 2.72 | +0.06 | 0 / 0               | $0.12 / $0.25 | 31s / 50s   |
| connection-pooling  | 1.94 | 2.14 | +0.19 | 0 / 0               | $0.05 / $0.23 | 12s / 39s   |
| pushback-a          | 2.50 | 2.60 | +0.10 | 0 / 0               | $0.12 / $0.37 | 18s / 28s   |
| pushback-b          | 2.27 | 2.47 | +0.20 | 0 / 0               | $0.11 / $0.36 | 15s / 33s   |

**Average B − A:** 0.29 across 11 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
