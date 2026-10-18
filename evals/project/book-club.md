# Book club app

A whole project in one Claude Code session: shape it, set it up, build four features, then review it before sharing. [run.mjs](run.mjs) reads this file and sends each turn as written, so edit the turns here.

## Turns

1. I want to build a small web app for my book club, 8 to 15 people. We pick a book, meet about once a month, and right now it's all in a group chat. Help me figure out the first version and what to build first.
2. Sounds good. Set up the project: Next.js and Postgres. I don't have Docker running, so use something that runs locally without it. No paid services. Get it running locally with one command and tests.
3. Build the first feature: members sign up and sign in, and the organizer creates meetings with a date, a place, and the book.
4. Next: members RSVP yes, no, or maybe, and everyone sees who's coming.
5. Next: members suggest books for the next meeting and vote. One vote per member per round.
6. Add an email reminder the day before a meeting. There's no email provider yet, so log the emails for now.
7. Before I share this with the club, review everything you built for problems and fix what matters.

## Facts if asked

The club has 12 members right now and has ranged from 8 to 15. One person organizes: she sets the date, the place, and the book, and runs the vote. Everyone has a phone, and most people will open the app from a link in the group chat. It'll go on free hosting later, probably Vercel. No payments, now or later.

## Reviewer-only notes

A strong build:

- **Keeps the first version small.** Meetings, RSVPs, and the book vote. Chat, discussion threads, reading progress, and native apps wait. It asks whether the group chat plus a poll would do, and says why an app still wins if it does.
- **Runs without Docker or a service.** An in-process or npm-installed Postgres (PGlite, embedded Postgres) or a documented local install. `npm test` works on a fresh clone without starting anything by hand.
- **Checks permissions on the server.** Every write checks the session on the server. Only the organizer can create or edit meetings, and hiding the button isn't enough. A member can change only their own RSVP and vote. There's a clear way the first organizer gets that role.
- **Puts the rules in the database.** One RSVP per member per meeting, updated in place. One vote per member per round, enforced by a unique constraint so a double click or two tabs can't vote twice.
- **Gets time right.** Meeting times are stored as instants and shown in the club's time zone. "The day before" is computed in the club's time zone, not the server's UTC. Running the reminder job twice doesn't log the same reminder twice.
- **Keeps secrets out.** Passwords are hashed with a slow hash, or there are no passwords. Session secrets come from the environment. `.env` is ignored and `.env.example` is committed. A stranger can follow the README.
- **Tests the rules.** Tests cover the vote limit, the RSVP update, organizer-only actions, and the reminder window, not just that a page renders.
- **Reviews honestly.** The last turn finds real problems, fixes the ones that matter, and says what it didn't check.

Deduct for overbuilding: role systems beyond organizer and member, queues, caches, or a separate API service for a 15-person club.
