# Project

## Now

**v0.0: prove the idea.** One set of Markdown files that teaches people and steers agents. Maturity: prototype. Nothing is deployed.

Done when:

- The six skills, concerns, principles, and profile read well to a person and work for an agent.
- At least one guide is written end to end and wired to the concerns that need it.
- The site has a landing page that explains how this works, and renders every page.
- Tommy has used it on this repo and one side project, and the paired evals show it helps.

## Next

1. Start the `learn` trial: on every real side-project PR for two weeks, run "walk me through this PR" before merging. Note what stuck and what was annoying.
2. Dogfood: use `build-feature` on one real side-project feature. Keep notes on friction, and act on anything rule 11 flags.
3. Run the [evals](evals/README.md), starting with pushback and the AI feature review. Change or delete guidance based on what they show.
4. Before going public: pick a license, delete `.archive/`, and have Tommy rewrite the guides and concern pages in his own words.
5. Write the next few guides, picked by the concepts `learn` keeps surfacing.
6. Add a `debug` eval scenario once the skill has been used on a real bug.
7. Later, if usage justifies them: recipes, a full tech radar (`defaults.md` holds the 2026-10-06 research for now), and a `bootstrap-project` skill.

## Decisions

| Decision                                                                                                 | Why                                                                                                                                                                                               | Revisit when                                                                     |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| No installer. Agents read the repo or site.                                                              | Nothing to sync or version per project. A project's AGENTS.md records which version it follows.                                                                                                   | Reading over the network proves too slow or flaky.                               |
| One Markdown file per concern, instead of a JSON registry and script                                     | Agents read Markdown directly, and people can learn from it. The script added ceremony, not judgment.                                                                                             | Agents keep misrouting concerns in evals.                                        |
| The site renders the source files as they are, with no copy step                                         | One source, no drift. Raw `.md` sits at the same path for agents.                                                                                                                                 | Never, ideally.                                                                  |
| Astro and Starlight, with a custom landing page                                                          | Static, fast, good search. Starlight handles docs pages; the landing page shows personality.                                                                                                      | Starlight blocks the design we want.                                             |
| Core and profile kept apart                                                                              | Tommy's preferences shouldn't pose as universal rules.                                                                                                                                            | Never.                                                                           |
| Voice split by job: voice (every task), writing, learning, tommy                                         | Every task loads voice, so it stays short. Writing and teaching rules load only when needed. Engineering judgment lives in core and skills, not in voice.                                         | Agents miss voice rules that only live in writing or learning.                   |
| ChatGPT drafts voice changes; the repo is the source of truth                                            | ChatGPT knows Tommy's voice best. Splitting drafts into the right files keeps each rule in one place.                                                                                             | Never.                                                                           |
| Learning happens at the PR: a "Worth learning" note in every report, plus a `learn` skill used on demand | Tommy's attention lands on PRs when agents run in parallel. Recall practice works best, but quizzes mid-work get switched off. Only `learn` writes LEARNING.md, so parallel agents don't collide. | Two weeks of use show he skips walkthroughs, or the notes turn into noise.       |
| Fonts self-hosted by Astro's `fonts` config, upright Fraunces with `display: optional`                   | Measured on slow 4G: landing went from 447 KB to 195 KB, load from 2.8 s to 1.3 s, layout shift from 0.19 to 0. No third-party request.                                                           | A cold first visit showing the fallback serif bothers us more than layout shift. |
| Looping animations: a pause button, paused off-screen, dash animation runs only on arrival               | WCAG 2.2.2 needs a pause control. Dash animations repaint on the main thread every frame.                                                                                                         | We add more motion.                                                              |

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
