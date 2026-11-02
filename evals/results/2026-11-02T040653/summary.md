# Eval round 2026-11-02T040653

SWE OS at `3e84784`, model `claude-opus-5-5`, 2 rep(s). Spent $6.13 API-equivalent (budget $14).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario           | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B  |
| ------------------ | ---- | ---- | ----- | ------------------- | ------------- | ----------- |
| receipt-gallery    | 1.88 | 2.21 | +0.33 | 0 / 0               | $0.44 / $1.37 | 109s / 279s |
| connection-pooling | 1.83 | 2.17 | +0.33 | 0 / 0               | $0.05 / $0.20 | 9s / 40s    |

**Average B − A:** 0.33 across 2 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
