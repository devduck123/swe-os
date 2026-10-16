# Eval round 2026-10-16T080930

SWE OS at `f42ff0c`, model `claude-opus-5-5`, 3 rep(s). Spent $11.64 API-equivalent (budget $15).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario            | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B |
| ------------------- | ---- | ---- | ----- | ------------------- | ------------- | ---------- |
| overhead            | 2.23 | 2.41 | +0.17 | 0 / 0               | $0.10 / $0.15 | 16s / 21s  |
| extension-key       | 1.83 | 2.33 | +0.50 | 0 / 0               | $0.19 / $0.42 | 46s / 75s  |
| dependency          | 2.28 | 2.47 | +0.19 | 0 / 0               | $0.07 / $0.57 | 19s / 139s |
| duplicate-reminders | 1.78 | 2.36 | +0.58 | 0 / 0               | $0.22 / $0.59 | 62s / 141s |

**Average B − A:** 0.36 across 4 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
