# Eval round 2026-11-12T224127

SWE OS at `7f8c788` (rerun: clipjar-page, clipjar-page, clipjar-page), model `claude-opus-5-5`, 3 rep(s). Spent $42.58 API-equivalent (budget $35).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario      | A    | B    | B − A | Serious flaws A / B | Blocked commands A / B | Cost A / B    | Time A / B  |
| ------------- | ---- | ---- | ----- | ------------------- | ---------------------- | ------------- | ----------- |
| sprout-design | 1.76 | 2.83 | +1.07 | 0 / 0               | 4.3 / 8.3              | $0.82 / $2.62 | 195s / 685s |
| clipjar-page  | 2.00 | 2.38 | +0.38 | 0 / 0               | 3.0 / 11.3             | $0.52 / $5.20 | 139s / 999s |

**Average B − A:** 0.73 across 2 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Blocked commands are what the harness refused, averaged per run. When one arm has many more, its Verification score may be about the harness, not the agent.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
