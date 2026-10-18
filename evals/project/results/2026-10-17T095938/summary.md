# Project eval 2026-10-17T095938: book-club

SWE OS at `f1d1eb9`, model `claude-opus-5-5`. Spent $125.37 API-equivalent (budget $120, $12 per message). A simulated user answered questions. Stopped before turn 6 of 7: $124.68 spent, and the last turn cost $58.21 for both arms.

One run per arm is one data point. Each arm was reviewed once, blind, by Claude with read access to the final repo. Blinding is approximate.

## Scores

| Dimension        | A    | B    | B − A |
| ---------------- | ---- | ---- | ----- |
| works            | 1    | 1    | +0    |
| authorization    | 3    | 3    | +0    |
| data_correctness | 1    | 2    | +1    |
| secrets_setup    | 2    | 3    | +1    |
| tests            | 2    | 2    | +0    |
| simplicity       | 2    | 2    | +0    |
| communication    | 1    | 1    | +0    |
| learning_value   | 2    | 2    | +0    |
| **Average**      | 1.75 | 2.00 | +0.25 |

## Checks on a fresh copy

| Check           | A         | B          |
| --------------- | --------- | ---------- |
| `npm install`   | pass (3s) | pass (5s)  |
| `npm test`      | pass (3s) | pass (6s)  |
| `npm run build` | pass (4s) | pass (10s) |

## Cost and time

|                                                   | A        | B        |
| ------------------------------------------------- | -------- | -------- |
| Cost                                              | $25.13   | $99.42   |
| Time                                              | 38 min   | 58 min   |
| Scripted turns sent                               | 5 of 7   | 5 of 7   |
| Answers to questions                              | 2        | 2        |
| Answers from the simulated user                   | 2, $0.06 | 2, $0.07 |
| Questions it left unanswered (only "keep going?") | 0        | 0        |
| Messages that ended in an error                   | 0        | 0        |
| Review cost                                       | $0.30    | $0.38    |

## Top problems

**A (without SWE OS)**

- **Serious.** `lib/db.ts:9`: No email reminder exists anywhere (no job, table or log), so step 6 is missing, and with it any 'day before in the club's time zone' logic and any guard against duplicate reminders.
- `app/actions.ts:1`: The requested 'review everything and fix what matters' pass never happened; the session ends after the vote feature without telling the user.
- `lib/db.ts:28`: Meetings are stored as a DATE plus a free-text meeting_time with no time zone, not as an instant, so a correct 'day before' can't be computed and the time depends on the reader assuming the club's zone.
- `lib/data.ts:31`: 'Upcoming' uses CURRENT_DATE - 1 on the server's (UTC on Vercel) clock, so a meeting stays current an extra day instead of using the club's time zone.
- `app/actions.ts:233`: startPoll checks for an open round and then inserts it, with no database constraint allowing only one open poll, so a double click can open two rounds, and suggestBook's 'SELECT id FROM polls WHERE closed_at IS NULL' then picks one at random.
- `.gitignore:34`: .env* is ignored but there's no .env.example listing DATABASE_URL and CLUB_INVITE_CODE.
- `lib/auth.ts:38`: Outside production the invite code silently falls back to the hard-coded 'bookclub', so a deployment that doesn't set NODE_ENV=production would be open to anyone who guesses it.
- `app/actions.ts:300`: Any organizer can demote or remove any other organizer, including the original one, which is more role management than a one-organizer club needs.

**B (with SWE OS)**

- **Serious.** `src/lib (no reminder module)`: The day-before email reminder (request 6) was never built: no job, no email log, no 'day before' logic in the club time zone, and no protection against logging the same reminder twice. PROJECT.md:28 still lists reminders as out of scope.
- **Serious.** `PROJECT.md:28`: The final 'review everything and fix what matters' pass (request 7) never happened, so the app was never reviewed before being shared with the club.
- `src/lib/meetings.ts:40`: The organizer can create meetings but there is no edit or cancel action, so a wrong date or place can't be fixed in the app.
- `drizzle/0000_init.sql`: The committed initial migration was rewritten between commits 1 and 2, which breaks the project's own rule never to edit a committed migration. It was disclosed and only ever applied locally.
- `package.json`: npm audit reports 13 vulnerabilities (9 high). The agent said they're all in dev-only tooling but didn't record that anywhere tracked.
- `.husky/pre-commit`: The pre-commit secret scan was never wired up and gitleaks never ran on the commits, so the only secret check was a grep for patterns. This was disclosed.

## Reasons

- **works.** A: Install, 58 tests and the build all pass, and accounts, meetings, RSVPs and the vote are in place, but the email reminder (step 6) and the final review (step 7) were never built or done. B: Install, test and build all pass, and accounts, meetings, RSVPs and voting all work, but the email reminder (request 6) was never built and the final review (request 7) never happened.
- **authorization.** A: Every server action checks the session on the server, organizer actions go through requireOrganizer, RSVPs and votes always use the signed-in member's id, and the first account becoming organizer is atomic and written down in the README. B: Every write gets the user from the server session. Meeting creation and round open/close check for the organizer role on the server. RSVPs and votes are keyed to the session user. Role is input:false at sign-up, and make-organizer is a clear way to create the first organizer.
- **data_correctness.** A: RSVPs (meeting, member) and votes (poll, member) are primary keys updated in place with ON CONFLICT, but meetings are a DATE plus a free-text time with no time zone, and there's no reminder job, so nothing works out 'the day before' or prevents duplicate reminders. B: The rules live in the database: an RSVP primary key with upsert, a vote primary key per round, a composite foreign key tying each vote to its own round, and a partial unique index allowing one open round. Times are timestamptz shown in the club zone. But there is no reminder, so 'the day before' and duplicate-reminder handling don't exist.
- **secrets_setup.** A: Passwords are hashed with salted scrypt, session tokens are stored hashed, .env* is gitignored, the invite code comes from the environment, and the README is easy to follow with one command, but there's no .env.example even though .env* is ignored. B: The .env files are gitignored, .env.example lists names only, the local auth secret is generated per machine into the ignored .data folder, Better Auth hashes passwords slowly, and the README's one command (npm ci, npm run dev) needs no Docker and no .env.
- **tests.** A: The tests run the real server actions against in-memory PGlite and cover the one-vote limit, the database blocking a double submit, changing an RSVP, organizer-only actions and expired sessions, but there are no reminder tests because the feature doesn't exist. B: Tests cover moving a vote, simultaneous votes, organizer-only actions, RSVP upsert under concurrency, rate limits and the invite code, and the agent broke each protection on purpose to check the tests fail. There are no reminder-window tests because there is no reminder.
- **simplicity.** A: The scope fits a small club, with no queues, caches or separate API, though several organizers, organizer password resets and member removal go a bit past what one organizer needs. B: The feature set is small and right-sized, but husky, gitleaks in CI, Playwright at two viewport sizes, an invite code and database-backed rate limiting are a lot of process for a 12-person club.
- **communication.** A: Most replies are honest about what wasn't checked in a browser, but the reply to the setup request only talked about a dev server that had stopped, and the session ends without telling the user that reminders and the review were never done. B: The replies are clear about what was verified, but nothing in the transcript acknowledges that the reminder and final-review requests went undone, and Message 1 proposed an architecture that was then reversed.
- **learning_value.** A: Some replies explain real reasons, like why the chat buries information, why the database enforces uniqueness against double taps, and why members can't withdraw a suggestion others voted for, but the time-zone choices are glossed over. B: The asides explain real, non-obvious lessons: evaluation order with headers() under cacheComponents, why useOptimistic doesn't roll back when the call throws, and a partial unique index on a constant to allow one open round.

## What differed

B scored higher on data_correctness, secrets_setup. A scored higher on nothing. B cost 4.0x what A did and took 1.5x the time. Checks (install, test, build): A pass, pass, pass; B pass, pass, pass. This paragraph is generated from the scores. Read both reviews and the replies before trusting it, and replace it with what actually differed.

Per-turn costs, commands, and replies are in `A.json` and `B.json`. Raw transcripts and the final repos are in `runs/`, which Git ignores.
