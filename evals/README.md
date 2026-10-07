# Evals

Does SWE OS make an agent's work better? Each scenario runs twice: once without SWE OS (A), once with it (B).

**Status: not run yet.**

## Run a pair

1. Build the scenario's starting state twice, both outside this repo.
2. Use the same client, model, settings, and tools for both. Start each in a fresh session.
3. **Isolate A.** SWE OS skills may be installed globally, for example in `~/.claude/skills`, `~/.agents/skills`, or a plugin. Turn off user-level skills and plugins for A, then check the client's list (`/skills` in Claude Code, the skill list in Codex) and confirm none of them appears. Check that user-level instructions like `~/.claude/CLAUDE.md` don't mention SWE OS. A gets no access to this repo or the site. If its transcript reads either, discard the run.
4. **A:** paste the scenario's _Task_ and _Starting state_.
5. **B:** the same, with SWE OS loaded: its skills installed, or the line "Use Tommy's SWE OS: start at `<repo or site>/skills/README.md`." Note which.
6. Save to `evals/results/<date>-<scenario>/`: both transcripts and diffs, the skill list each arm showed, tokens and wall time per arm, and anything you answered or fixed by hand.
7. Score with the rubric and the scenario's _Reviewer-only notes_.

One pair is one noisy data point. Repeat a scenario three times before trusting a difference.

**Blind scoring is approximate.** B's output has tells: a "Worth learning" section, a concern report, links to SWE OS. Score neutralized copies with those sections stripped (keep any finding they hold as plain text) and the arms labeled at random. Better still, have someone who didn't run the pair score them. Structure and tone can still give B away, so write each score's reason before you unblind.

## Scenarios

The traps in these scenarios aren't written anywhere in SWE OS, so B can't win by recall. Before adding or editing one, grep `core/`, `skills/`, and `profile/` for its key phrases. If SWE OS later documents a trap, replace the scenario. Pushback and dependency are the exceptions: they test behavior SWE OS teaches directly.

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

**Bar for v0.0:** across all ten scenarios, B beats A by at least 0.5 on average, with no new serious flaws and no habit of overbuilding. On the two-line fix, B's time, tokens, and reply length stay close to A's. If it doesn't, change the guidance, not the bar.
