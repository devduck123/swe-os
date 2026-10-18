# Eval round 2026-10-18T020348

SWE OS at `9810350`, model `claude-opus-5-5`, 2 rep(s). Spent $8.98 API-equivalent (budget $12).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario         | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B  |
| ---------------- | ---- | ---- | ----- | ------------------- | ------------- | ----------- |
| expense-splitter | 1.90 | 2.19 | +0.29 | 0 / 0               | $0.13 / $0.34 | 31s / 61s   |
| start-project    | 1.83 | 2.29 | +0.46 | 0 / 0               | $0.60 / $1.74 | 154s / 320s |

**Average B − A:** 0.37 across 2 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
