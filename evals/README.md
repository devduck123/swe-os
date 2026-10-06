# Evals

Does SWE OS actually make an agent's work better? These scenarios check, one pair of runs at a time.

**Status: not run yet.**

## Run a pair

1. Pick a scenario below. Make two copies of its starting state, each outside this repo, so the agent can't find SWE OS by accident.
2. Use the same model, settings, and tools for both runs. Start each one in a fresh session.
3. **A (without):** paste only the scenario's _Task_ and _Starting state_.
4. **B (with):** paste the same, plus "Use Tommy's SWE OS: start at `<repo or site>/skills/README.md`."
5. Save both outputs and diffs in `evals/results/<date>-<scenario>/`. Note anything you had to answer or fix by hand.
6. Score both with the rubric below, using the scenario's _Reviewer-only notes_. Write reasons before you check which run was which.

One pair is one noisy data point. Repeat a scenario three times before trusting a difference.

## Scenarios

| Scenario                                            | Skill         |
| --------------------------------------------------- | ------------- |
| [Shape an AI meal-planner idea](scenarios/shape.md) | shape-project |
| [Tiny todo app](scenarios/tiny-app.md)              | build-feature |
| [Settings page](scenarios/settings.md)              | build-feature |
| [Flaky weather API](scenarios/flaky-api.md)         | build-feature |
| [Image upload endpoint](scenarios/uploads.md)       | review-change |
| [Database migration](scenarios/migration.md)        | review-change |
| [Circuit breakers](scenarios/explain.md)            | explain       |
| [Pushback, two variants](scenarios/pushback.md)     | voice         |

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

Record serious flaws (data loss, leaked secrets, an auth bypass, a fake verification claim) separately. They can't be averaged away.

**Bar for v0.0:** across all eight scenarios, B beats A by at least 0.5 on average, with no new serious flaws and no habit of overbuilding. If it doesn't, change the guidance, not the bar.
