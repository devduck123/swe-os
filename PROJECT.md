# Project

## Now

**v0.1: public MVP.** SWE OS goes public as both a learning track and an agent toolkit, with the gap between vibe coding and engineering as the through-line. Maturity: prototype. Nothing is deployed yet.

Done when:

- A newcomer can land on the site and follow the track from "what's the difference?" to "here's the stack I'd ship, and why". Every stop on the track has been reviewed by Tommy, and cut where it didn't earn its place.
- `start-project` sets up a real side project that passes its own checks, with secrets protected, on the first run.
- The secrets and dependency evals show agents catching what the new guidance targets.
- The site is live on a domain, under a license, with no private details anywhere.

## Next

1. Tommy reviews the whole track, cuts what doesn't earn its place, and marks the rest reviewed.
2. Test `start-project` on one real side project, and fix what it gets wrong.
3. Run the evals in `evals/`, starting with `overhead`, `secrets`, `dependency`, and `pushback`.
4. Launch decisions: license, domain, hosting (Vercel per defaults), and the `site` URL for the sitemap and `llms.txt`.
5. Before launch: re-check every fast-moving claim, and do a final review of the public README and landing page.
6. After launch: the two-week `learn` trial, dogfooding `build-feature`, and guides picked by what `learn` keeps surfacing.

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
| Agents draft the whole track in Tommy's voice; Tommy reviews and cuts                                    | Tommy asked for full coverage of the lifecycle first and prioritization after. Reviewing a full draft is faster than writing from outlines.                                                       | Reviews show the drafts need more rewriting than writing fresh would.            |
| The track follows the lifecycle: Understand, Design, Build, Verify, Ship, Operate, Improve               | It matches the original content model. Vibe coders rarely see past Build, and the later stages are where production bites. The sidebar groups stops by `stage`.                                   | Tommy's cut leaves a stage with one stop, so it merges into a neighbor.          |
| Each lesson has one home; other stops link to it                                                         | The audit found the same lesson in up to five stops, and copies were already drifting apart (cliffs said "month" in one place and "30 days" in another).                                          | A lesson needs different framing in two stages.                                  |
| Stops target 800–1,200 words, and "What changes at scale" is dropped unless it's concrete                | Tommy's bar is less reading, easier understanding. The template had set the length, not the content.                                                                                              | Readers ask for more depth on a stop.                                            |
| UI concerns merged into `ui-quality`; the personal-data floor is limited to sensitive data               | Every UI change was pulling in five concerns, and every login app was getting GDPR-grade treatment.                                                                                               | Evals show agents missing UI issues the merged page doesn't name.                |
| Evals use held-out scenarios, an isolated A arm, and a cost column                                       | The old scenarios repeated SWE OS text, so B won by recall. The A arm could load globally installed skills.                                                                                       | Never.                                                                           |
| Every guide has "What the vibe-coded version misses" and starts "What I'd do" from the simplest option   | That gap is the product. Simple-first is Tommy's default.                                                                                                                                         | Never.                                                                           |
| Fonts self-hosted by Astro's `fonts` config, upright Fraunces with `display: optional`                   | Measured on slow 4G: landing went from 447 KB to 195 KB, load from 2.8 s to 1.3 s, layout shift from 0.19 to 0. No third-party request.                                                           | A cold first visit showing the fallback serif bothers us more than layout shift. |
| Looping animations: a pause button, paused off-screen, dash animation runs only on arrival               | WCAG 2.2.2 needs a pause control. Dash animations repaint on the main thread every frame.                                                                                                         | We add more motion.                                                              |

## Gaps

| Gap                                                                                       | State    | Revisit when                                                                                  |
| ----------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| Guides and concern pages are AI-drafted; the profile is reviewed as a starting point      | Deferred | Before any public launch                                                                      |
| No evidence yet that SWE OS improves agent results                                        | Unknown  | After the first eval runs                                                                     |
| The learn loop is untested on Tommy                                                       | Unknown  | After two weeks of real PRs: did he run walkthroughs, and does he remember what they covered? |
| No domain, hosting, or license chosen                                                     | Deferred | Before going public                                                                           |
| Windows paths and line endings are handled in code but never run on Windows               | Unknown  | First Windows contributor or CI runner                                                        |
| The 22-stop track is agent-drafted and unreviewed                                         | Deferred | v0.1 launch                                                                                   |
| Drizzle snippets target stable 0.45; 1.0 changes `casing` and relational `where`          | Deferred | Drizzle 1.0 ships stable                                                                      |
| Local-first setup relies on a `pg_isready` healthcheck, but no compose template ships one | Deferred | First real run of `start-project`                                                             |
