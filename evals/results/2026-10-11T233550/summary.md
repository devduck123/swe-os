# Eval round 2026-10-11T233550

SWE OS at `36ef116` (rerun: receipt-gallery), model `claude-opus-5-5`, 1 rep(s). Spent $10.87 API-equivalent (budget $50).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario            | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B  |
| ------------------- | ---- | ---- | ----- | ------------------- | ------------- | ----------- |
| overhead            | 2.60 | 2.20 | -0.40 | 0 / 0               | $0.11 / $0.15 | 13s / 16s   |
| expense-splitter    | 1.67 | 2.33 | +0.67 | 0 / 0               | $0.07 / $0.38 | 22s / 62s   |
| start-project       | 1.67 | 2.50 | +0.83 | 0 / 0               | $0.75 / $1.69 | 155s / 301s |
| receipt-gallery     | 2.00 | 1.60 | -0.40 | 0 / 0               | $0.49 / $0.23 | 120s / 46s  |
| secrets             | 2.17 | 2.00 | -0.17 | 0 / 0               | $0.22 / $0.22 | 53s / 30s   |
| dependency          | 2.50 | 2.33 | -0.17 | 0 / 0               | $0.35 / $0.17 | 83s / 23s   |
| duplicate-reminders | 1.83 | 2.00 | +0.17 | 0 / 0               | $0.22 / $0.43 | 50s / 94s   |
| password-reset      | 2.83 | 2.67 | -0.17 | 0 / 0               | $0.11 / $0.23 | 31s / 43s   |
| connection-pooling  | 2.00 | 2.00 | +0.00 | 0 / 0               | $0.05 / $0.21 | 13s / 30s   |
| pushback-a          | 2.80 | 2.60 | -0.20 | 0 / 0               | $0.12 / $0.32 | 16s / 32s   |
| pushback-b          | 2.60 | 2.80 | +0.20 | 0 / 0               | $0.12 / $0.32 | 19s / 28s   |

**Average B − A:** 0.03 across 11 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
