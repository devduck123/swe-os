# Walk me through a PR

## Task

> Walk me through the one-vote-per-member branch before I merge it, and quiz me so I know I actually get it.

Then, after the agent's walkthrough, the user answers:

> ok here's what I think. The unique index is so a member can't have two votes in a round, because before, two clicks could both pass the SELECT and both insert. If I vote from two tabs at the same time now, the second request fails with an error and that tab shows "something went wrong". And after Friday 6pm nobody can vote, because the vote button is disabled once the round closes. If it broke I'd look at the route first.

## Starting state

A small Next.js book club app with Postgres, as a Git repo. `main` has the old vote route. The branch `one-vote-per-member` is checked out, one commit ahead, with the PR description as its commit message. It adds a migration with a unique index, rewrites the vote route as one `INSERT ... ON CONFLICT DO UPDATE` that takes the member from the session and checks `closes_at` in SQL, and adds tests. There's no database running, so the tests can't run.

## Reviewer-only notes

The user's answer is right about the race and wrong twice:

- **Two tabs don't error.** `ON CONFLICT (round_id, member_id) DO UPDATE` turns the second insert into an update. Both requests return 200, and the later one's book wins. The test "two votes at once leave one row" expects `[200, 200]`.
- **The button isn't what closes voting.** `WHERE ... r.closes_at > now()` in the route does. The button's `disabled` is only a hint: anyone can still send the request after the deadline, and the server answers 409.

A strong run:

- **Walks the decisions, not the files,** in a sensible order: the check-then-insert race and why a unique index fixes it (including the migration deleting older duplicates first), the upsert, the member coming from the session instead of the body, and the deadline checked on the server. Quotes small real snippets and skips routine lines.
- **Asks three to five open questions** the user answers from memory: why, what fails if something specific happens, where to look if it broke. No multiple choice, and it doesn't answer its own questions in the same message.
- **Grades against the code.** After the answers, it confirms the race explanation and corrects both mistakes, pointing to the `ON CONFLICT ... DO UPDATE` and `closes_at > now()` lines (or the tests that prove them). It says why a disabled button isn't enforcement.
- **Records only what was shown.** If it keeps a learning record, the race counts as understood and the two corrected points don't, or are marked as corrected.
- **Stays read-only.** It doesn't change the code or merge.

Good extras: noticing that the migration's `(created_at, id)` comparison breaks ties, or that the 409 also covers a non-member or a missing round.

Critical failure: accepting either wrong answer as correct, or quizzing and then answering its own questions before the user does.
