# Evals

Does SWE OS make an agent's work better? Each scenario runs twice: once without SWE OS (A), once with it (B).

There's a second test for the writing itself: the [learner test](learner/README.md) checks whether each track stop teaches its reader what it means to. And the [project eval](project/README.md) builds a whole app over one long session, with and without SWE OS, then installs, tests, and reviews both repos blind.

## Results so far

Six rounds in October 2026, on Claude Code with Opus 5.5, under a Max plan. Each summary is in [results/](results/). Rounds 4 and 6 are the full ones to compare:

|                                      | Round 4 (v0.2.0, 3 reps) | Round 6 (shorter reports, 2 reps) |
| ------------------------------------ | ------------------------ | --------------------------------- |
| Average B − A                        | +0.29                    | +0.30                             |
| Scenarios B wins / ties within noise | 10 / 1                   | 9 / 2                             |
| Serious flaws, B                     | 0                        | 0                                 |
| Verification B − A                   | +1.00                    | +1.07                             |
| Communication B − A                  | −0.15                    | +0.07                             |
| Median reply length, B               | 3,593 chars              | 2,847 chars                       |

- **Where SWE OS helps most:** verification, setup (start-project +0.83), debugging (+0.58), and keeping keys out of shipped code (extension-key +0.50).
- **Where it ties:** tasks Opus already does well alone, like the password reset review and pushback. A scores 2.3–2.7 there, so there's little room.
- **It costs about 2x** tokens and time.
- **It meets the bar** (below) in round 6. The older +0.5 average target was dropped: on tasks Opus already does well, there's little room to gain.

**Branches, priced designs, and project docs** (October 18): with rule 14, every SWE OS run on a Git repo worked on a branch, and none without it did. Across [two](results/2026-10-18T013419/summary.md) [rounds](results/2026-10-18T020348/summary.md), shaping is +0.51 and setup +0.59 (4 reps each), the feature +0.29, and the two-line fix −0.10. Graders docked a 10,000-user cost table for eight friends, so the math is now sized to the project.

**The learn walkthrough** (October 18, 3 reps each): the first round tied, B 2.64 vs A 2.61. Opus already walks a PR and corrects wrong answers well alone, and one B run skipped the corrections to write LEARNING.md. After the [learn](../skills/learn/SKILL.md) walkthrough became one outcome, corrections first, B scored 2.92 vs 2.53. See [the first](results/2026-10-18T014247/summary.md) and [second](results/2026-10-18T014837/summary.md) rounds.

**Trimming procedure from skills** (October 18, 3 reps): debug, review-change, and explain rewritten as outcomes only scored below the current versions run the same day: debug 2.22 vs 2.47, explain 2.22 vs 2.33, review 2.69 vs 2.75. Trimmed debug runs all missed the reminders that were never sent. The steps stay. See the [control](results/2026-10-18T022052/summary.md) and the [trimmed version](results/2026-10-18T020358/summary.md), which ran from an unmerged commit.

Rounds 1–3 found and fixed four harness bugs (B could read reviewer notes, a leading "Go ahead", unparseable grades, hidden checks). Rounds 2–5 drove the guidance changes in CHANGELOG: build first and ask at the end, shorter reports, and only open concerns.

## Run a round

The harness runs every scenario headless with Claude Code, once without SWE OS (A) and once with it (B). Then it grades each run blind and writes `evals/results/<date>/summary.md`. It uses whatever account `claude` is logged into, and stops at the budget, measured in API-equivalent dollars.

```sh
node evals/harness/run.mjs --dry-run                 # what would run, spends nothing
node evals/harness/run.mjs                           # every scenario, 1 rep, $50 budget
node evals/harness/run.mjs --only overhead,extension-key --reps 3 --budget 20
node evals/harness/run.mjs --grade evals/results/<date>   # regrade a past round
```

Run it from a normal terminal: Claude Code won't start inside another Claude Code session.

How it keeps the comparison fair:

- **Same setup for both arms.** Each run starts in a fresh temp copy of its fixture from `evals/fixtures/`, with the same model, tools, and flags. User settings, skills, plugins, and MCP servers are off for both (`--setting-sources project,local --disable-slash-commands --strict-mcp-config`).
- **One difference.** B's first message starts with "Use Tommy's SWE OS at <a snapshot of the current commit>…". A gets the task alone.
- **Nothing escapes the temp folder.** Pushing, `gh`, deploys, Docker, and the Supabase and EAS CLIs are denied in both arms.
- **The same answers for both.** When a scenario's starting state says "if asked", the harness answers once, the same way for both arms.
- **Graded blind.** The grader sees the task, the reviewer-only notes, the rubric, the commands the agent ran, its replies with SWE OS tells stripped, and the diff. It never sees which arm it's grading.

Raw transcripts and diffs stay in `runs/`, which Git ignores. Commit the round's `summary.md` and `round.json`.

One rep is one noisy data point. Repeat a scenario three times before trusting a difference. To test another client, like Codex, run a pair by hand: same fixture, same task, with and without the SWE OS line, and score it with the rubric below.

## Scenarios

The traps in these scenarios aren't written anywhere in SWE OS, so B can't win by recall. Each one has a harness entry in `evals/harness/scenarios.mjs` and, if it starts from code, a fixture in `evals/fixtures/`; `npm test` checks the prompts still match the scenario files. Before adding or editing one, grep `core/`, `skills/`, and `profile/` for its key phrases. If SWE OS later documents a trap, replace the scenario. Pushback and dependency are the exceptions: they test behavior SWE OS teaches directly. The extension key scenario tests a taught rule (anything shipped to the client is public) somewhere SWE OS never mentions: a Chrome extension. It replaced an Expo scenario once SWE OS documented `EXPO_PUBLIC_`.

| Scenario                                                          | Skill         |
| ----------------------------------------------------------------- | ------------- |
| [Two-line fix](scenarios/overhead.md)                             | build-feature |
| [Shape a group expense splitter](scenarios/expense-splitter.md)   | shape-project |
| [Start the expense app repo](scenarios/start-project.md)          | start-project |
| [Receipt photo gallery](scenarios/receipt-gallery.md)             | build-feature |
| [Key in the extension](scenarios/extension-key.md)                | build-feature |
| [Package that doesn't exist](scenarios/dependency.md)             | build-feature |
| [Reminders sent more than once](scenarios/duplicate-reminders.md) | debug         |
| [Password reset review](scenarios/password-reset.md)              | review-change |
| [Connection pooling](scenarios/connection-pooling.md)             | explain       |
| [Pushback, two variants](scenarios/pushback.md)                   | voice         |
| [Walk me through a PR](scenarios/learn-walkthrough.md)            | learn         |

## Rubric

Score each dimension 0 to 3. Mark N/A when it doesn't apply. Don't reward length.

| Dimension        | 0                        | 1                        | 2                                  | 3                                                   |
| ---------------- | ------------------------ | ------------------------ | ---------------------------------- | --------------------------------------------------- |
| Product judgment | Solves the wrong problem | Assumes the value        | Fits the stated outcome            | Challenges a key assumption and scopes a good slice |
| Completeness     | Core behavior fails      | Happy path only          | The states that matter are covered | Complete, with reasons for what's left out          |
| Simplicity       | Needless architecture    | Some avoidable machinery | Small solution that fits           | Removes complexity and keeps what matters           |
| Risk             | Misses a serious risk    | Names risks, doesn't act | Handles the risks that apply       | Failure behavior backed by evidence                 |
| Verification     | Fake or missing          | "Looks right"            | Real checks, actually run          | Targets failure paths, honest about limits          |
| Communication    | Misleading               | Generic or bloated       | Clear, with reasons and gaps       | Short, accurate, concrete                           |

**Cost.** Record tokens and wall time for each arm next to its scores. Don't average them in. A better score bought with a lot more time or tokens has to be weighed, not just counted: say whether it was worth it.

Record serious flaws (data loss, leaked secrets, an auth bypass, a fake verification claim) separately. They can't be averaged away.

**The bar:** B ties or beats A on every scenario, within noise (about ±0.1 with 2–3 reps). B has no serious flaws of its own. On the two-line fix, B stays close to A on time, cost, and length. And B clearly wins where SWE OS teaches something the model doesn't do by default: verification, setup, debugging, and secrets. An average lead alone isn't the bar, because on tasks the model already does well, there's little room to gain. Round 6 meets it.
