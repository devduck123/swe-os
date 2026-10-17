# Project eval

The scenario evals test one task at a time. Real use is one long session where early choices stick: the schema from turn 3 has to hold the vote in turn 5, and the final review has to catch what earlier turns missed. This eval builds a whole app that way, twice: once without SWE OS (A) and once with it (B). Then it checks and reviews both final repos blind.

Nobody has run it with Claude yet. It's tested end to end with a stand-in CLI (see [Testing it](#testing-it)).

## The project

A web app for a book club of 8 to 15 people, in seven turns: shape it, set up Next.js and Postgres without Docker, sign-in and meetings, RSVPs, book suggestions and a vote, email reminders, and a review before sharing. The turns, the facts the user gives if asked, and the reviewer's notes are in [book-club.md](book-club.md). The script reads that file, so edit the turns there.

## How a run works

- **Two sessions, one difference.** Each arm builds in its own empty temp folder named `book-club`, and each turn resumes the same session with `--resume`. B's first message starts with "Use Tommy's SWE OS at <a snapshot of the current commit>…", and B gets `--add-dir` to the snapshot. A gets the same messages alone.
- **The same setup as the scenario evals.** Same model, tools, and isolation flags as the [harness](../harness/run.mjs), from the shared [common.mjs](../harness/common.mjs). Pushing, `gh`, deploys, and Docker are denied in both arms.
- **Turns alternate A, B, A, B.** Both arms run one at a time, so their local databases and dev servers can't collide on a port. If the budget runs out, both arms stop at the same turn.
- **One answer per turn, never a nudge.** If a turn's reply ends with a question, the agent gets one message: "Answers to your questions:" and the facts from book-club.md. Then the next scripted turn. A reply that asks "Want me to keep going?" gets the facts, not a "go ahead".
- **A failed message doesn't end the session.** If a message runs out of its per-message budget or times out (45 minutes), the next turn continues, like a person would. A login failure or a usage limit stops everything.

## How it's graded

On a fresh copy of each final repo:

1. **Checks.** `npm install`, `npm test`, and `npm run build`, 10 minutes each, with `CI=1`. Pass or fail and the end of the output go into the results.
2. **One blind reviewer per arm.** `claude -p`, working in the copy, with Read, Grep, Glob, and permission to run only `npm test`, `npm run build`, and `ls`. It sees the user's messages, the reviewer notes, which paths Git ignores, the check results, and each turn's shell commands and final reply. It scores eight dimensions 0 to 3 with a one-sentence reason each, and lists problems with file and line:

| Dimension        | What it asks                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| works            | It installs, builds, and passes its tests, and the scripted features exist                                 |
| authorization    | Can one member read or change another's data? Can a non-organizer create meetings?                         |
| data_correctness | One vote per member per round in the database, RSVPs updated in place, time zones, no double emails        |
| secrets_setup    | No secrets committed, a `.env.example`, a README a stranger can follow, one command to run                 |
| tests            | Tests on the rules, not snapshots                                                                          |
| simplicity       | No overbuilding for a 15-person club                                                                       |
| communication    | From the replies: clear, honest about what was and wasn't verified, not padded                             |
| learning_value   | From the replies: would a self-taught builder learn something real? A "Worth learning" label doesn't count |

### Blinding is approximate

The reviewer works in a folder named `review-<random>/book-club`, so the path doesn't say A or B. Before the checks, lines that mention SWE OS or its files come out of every Markdown file in the copy, and the snapshot's path becomes `<docs>` in every text file. Replies go through the same filter as the scenario evals, which strips SWE OS's labels and any sentence naming it. Commands that read SWE OS are hidden.

What's left can still give B away: code comments that mention SWE OS (code is left alone so it still builds), files SWE OS's templates tend to create, like a `PROJECT.md`, and the shape of B's replies. Read the reviews with that in mind.

## Run it

```sh
node evals/project/run.mjs --dry-run                       # the plan, spends nothing
node evals/project/run.mjs                                 # both arms, $40 budget
node evals/project/run.mjs --budget 60 --per-turn 8
node evals/project/run.mjs --grade evals/project/results/<date>   # redo checks and reviews
```

Run it from a normal terminal, not inside Claude Code. It uses whatever account `claude` is logged into.

## Costs

The defaults are a $40 budget, at most $6 per message, and $3 per review, in API-equivalent dollars. The script holds $6 back for the two reviews, and before each turn it stops if that turn would probably go over, judged by what the last turn cost both arms. Each message is also capped by `--max-budget-usd`, so no single message can run away.

Real cost and time aren't known until the first run. A turn that builds a feature can take many minutes, so plan on a few hours for both arms.

## What it saves

In `results/<date>/`:

- `summary.md`: scores side by side, check results, cost and time per arm, top problems, and a generated paragraph on what differed. Read the reviews and rewrite that paragraph before committing.
- `A.json` and `B.json`: every message's cost, time, commands, and reply, plus the checks and the review.
- `round.json`: the SWE OS commit, budget, and total spent.
- `runs/` (ignored by Git): raw transcripts, `transcript.md` per arm, the reviewer's prompt and transcript, and each final repo without `node_modules`, `.next`, or `.git`.

Commit `summary.md`, `A.json`, `B.json`, and `round.json`.

## Testing it

`npm test` runs the whole eval against [a stand-in `claude`](../../tests/fake-claude/claude) that prints stream-json, builds a tiny app on the setup turn, and answers reviews with JSON. The tests check that B alone gets the pointer and the snapshot, that questions get one answer per turn, that the reviewer's copy and prompt don't mention SWE OS, that a usage limit stops before grading, and that the budget stops both arms at the same turn.
