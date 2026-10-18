# Eval round 2026-10-18T022052

SWE OS at `9810350`, model `claude-opus-5-5`, 3 rep(s). Spent $7.18 API-equivalent (budget $15).

Scores are the mean of the rubric dimensions that applied, 0 to 3, graded blind by Claude (two graders per run, averaged) with SWE OS tells stripped. One rep per scenario is one noisy data point.

| Scenario            | A    | B    | B − A | Serious flaws A / B | Cost A / B    | Time A / B |
| ------------------- | ---- | ---- | ----- | ------------------- | ------------- | ---------- |
| duplicate-reminders | 1.64 | 2.47 | +0.83 | 0 / 0               | $0.21 / $0.71 | 54s / 184s |
| password-reset      | 2.72 | 2.75 | +0.03 | 0 / 0               | $0.11 / $0.24 | 34s / 52s  |
| connection-pooling  | 1.94 | 2.33 | +0.39 | 0 / 0               | $0.05 / $0.22 | 12s / 37s  |

**Average B − A:** 0.42 across 3 scenarios. The v0.1 bar is +0.5 with no new serious flaws, and the two-line fix staying close to A on time, cost, and length.

## Serious flaws

None.

Flagged by only one grader, so not counted:

- duplicate-reminders A1: No reproduction and no regression test. The agent was honest that Docker wasn't available, but it didn't build a Vitest test with a fake sender that stops after N sends, which needed no Postgres. The fix ships entirely unverified.

Raw transcripts, diffs, and per-dimension reasons are in `runs/` next to this file, which Git ignores.
