# Project

## Now

**v0.0: prove the idea.** One set of Markdown files that teaches people and steers agents. Maturity: prototype. Nothing is deployed.

Done when:

- The four skills, concerns, principles, and profile read well to a person and work for an agent.
- At least one guide is written end to end and wired to the concerns that need it.
- The site has a landing page that explains how this works, and renders every page.
- Tommy has used it on this repo and one side project, and the paired evals show it helps.

## Next

1. Tommy reviews the drafted content and rewrites anything that doesn't sound like him.
2. Dogfood: use `build-feature` on one real side-project feature. Keep notes on friction.
3. Run the [evals](evals/README.md). Change or delete guidance based on what they show.
4. Write the next few guides, picked by the questions that actually come up.
5. Later, if usage justifies them: recipes, a tech radar, and `bootstrap-project` and `drill` skills.

## Decisions

| Decision                                                                                   | Why                                                                                                                                     | Revisit when                                                                     |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| No installer. Agents read the repo or site.                                                | Nothing to sync or version per project. A project's AGENTS.md records which version it follows.                                         | Reading over the network proves too slow or flaky.                               |
| One Markdown file per concern, instead of a JSON registry and script                       | Agents read Markdown directly, and people can learn from it. The script added ceremony, not judgment.                                   | Agents keep misrouting concerns in evals.                                        |
| The site renders the source files as they are, with no copy step                           | One source, no drift. Raw `.md` sits at the same path for agents.                                                                       | Never, ideally.                                                                  |
| Astro and Starlight, with a custom landing page                                            | Static, fast, good search. Starlight handles docs pages; the landing page shows personality.                                            | Starlight blocks the design we want.                                             |
| Core and profile kept apart                                                                | Tommy's preferences shouldn't pose as universal rules.                                                                                  | Never.                                                                           |
| Fonts self-hosted by Astro's `fonts` config, upright Fraunces with `display: optional`     | Measured on slow 4G: landing went from 447 KB to 195 KB, load from 2.8 s to 1.3 s, layout shift from 0.19 to 0. No third-party request. | A cold first visit showing the fallback serif bothers us more than layout shift. |
| Looping animations: a pause button, paused off-screen, dash animation runs only on arrival | WCAG 2.2.2 needs a pause control. Dash animations repaint on the main thread every frame.                                               | We add more motion.                                                              |

## Gaps

| Gap                                                         | State    | Revisit when                        |
| ----------------------------------------------------------- | -------- | ----------------------------------- |
| All content is AI-drafted and not yet reviewed by Tommy     | Deferred | Before any public launch            |
| No evidence yet that SWE OS improves agent results          | Unknown  | After the first eval runs           |
| No domain, hosting, or license chosen                       | Deferred | Before going public                 |
| Only one guide exists                                       | Deferred | After dogfooding shows which next   |
| CI hasn't run on a remote host                              | Unknown  | On the first push                   |
| Codex's first version is in `.archive/codex-v0/`, untracked | Deferred | Tommy deletes it once he's compared |
