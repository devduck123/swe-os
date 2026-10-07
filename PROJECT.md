# Project

## Now

**v0.1: public MVP.** SWE OS goes public as both a learning track and an agent toolkit, with the gap between vibe coding and engineering as the through-line. Maturity: prototype. Nothing is deployed yet.

Done when:

- A newcomer can land on the site and follow the track from "what's the difference?" to "here's the stack I'd ship, and why". Every stop has been reviewed by Tommy. Done; tuning comes after launch.
- Claude Code and Codex both pick and follow the right skill when pointed at SWE OS, from the site and from a local clone.
- The site is live on Vercel, under a license, with no private details in the repo or its history.

`start-project` on a real project and the first eval runs moved to after launch. Until evals run, nothing claims agents do better with SWE OS.

## Next

1. Tommy creates the Vercel project from the repo. The site goes live on its `vercel.app` domain.
2. Test both agent paths with Claude Code and Codex from a fresh session in an unrelated folder, and fix what breaks.
3. Before the repo goes public: secret-scan every branch's history, grep for private names, and delete stale branches.
4. Tommy makes the repo public.
5. After launch:
   - tune the track (its own thread)
   - run the evals, starting with `overhead`, `secrets`, `dependency`, and `pushback`
   - run `start-project` on a real side project
   - the two-week `learn` trial
   - a custom domain, when wanted

## Decisions

| Decision                                                                                                 | Why                                                                                                                                                                                               | Revisit when                                                                     |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| No installer. Agents read the repo or site.                                                              | Nothing to sync or version per project. A project's AGENTS.md records which version it follows.                                                                                                   | Reading over the network proves too slow or flaky.                               |
| Two agent paths: raw Markdown from the site with curl, or a local clone                                  | Claude Code's web fetch passes pages through a small model, so rules can come back paraphrased. Codex's default sandbox has no network. A clone gives exact text offline.                         | Tests show one path is enough.                                                   |
| Hosted on Vercel Hobby at the `vercel.app` domain                                                        | Free, a preview per PR, and no domain needed to launch. The site URL comes from Vercel's production domain at build time; `SITE_URL` overrides it.                                                | A custom domain, or anything commercial (Hobby is non-commercial).               |
| Writing under CC BY 4.0; code and templates under MIT                                                    | CC licenses aren't meant for code. Templates get copied into projects, so they shouldn't need credit.                                                                                             | Never.                                                                           |
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
| Concern pages and skills are AI-drafted and only spot-reviewed by Tommy                   | Deferred | Evals or real use show agents missing what they should catch                                  |
| The agent paths are untested from outside this repo                                       | Unknown  | Next step 2                                                                                   |
| No evidence yet that SWE OS improves agent results                                        | Unknown  | After the first eval runs                                                                     |
| The learn loop is untested on Tommy                                                       | Unknown  | After two weeks of real PRs: did he run walkthroughs, and does he remember what they covered? |
| Windows paths and line endings are handled in code but never run on Windows               | Unknown  | First Windows contributor or CI runner                                                        |
| Drizzle snippets target stable 0.45; 1.0 changes `casing` and relational `where`          | Deferred | Drizzle 1.0 ships stable                                                                      |
| Local-first setup relies on a `pg_isready` healthcheck, but no compose template ships one | Deferred | First real run of `start-project`                                                             |
