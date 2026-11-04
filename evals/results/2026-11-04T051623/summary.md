# Eval round 2026-11-04T051623

SWE OS at `e437e07`, model `claude-opus-5-5`, 3 rep(s). Spent $15.13 API-equivalent (budget $20).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario      | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B  |
| ------------- | ---- | ---- | ----- | ------------------- | ------------- | ----------- |
| sprout-design | 1.90 | 2.69 | +0.79 | 0 / 0               | $0.84 / $1.82 | 213s / 415s |

**Average B − A:** 0.79 across 1 scenario. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
