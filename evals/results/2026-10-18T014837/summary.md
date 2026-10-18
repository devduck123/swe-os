# Eval round 2026-10-18T014837

SWE OS at `a7dabd4`, model `claude-opus-5-5`, 3 rep(s). Spent $3.78 API-equivalent (budget $10).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario          | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B |
| ----------------- | ---- | ---- | ----- | ------------------- | ------------- | ---------- |
| learn-walkthrough | 2.53 | 2.92 | +0.39 | 0 / 0               | $0.37 / $0.60 | 55s / 74s  |

**Average B − A:** 0.39 across 1 scenario. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
