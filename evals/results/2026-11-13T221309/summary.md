# Eval round 2026-11-13T221309

SWE OS at `abf4f28` (rerun: sprout-design, clipjar-page), model `claude-opus-5-5`, 3 rep(s). Spent $11.31 API-equivalent (budget $40).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario      | A    | B    | B − A | Serious flaws A / B | Blocked commands A / B | Cost A / B    | Time A / B  |
| ------------- | ---- | ---- | ----- | ------------------- | ---------------------- | ------------- | ----------- |
| sprout-design | 1.71 | 2.55 | +0.83 | 0 / 0               | 3.3 / 8.3              | $0.63 / $2.32 | 152s / 511s |
| clipjar-page  | 1.98 | 2.67 | +0.69 | 0 / 0               | 2.7 / 8.0              | $0.49 / $2.77 | 115s / 710s |

**Average B − A:** 0.76 across 2 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Blocked commands are what the harness refused, averaged per run. When one arm has many more, its Verification score may be about the harness, not the agent.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
