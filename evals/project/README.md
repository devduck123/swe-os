# Project eval

The scenario evals test one task at a time. Real use is a whole project where early choices stick: the schema from turn 3 has to hold the vote in turn 5, and the final review has to catch what earlier turns missed. This eval builds a whole app that way, twice: once without SWE OS (A) and once with it (B). Then it checks and reviews both final repos blind.

It's been run twice with Claude, both times in one long session per arm. The first stopped after 3 of 7 turns at a $40 budget. The [second](results/2026-10-17T095938/summary.md) stopped before turn 6 at $125, so there are no results for all seven turns yet, and none with fresh sessions. It's tested end to end with a stand-in CLI (see [Testing it](#testing-it)).

## The project

A web app for a book club of 8 to 15 people, in seven turns: shape it, set up Next.js and Postgres without Docker, sign-in and meetings, RSVPs, book suggestions and a vote, email reminders, and a review before sharing. The turns, the facts the user gives if asked, and the reviewer's notes are in [book-club.md](book-club.md). The script reads that file, so edit the turns there.

## How a run works

- **Two arms, one difference.** Each arm builds in its own empty temp folder named `book-club`. B gets `--add-dir` to a snapshot of the current commit, and each of its scripted turns starts with "Use Tommy's SWE OS at <the snapshot>…". A gets the same messages without that line.
- **A fresh session per turn.** Each scripted turn starts a new `claude -p` session in the same folder, the way SWE OS tells people to work: one session per feature, with the README, AGENTS.md, and PROJECT.md carrying context between them. Turns after the first start with the same line in both arms: "You're continuing work on this project in a new session. Read the project's README, AGENTS.md, and PROJECT.md if they exist before starting." Answers to an agent's questions resume that turn's session. See [why](#why-fresh-sessions).
- **The same setup as the scenario evals.** Same model, tools, and isolation flags as the [harness](../harness/run.mjs), from the shared [common.mjs](../harness/common.mjs). Pushing, `gh`, deploys, and Docker are denied in both arms.
- **Turns alternate A, B, A, B.** Both arms run one at a time, so their local databases and dev servers can't collide on a port. If the budget runs out, both arms stop at the same turn.
- **A simulated user answers questions, never with a nudge.** See [below](#the-simulated-user).
- **A failed message doesn't end the build.** If a message runs out of its per-message budget or times out (45 minutes), the next turn continues, like a person would. A login failure or a usage limit stops everything.

### Why fresh sessions

The first two runs used one long session per arm, resuming it with `--resume` every turn. Resuming re-reads the whole session, so every message pays for everything before it. In the second run, later messages cost 5 to 10 times the early ones: B's went from $3.74 on turn 2 to $25 on turn 5, and the run hit its $120 budget before turn 6. That measured how long a session got, not how well each arm built.

It also isn't how SWE OS says to work. SWE OS recommends a fresh session per feature, with PROJECT.md complete enough that the next session can start from it. Fresh sessions test that: if the agent didn't leave good notes, the next turn suffers.

`--sessions one` keeps the old single long session. Then only B's first message gets the SWE OS line, and nothing gets the preamble.

## The simulated user

Agents end turns with design questions: "One vote each or several?", "Should I drop the sign-up request?" The first run answered every question with the same fixed facts, which don't answer design questions. Arm B asked the same question again, got the same facts, and never built sign-in. That measured the harness, not the agent.

Now, when a message ends with a question, a separate `claude -p` call plays the owner and writes the reply. It gets the facts from book-club.md, the user's messages so far, and the agent's last reply. Its rules:

- Answer only what was asked, in one to three plain sentences, from the facts.
- If the facts don't settle it, pick the option the agent recommended, or the simpler one if it didn't recommend one, and say so.
- What the scripted turns asked for still stands. If the agent asks whether to drop sign-up, the answer is no.
- Never add scope or features. Never say "go ahead" or push past the current turn. If the agent only asks whether to keep going, the user doesn't answer and the next scripted turn comes.

It answers at most twice per scripted turn. Each answer is recorded on the message it answers (`user` in `A.json` and `B.json`), and the summary counts them.

To keep it fair, both arms get the same prompt template, model, and flags: no tools, the agents' isolation flags, an empty folder, and $1 per answer. The agent's reply goes through the same filter as the reviewer's, so the user doesn't see SWE OS named. The arms can still get different answers, because they ask different questions. `--fixed-answers` restores the old behavior, one fixed facts message per turn.

## How it's graded

On a fresh copy of each final repo:

1. **Checks.** `npm install`, `npm test`, and `npm run build`, 10 minutes each, with `CI=1`. Pass or fail and the end of the output go into the results.
2. **One blind reviewer per arm.** `claude -p`, working in the copy, with Read, Grep, Glob, and permission to run only `npm test`, `npm run build`, and `ls`. It sees the user's messages (scripted and simulated), the reviewer notes, which paths Git ignores, the check results, and each turn's shell commands and final reply. It scores eight dimensions 0 to 3 with a one-sentence reason each, and lists problems with file and line:

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
node evals/project/run.mjs                                 # both arms, $120 budget
node evals/project/run.mjs --budget 150 --per-turn 15
node evals/project/run.mjs --sessions one                  # one long session per arm, the old way
node evals/project/run.mjs --fixed-answers                 # answer questions with the fixed facts
node evals/project/run.mjs --grade evals/project/results/<date>   # redo checks and reviews
```

Run it from a normal terminal, not inside Claude Code. It uses whatever account `claude` is logged into.

## Costs

The defaults are a $120 budget, at most $12 per message, $3 per review, and $1 per simulated answer, in API-equivalent dollars. The script holds $6 back for the two reviews, and before each turn it stops if that turn would probably go over, judged by what the last turn cost both arms. That guard stops both arms at the same turn. Each message is also capped by `--max-budget-usd`, so no single message can run away.

In one long session, the first run spent about $32 on 3 turns for both arms, and the second spent $125 on 5. Answers weren't cheap either: resuming a session re-reads all of it, so a one-line answer late in the second run cost B $26. Fresh sessions should keep later turns closer to the early ones, since each starts from the repo and its notes instead of the whole chat. The summary lists each arm's cost per scripted turn, so a rerun shows whether they still grow. Until then, assume a full run costs up to $120. The simulated user's own calls cost cents. What costs money is the agent message each answer triggers, which is why the user answers at most twice per turn and skips "keep going?".

If a review comes back missing a score or a reason, the reviewer gets one follow-up in the same session asking for the complete JSON. In the first run, A's reviewer gave a reason for one dimension of eight.

## What it saves

In `results/<date>/`:

- `summary.md`: scores side by side, check results, the session mode, cost and time per arm, cost per scripted turn, top problems, and a generated paragraph on what differed. Read the reviews and rewrite that paragraph before committing.
- `A.json` and `B.json`: the session mode, and every message's cost, time, commands, reply, whether it started a new session, and the simulated user's answer, plus the checks and the review.
- `round.json`: the SWE OS commit, session mode, budget, and total spent.
- `runs/` (ignored by Git): raw transcripts (`user-<n>.jsonl` for each simulated answer), `transcript.md` per arm, the reviewer's prompt and transcript, and each final repo without `node_modules`, `.next`, or `.git`.

Commit `summary.md`, `A.json`, `B.json`, and `round.json`.

## Testing it

`npm test` runs the whole eval against [a stand-in `claude`](../../tests/fake-claude/claude) that prints stream-json, builds a tiny app on the setup turn, and answers reviews with JSON. The stand-in also plays the simulated user and can ask a design question or "keep going?" on every reply. The tests check that B alone gets the pointer and the snapshot, that fresh sessions start every scripted turn without `--resume` while answers resume their turn's session, that both arms get the preamble and only B gets the pointer, on every turn, that `--sessions one` keeps one session with the pointer only on B's first message, that the simulated user answers a design question, answers at most twice per turn, skips "keep going?", and gets the same prompt template in both arms, that `--fixed-answers` still sends the facts once per turn, that an incomplete review gets one follow-up, that the reviewer's copy and prompt don't mention SWE OS, that a usage limit stops before grading, and that the budget stops both arms at the same turn.
