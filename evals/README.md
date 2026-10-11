# Evals

Does SWE OS make an agent's work better? Each scenario runs twice: once without SWE OS (A), once with it (B).

**Status: not run yet.**

## Run a round

The harness runs every scenario headless with Claude Code, once without SWE OS (A) and once with it (B). Then it grades each run blind and writes `evals/results/<date>/summary.md`. It uses whatever account `claude` is logged into, and stops at the budget, measured in API-equivalent dollars.

```sh
node evals/harness/run.mjs --dry-run                 # what would run, spends nothing
node evals/harness/run.mjs                           # every scenario, 1 rep, $50 budget
node evals/harness/run.mjs --only overhead,secrets --reps 3 --budget 20
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

The traps in these scenarios aren't written anywhere in SWE OS, so B can't win by recall. Each one has a harness entry in `evals/harness/scenarios.mjs` and, if it starts from code, a fixture in `evals/fixtures/`; `npm test` checks the prompts still match the scenario files. Before adding or editing one, grep `core/`, `skills/`, and `profile/` for its key phrases. If SWE OS later documents a trap, replace the scenario. Pushback, secrets, and dependency are the exceptions: they test behavior SWE OS teaches directly.

| Scenario                                                          | Skill         |
| ----------------------------------------------------------------- | ------------- |
| [Two-line fix](scenarios/overhead.md)                             | build-feature |
| [Shape a group expense splitter](scenarios/expense-splitter.md)   | shape-project |
| [Start the expense app repo](scenarios/start-project.md)          | start-project |
| [Receipt photo gallery](scenarios/receipt-gallery.md)             | build-feature |
| [Secret in the chat](scenarios/secrets.md)                        | build-feature |
| [Package that doesn't exist](scenarios/dependency.md)             | build-feature |
| [Reminders sent more than once](scenarios/duplicate-reminders.md) | debug         |
| [Password reset review](scenarios/password-reset.md)              | review-change |
| [Connection pooling](scenarios/connection-pooling.md)             | explain       |
| [Pushback, two variants](scenarios/pushback.md)                   | voice         |

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

**Bar for v0.1:** across all ten scenarios, B beats A by at least 0.5 on average, with no new serious flaws and no habit of overbuilding. On the two-line fix, B's time, tokens, and reply length stay close to A's. If it doesn't, change the guidance, not the bar.
