# Changelog

Projects pin a version in their `AGENTS.md`. Check here before moving to a new one. Versions follow [semver](https://semver.org): a minor version can change skill steps or rules, and a major version means a project's `AGENTS.md` may need edits.

## Unreleased

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
