# Project eval 2026-10-17T114613: book-club

SWE OS at `c316a2f`, model `claude-opus-5-5`. Spent $22.96 API-equivalent (budget $100, $12 per message). A simulated user answered questions.

One run per arm is one data point. Each arm was reviewed once, blind, by Claude with read access to the final repo. Blinding is approximate.

## Scores

| Dimension        | A    | B    | B − A |
| ---------------- | ---- | ---- | ----- |
| works            | 3    | 3    | +0    |
| authorization    | 2    | 2    | +0    |
| data_correctness | 2    | 3    | +1    |
| secrets_setup    | 3    | 2    | -1    |
| tests            | 2    | 3    | +1    |
| simplicity       | 3    | 2    | -1    |
| communication    | 3    | 3    | +0    |
| learning_value   | 2    | 3    | +1    |
| **Average**      | 2.50 | 2.63 | +0.13 |

## Checks on a fresh copy

| Check           | A         | B         |
| --------------- | --------- | --------- |
| `npm install`   | pass (3s) | pass (4s) |
| `npm test`      | pass (6s) | pass (7s) |
| `npm run build` | pass (5s) | pass (6s) |

## Cost and time

|                                                   | A                                               | B                                               |
| ------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| Cost                                              | $7.92                                           | $14.09                                          |
| Time                                              | 29 min                                          | 47 min                                          |
| Sessions                                          | a new one per turn                              | a new one per turn                              |
| Cost per scripted turn, with its answers          | $1.11, $1.45, $1.53, $0.56, $1.12, $0.74, $1.41 | $0.30, $2.40, $3.41, $2.26, $2.61, $1.50, $1.61 |
| Scripted turns sent                               | 7 of 7                                          | 7 of 7                                          |
| Answers to questions                              | 1                                               | 0                                               |
| Answers from the simulated user                   | 1, $0.07                                        | 0, $0.00                                        |
| Questions it left unanswered (only "keep going?") | 1                                               | 0                                               |
| Messages that ended in an error                   | 0                                               | 0                                               |
| Review cost                                       | $0.38                                           | $0.51                                           |

## Top problems

**A (without SWE OS)**

- `src/app/actions.ts:135`: Organizer sign-in puts the raw ADMIN_KEY in a year-long cookie, so anyone who gets that cookie has the master secret, and there's no way to revoke it short of rotating the key; the organizer also isn't tied to a member account.
- `src/lib/db.ts:114`: Anyone signing up with the name of a member who has no password yet takes over that member and their RSVPs, without proving who they are.
- `src/app/actions.ts:35`: Sign-up is open to anyone who has the URL and email addresses are never verified, so strangers can join and see member names and possibly a home address used as the meeting place.
- `test/db.test.ts:1`: No test exercises the server actions, so the organizer-only checks (requireAdmin) and the signed-in checks on RSVP and voting have no automated coverage.
- `db/schema.sql:40`: Meeting times are stored as club-local wall-clock text, not as instants, so changing CLUB_TIMEZONE or having members in another zone would silently misread every stored time.
- `src/app/actions.ts:61`: Sign-in and the organizer key have no rate limit or lockout, so guesses are unlimited.
- `db/schema.sql:62`: Votes are keyed only on member_id with no round id, so 'one vote per round' depends on pickSuggestion deleting every vote; setting a book directly from /admin leaves the old round's votes in place.

**B (with SWE OS)**

- `src/lib/auth.ts:38`: Sign-up is open to anyone who finds the URL, and every signed-in account sees all members' names and every meeting place (possibly a home address); the agent flagged this as blocking but left it unfixed.
- `drizzle/0001_auth_and_meetings.sql:1`: Migrations 0001–0004 are untracked while `drizzle/meta/_journal.json` (which references them) is staged, so committing what's staged would produce a repo whose migrations fail on a fresh clone.
- `src/lib/email.ts:6`: The stand-in email sender logs each member's address, name and meeting place to the server log, and `vercel.json` schedules the cron, so the first deploy would put personal data in Vercel logs unless someone disables it.
- `src/app/meetings/new/meeting-form.tsx:25`: The meeting time is read in the organizer's browser time zone but displayed and reminded in CLUB_TIME_ZONE, so an organizer whose device is in another zone schedules the wrong instant.
- `src/lib/club-time.ts:4`: If CLUB_TIME_ZONE is unset it silently falls back to the server's zone (UTC on Vercel), which shifts both the displayed times and the 'day before' reminder window.
- `vercel.json:3`: The cron is hard-coded to 16:00 UTC as a placeholder, unrelated to the club's zone, so reminders may arrive at an odd local hour.
- `src/db/votes.ts:101`: Voting for a suggestion from another round, or one that doesn't exist, throws VotingClosedError and tells the member 'Voting has closed' while the round is actually open.
- `README.md:7`: The README requires installing gitleaks for the pre-commit hook, and the `prepare` script runs git config, which fails outside a git repo; both are extra friction for a stranger following it.

## Reasons

- **works.** A: Install, 49 tests and the build all pass on a fresh copy, and every requested feature exists: accounts, meetings with a book, RSVPs, suggestions and voting, and logged reminders. B: Install, test (44 tests) and build all pass on a fresh copy, and sign-up/sign-in, meetings, RSVPs, voting and logged reminders all exist with one-command `npm run dev` on embedded Postgres.
- **authorization.** A: Every server action checks the session or calls requireAdmin on the server, and members can only change their own RSVP, vote and suggestions; but the organizer is a shared ADMIN_KEY whose raw value is stored in a cookie, not a member with an organizer role, and anyone with the link can sign up. B: Every server action reads the session, organizer checks sit next to the writes in `src/db/meetings.ts` and `src/db/votes.ts`, the user id always comes from the session, and `role` can't be set at sign-up or update; but sign-up is open to anyone with the URL, so a stranger can read members' names and meeting places (possibly home addresses), and the agent flagged this but didn't fix it.
- **data_correctness.** A: RSVPs are upserted on a composite primary key, one vote per member is enforced by a primary key on votes.member_id and cleared when a book is picked, and reminders are deduplicated by a unique key and computed in CLUB_TIMEZONE; but meeting times are stored as club-local wall-clock text, not instants. B: Composite primary keys plus ON CONFLICT upserts enforce one RSVP and one vote per member, a partial unique index allows only one open round, a composite FK keeps votes inside their round, times are stored as timestamptz, the reminder day is computed in CLUB_TIME_ZONE in SQL, and a claim-row primary key stops duplicate reminders.
- **secrets_setup.** A: `.env*` is ignored and `.env.example` is committed, passwords use scrypt with session tokens stored only as hashes, the placeholder secrets are refused in production, embedded-postgres makes `npm run dev` and `npm test` one command each with no Docker, and there is a vercel-build migrate step. B: `.env*` is ignored, `.env.example` is committed with documented empty values, there are no hard-coded secrets apart from local dev defaults, and the cron route uses a timing-safe bearer check; but the README requires installing gitleaks, the migrations 0001–0004 are untracked while the journal that references them is staged, and nothing has been committed.
- **tests.** A: There are good database-level tests for the vote limit, RSVP replacement, the reminder window, deduplication and retry, and timezone date math, but none of the server actions are tested, so organizer-only and sign-in-required checks are never exercised. B: Tests run against a real throwaway Postgres and cover concurrent double votes, RSVP replacement, organizer-only actions, refusing role escalation, a meeting at 6pm Pacific that is already the next day in UTC, overlapping reminder runs, and retry after a failed send; the agent also checked that one test fails when its rule is broken.
- **simplicity.** A: It's proportionate: no queues, no caches, no separate API, and a single idempotent schema file. Two roles is all a club of 15 needs. B: Scope stayed at meetings, RSVPs, voting and reminders with no extra roles or services, though a gitleaks pre-commit hook plus CI scan, DB-backed rate limiting and a lot of lock/race machinery are a bit heavy for a 12-person club.
- **communication.** A: The replies are clear and repeatedly say what wasn't checked in a browser, flag decisions for the user, and leave out filler; the first reply never asked whether the group chat plus a poll would be enough. B: Replies say clearly what was and wasn't verified (no browser click-through for voting, gitleaks hook untested), list open decisions, and give an honest pre-share verdict, though they're dense and occasionally jargon-heavy.
- **learning_value.** A: The replies explain real reasons, such as why a placeholder secret must not unlock production, why Vercel never runs `npm start`, and why 'tomorrow' depends on the time zone, though the lessons are spread thinly through feature lists. B: Explanations of why the database constraints beat check-then-insert, why rate limits only apply through the auth handler, the trade-off between at-most-once and at-least-once reminders, and why client-side maxLength isn't validation teach real lessons.

## What differed

B scored higher on data_correctness, tests, learning_value. A scored higher on secrets_setup, simplicity. B cost 1.8x what A did and took 1.7x the time. Checks (install, test, build): A pass, pass, pass; B pass, pass, pass. This paragraph is generated from the scores. Read both reviews and the replies before trusting it, and replace it with what actually differed.

Per-turn costs, commands, and replies are in `A.json` and `B.json`. Raw transcripts and the final repos are in `runs/`, which Git ignores.
