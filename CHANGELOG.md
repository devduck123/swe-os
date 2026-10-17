# Changelog

Projects pin a version in their `AGENTS.md`. Check here before moving to a new one. Versions follow [semver](https://semver.org): a minor version can change skill steps or rules, and a major version means a project's `AGENTS.md` may need edits.

## Unreleased

## v0.3.0 (2026-10-17)

- **The track, tuned with a learner test.** Agents read every stop as the target reader. 91% now take away the intended lesson (from 68%), and clarity is 3.9/5 (from 3.7).
  - Database lessons show plain SQL first, with short "On Neon" / "On Supabase" lines.
  - Every stop ends with "What I'd do" and "Before you ship, check": yes/no checks to paste to your agent.
  - Terms are explained on first use, and expert detail moves into collapsible "Going deeper" blocks.
  - Supabase paths are added, including an RLS policy walkthrough, restores by plan, and capturing dashboard schema edits with `supabase db diff`.

- **Shorter reports.** build-feature and debug reports have fewer sections (What changed, Evidence, Open, Worth learning) and aim for 150–250 words. Only open concerns are listed; the evidence shows what's handled. Worth learning is one point, never repeating the reply. Rule 13's feedback line appears only when guidance actually caused a problem, written for the user. Eval round 6: communication went from −0.15 to +0.07 against no SWE OS, and median reply length dropped from 3,593 to 2,847 characters.
- **The learner test.** `node evals/learner/run.mjs` checks whether each track stop teaches its reader.
- **A new eval bar, and it's met.** SWE OS ties or beats no-SWE-OS on every scenario within noise, has no serious flaws of its own, ties the two-line fix on cost, and clearly wins on verification, setup, debugging, and secrets (round 6).

## v0.2.0 (2026-10-13)

From MVP to product. Projects that pin v0.1.0 should read the guidance changes below before moving.

- **Agents build first, then ask.** Rule 4 and build-feature's stop rule: when a question doesn't block code you could undo, make the likely assumption, say it, build, and ask at the end. A server route for a requested feature, or a substitute for a package that doesn't exist, counts as implied. Rule 6 asks only before signing up for or turning on a paid service the user hasn't asked for.
- **Shorter reports.** One line names the handled concerns; only open ones get their own line. Answers to questions skip the concern report (rule 9).
- **Expo.** The secrets guide and security concern cover `EXPO_PUBLIC_` and other values shipped inside a mobile app.
- **Evals you can run.** `node evals/harness/run.mjs` runs every scenario with and without SWE OS through Claude Code, grades blind, and writes a summary. Results from the first three rounds are in `evals/README.md`.
- **Claude Code plugin.** `/plugin marketplace add devduck123/swe-os`, then `/plugin install swe-os@swe-os`. The seven skills trigger on their own, and the plugin updates when a new version is released.
- **Pin a version.** The project template reads SWE OS at a tag, from a local copy or from the raw files on GitHub, and `start-project` fills in the latest tag.
- **Use your own profile.** A project's `AGENTS.md` can point at your own voice and default-stack files instead of Tommy's.
- **Feedback.** Issue templates for wrong facts and agent friction, an edit link on every page, and private vulnerability reporting. Rule 13 points agents at the feedback form.

## v0.1.0 (2026-10-08)

The first public release.

- **The track:** 22 stops from vibe coder to engineer across the lifecycle, plus the side-project stack recipe.
- **Skills:** shape-project, start-project, build-feature, debug, review-change, explain, and learn, with 13 rules for every task.
- **Concerns:** 17 risk pages with a routing table, and a small-change rule.
- **Two ways to use it with an agent:** raw Markdown from the site, or a local clone.
- **Guards on the public repo:** secret scanning on every commit and PR, and a protected `main`.
