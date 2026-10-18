# Eval round 2026-10-18T014247

SWE OS at `f912e75`, model `claude-opus-5-5`, 3 rep(s). Spent $3.70 API-equivalent (budget $10).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario          | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B |
| ----------------- | ---- | ---- | ----- | ------------------- | ------------- | ---------- |
| learn-walkthrough | 2.61 | 2.64 | +0.03 | 0 / 0               | $0.34 / $0.60 | 48s / 68s  |

**Average B − A:** 0.03 across 1 scenario. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Flagged by only one grader, so not counted:

- learn-walkthrough B2: The LEARNING.md record says both misses were 'corrected', but the Turn 2 reply never corrects them. It never says that ON CONFLICT DO UPDATE makes both tabs return 200, or that closes_at > now() in SQL is what closes voting and the disabled button is only a hint. The record claims teaching that didn't happen. This isn't data loss, a leaked secret, or an auth bypass, but the record is inaccurate.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
