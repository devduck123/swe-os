# Project

## Now

**v0.1: public MVP.** SWE OS goes public as both a learning track and an agent toolkit, with the gap between vibe coding and engineering as the through-line. Maturity: prototype. Nothing is deployed yet.

Done when:

- A newcomer can land on the site and follow the track from "what's the difference?" to "here's the stack I'd ship, and why". All eight stops are written in Tommy's voice and reviewed.
- `start-project` sets up a real side project that passes its own checks, with secrets protected, on the first run.
- The secrets and dependency evals show agents catching what the new guidance targets.
- The site is live on a domain, under a license, with `.archive/` gone and no private details anywhere.

## Next

1. Walk through the track outlines together and adjust the structure before any prose gets written.
2. Tommy writes, or rewrites, each stop in his voice. Agents can draft from an outline on request; anything an agent wrote stays a draft until Tommy reviews it.
3. Test `start-project` on one real side project, and fix what it gets wrong.
4. Run the secrets, dependency, pushback, and AI feature evals.
5. Launch decisions: license, domain, hosting (Vercel per defaults), and the `site` URL for the sitemap and `llms.txt`.
6. Before launch: delete `.archive/`, re-check every fast-moving claim, and do a final review of the public README and landing page.
7. After launch: the two-week `learn` trial, dogfooding `build-feature`, and guides picked by what `learn` keeps surfacing.

## Decisions

| Decision                                                                                                                                       | Why                                                                                                                                                                                               | Revisit when                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| No installer. Agents read the repo or site.                                                                                                    | Nothing to sync or version per project. A project's AGENTS.md records which version it follows.                                                                                                   | Reading over the network proves too slow or flaky.                               |
| One Markdown file per concern, instead of a JSON registry and script                                                                           | Agents read Markdown directly, and people can learn from it. The script added ceremony, not judgment.                                                                                             | Agents keep misrouting concerns in evals.                                        |
| The site renders the source files as they are, with no copy step                                                                               | One source, no drift. Raw `.md` sits at the same path for agents.                                                                                                                                 | Never, ideally.                                                                  |
| Astro and Starlight, with a custom landing page                                                                                                | Static, fast, good search. Starlight handles docs pages; the landing page shows personality.                                                                                                      | Starlight blocks the design we want.                                             |
| Core and profile kept apart                                                                                                                    | Tommy's preferences shouldn't pose as universal rules.                                                                                                                                            | Never.                                                                           |
| Voice split by job: voice (every task), writing, learning, tommy                                                                               | Every task loads voice, so it stays short. Writing and teaching rules load only when needed. Engineering judgment lives in core and skills, not in voice.                                         | Agents miss voice rules that only live in writing or learning.                   |
| ChatGPT drafts voice changes; the repo is the source of truth                                                                                  | ChatGPT knows Tommy's voice best. Splitting drafts into the right files keeps each rule in one place.                                                                                             | Never.                                                                           |
| Learning happens at the PR: a "Worth learning" note in every report, plus a `learn` skill used on demand                                       | Tommy's attention lands on PRs when agents run in parallel. Recall practice works best, but quizzes mid-work get switched off. Only `learn` writes LEARNING.md, so parallel agents don't collide. | Two weeks of use show he skips walkthroughs, or the notes turn into noise.       |
| Human-facing guides start as outlines, and Tommy writes the prose. Agent-facing pieces (skills, concerns, evals) are written as working drafts | The track has to teach in Tommy's voice. Skills and concerns only help if they work, so they're built and tested now.                                                                             | Tommy prefers agent drafts to edit over writing from outlines.                   |
| Every guide has "What the vibe-coded version misses" and starts "What I'd do" from the simplest option                                         | That gap is the product. Simple-first is Tommy's default.                                                                                                                                         | Never.                                                                           |
| Fonts self-hosted by Astro's `fonts` config, upright Fraunces with `display: optional`                                                         | Measured on slow 4G: landing went from 447 KB to 195 KB, load from 2.8 s to 1.3 s, layout shift from 0.19 to 0. No third-party request.                                                           | A cold first visit showing the fallback serif bothers us more than layout shift. |
| Looping animations: a pause button, paused off-screen, dash animation runs only on arrival                                                     | WCAG 2.2.2 needs a pause control. Dash animations repaint on the main thread every frame.                                                                                                         | We add more motion.                                                              |

## Gaps

| Gap                                                                                  | State    | Revisit when                                                                                  |
| ------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------- |
| Guides and concern pages are AI-drafted; the profile is reviewed as a starting point | Deferred | Before any public launch                                                                      |
| No evidence yet that SWE OS improves agent results                                   | Unknown  | After the first eval runs                                                                     |
| The learn loop is untested on Tommy                                                  | Unknown  | After two weeks of real PRs: did he run walkthroughs, and does he remember what they covered? |
| No domain, hosting, or license chosen                                                | Deferred | Before going public                                                                           |
| Windows paths and line endings are handled in code but never run on Windows          | Unknown  | First Windows contributor or CI runner                                                        |
| Only two guides exist                                                                | Deferred | As `learn` surfaces recurring concepts                                                        |
| Codex's first version is in `.archive/codex-v0/`, untracked                          | Deferred | Tommy deletes it once he's compared                                                           |
