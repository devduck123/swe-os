# Eval round 2026-10-18T020358

SWE OS at `a052df2`, model `claude-opus-5-5`, 3 rep(s). Spent $8.68 API-equivalent (budget $15).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario            | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B  |
| ------------------- | ---- | ---- | ----- | ------------------- | ------------- | ----------- |
| duplicate-reminders | 1.92 | 2.22 | +0.31 | 0 / 0               | $0.34 / $0.69 | 108s / 189s |
| password-reset      | 2.78 | 2.69 | -0.08 | 0 / 0               | $0.12 / $0.24 | 38s / 58s   |
| connection-pooling  | 1.98 | 2.22 | +0.24 | 0 / 0               | $0.05 / $0.23 | 15s / 38s   |

**Average B − A:** 0.16 across 3 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
