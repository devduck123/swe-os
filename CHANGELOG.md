# Changelog

Projects pin a version in their `AGENTS.md`. Check here before moving to a new one. Versions follow [semver](https://semver.org): a minor version can change skill steps or rules, and a major version means a project's `AGENTS.md` may need edits.

## Unreleased

- **Design taste pushes past the first idea.** Agents say what the obvious version would be and build something else. On a new product or a redesign, they write three short directions without asking, and ask once before building more than one, since that costs real tokens. New sections say to hire a designer for a real project, use code as your artist if you can't, and ask for art that feels drawn by a person: a hand or a real craft behind it, real range, art with a job, a bold layout. The "look at what others do" step is gone, because no agent followed it. The five-second motion rule now covers anything that moves on its own, not only loops.
- **A design eval.** A new scenario asks an agent to make a plain app feel like a product. The harness screenshots each result in both themes and measures the rules (accessibility, sideways scrolling, motion, touch targets), so graders judge the page and not only the diff. First result: Design 2.67 with SWE OS vs 1.33 without, at about 2× the cost, with gaps listed in the [evals README](evals/README.md#results-so-far).
- **Product pages lead with real use.** build-feature now says to lead with what people would use a product for most, because five of six sites in a private round led with the first example in the product's docs. start-project recommends preview deploys on the host a project already uses, and Vercel only if it has none.
- **A favicon and a social card, every time.** Design taste now asks for both on every site, drawn from the product's own art, because a site an agent built for me shipped without a social image. The brand template lists them, and the design eval measures what a tab and a shared link would show.
- **Design starts from what the product is.** Before drawing, agents learn what the product does, who uses it, and where it lives, then pick how serious it should feel. A tool should look at home on its platform, with the charm in the details and one metaphor at most. If they can't tell, they ask one question first, because a wrong guess costs a rebuild. Pages show the real product working, and copy stays plain. The lines that pushed every product toward playful are gone, and Design taste is shorter than before, with my palette moved to [its own page](profile/palette.md).
- **Agents critique their own work before reporting.** build-feature now ends by running review-change on its own diff and, for UI, looking at the screenshots cold as a senior designer would. On a real site, that kind of review found the bugs the builder's checks missed and drove the best design fixes, but only when I asked for it.
- **Product copy reads like a person.** Writing now covers a product's own words: say what it does plainly, no slogans or three-beat taglines, the app's real strings, plain status, and a reread for any line that could sit on another product's page.
- **A website gets the skills too.** start-project for its repo and build-feature for each change, even on a casual ask, and both skill descriptions now say so. Agents read SWE OS files one at a time, so a truncated read can't slip by. A product demo shows what sets the product apart, not only the common case, and each project fact lives in one doc.
- **start-project avoids three setup traps.** It pushes `main` before any other branch, since the first branch pushed becomes the default and Vercel's production branch. It scans secrets on pull requests, since the gitleaks action fails on a push that includes the first commit. And a website goes on Vercel with the import steps in the report. `.env.example` appears only when there are variables, and the template asks for the real SWE OS clone path.
- **Graders are more blind.** They ran from a folder named after the arm they were grading. Now they run from a neutral one.
- **Two readers, drawn.** The duck and its agent, a little robot duck, sit on the end of the dock and read one book together, and the note's arrow points at both. The landing copy says what SWE OS is plainly: a slightly opinionated guide for people and the coding agents that build with them.
- **The duck gets a world.** The landing page is a small pond at morning or night, with a dock, books, a mug, fireflies, and a lantern. The duck waves for real (the hand comes up beside its face), its eyes follow your pointer, it hops when you copy a prompt, and it tips its cap when you switch themes. Nothing loops: the ambient bits play for a few seconds and rest.
- **Stop pages with some personality.** "How I do it" is my note card, "Ask your agent" is a speech bubble from the duck with a Copy button, the draft notice is a small label, and each stop says where it sits in the track.
- **The track is a trail.** The track index is drawn as one path through the seven stages, with a duck pose for each and ticks on the stops you've read. Progress stays in your browser.

## v0.5.0 (2026-11-01)

Less, and more like me. The track is short pages of what people and their agents miss, and the site looks like the same person built it and ducktommy.com.

- **A shorter track.** Every stop is now a short page of what people and their agents miss: the idea, "Easy to miss", how I do it, and a link or two to go deeper. No code. The track went from 36,000 words with 64 code blocks to about 9,700 with none. "The standard" and "Before you ship, check" are gone; what teams add when stakes rise lives in the concern pages. Each concern page now links only the stops that cover its risk. Every stop glosses its terms and ends with an "Ask your agent" prompt. A learner test puts clarity (3.9) and usefulness (4.2) back at the long track's level.
- **A calmer site, and a duck.** The mascot is a duck in a graduation cap, drawn as a die-cut sticker that waves once on load. The landing page matches ducktommy.com: warm paper or deep slate, an editorial serif, and a list of real misses pulled from the stops. Gone: five pastel accents, the marquee, the stale demo, and the metadata chips above every stop.
- **A voice that sounds like me.** Agents talk like a friend who's great at engineering and design, not an older brother. Anything written as me is placeholder content in my simple style, for me to revise. The profanity rule and the "bro" examples are gone.
- **Evals pin their model.** The CLI's default moved to Fable 5.1, which made one round incomparable. Rounds that compare with earlier ones now pin Opus 5.5 with `ANTHROPIC_MODEL`.

## v0.4.0 (2026-10-17)

How I work, written down: a branch per change, designs priced before building, design taste, and a track that separates my habits from the standard. Projects pinned to v0.3.0 should read the guidance changes before moving.

**Guidance changes**

- **A branch and a PR for every change.** New rule 14. start-project commits the setup as the first PR and lists a ruleset on `main` for Tommy to turn on.
- **System design with real costs.** shape-project now prices each part at the expected audience, 10 times it, and a bad month, with the math shown and dated sources, and the user agrees to the design before setup. It lands in a new `docs/design.md` template.
- **Docs that stay current.** The project template says where docs live (PROJECT.md, `docs/design.md`, `docs/decisions/`) and to update AGENTS.md when work adds a command or convention. It can name an area Tommy is learning, and build-feature leaves a `TODO(human)` there.
- **Design taste.** [profile/design.md](profile/design.md) replaces the UI taste paragraph. Agents pick each product's own visual direction and are pushed past default styling: micro-interactions, real art, motion with character. A few rules don't bend: contrast, reduced motion, motion that never blocks, accessible art, and one token system per project. Agents look at how similar products handle a screen first (Mobbin, live sites). Brand art is kept as components in `components/brand/`, with its style and an index in a new `docs/brand.md` template. My portfolio's palette is there as an option, with its contrast fixed.
- **A fresh session per feature.** In the project eval, one long session made later messages cost 5 to 10 times the early ones. The README and build-feature now say to start a fresh session for each feature, with PROJECT.md complete enough to pick up from.
- **Build what was asked.** If build-feature would design something differently, it says so in one line and builds what was asked. It doesn't re-ask a question that's been answered, and goes with its recommendation when an answer doesn't settle it.
- **Reviews fix what they're asked to fix.** When asked for fixes too, review-change fixes every blocking finding before reporting, and picks the safer default when a fix needs a product decision.
- **Setup a stranger can follow.** start-project requires a CI secret scan, makes the local pre-commit hook optional, and runs its fresh-clone check in a temporary folder outside the project.
- **learn corrects first.** A new eval walks through a PR and quizzes a simulated user who gets two things wrong. The first round tied, and one SWE OS run never corrected the user because it was busy writing LEARNING.md. The walkthrough is now one outcome, corrections first, and SWE OS scores 2.92 vs 2.53. LEARNING.md is gitignored in public repos unless you say otherwise.
- **Talk to Tommy, not about him.** Graders caught replies saying "Tommy's default" to Tommy. Voice now says "your defaults".
- **Guidance fills gaps, not defaults.** skills/README.md and AGENTS.md now say SWE OS covers only what agents skip by default, plus my preferences. Where an agent's own defaults already do the job, it keeps them. "The standard" applies only when PROJECT.md says the project's maturity or exposure calls for it, and a rule stays only while evals show it helps.

**The track and the site**

- **My habits, apart from the standard.** Every track stop now ends with "How I do it" (what I do on my own side projects, labeled as mine), "The standard" (what teams add beyond that, each with the signal that it's time), and "Before you ship, check" (the floor, every time). "What I'd do" is gone. The sections are agent-drafted for now, and I'll rewrite them in my own words.
- **A sidebar split the same way.** Learn (the track, stages collapsed), How I build (my defaults, my design taste, and the recipes), Standards (the principles and one page per risk), Skills, and About me. The landing page's Concerns card is now Standards, and the How I build card links my defaults.

**Evals**

- **The project eval.** `node evals/project/run.mjs` builds a book club app over seven messages, with and without SWE OS, in a fresh session per message by default (`--sessions one` keeps one long session), then runs `npm install`, `npm test`, and `npm run build` on each final repo and reviews both blind. It's tested end to end with a stand-in `claude`. The scenario harness now shares its Claude helpers through `evals/harness/common.mjs`. With fresh sessions, SWE OS scored 2.63 vs 2.50 at 1.8× the cost.
- **A simulated user in the project eval.** When the agent ends a message with a question, a separate Claude playing the owner answers it from the facts, at most twice per turn, and never says "go ahead". `--fixed-answers` keeps the old fixed reply. The defaults are now a $120 budget and $12 per message, enough for all seven turns, and a review missing reasons gets one follow-up.
- **The skills keep their steps.** An ablation rewrote debug, review-change, and explain as outcomes only. All three scored lower than the current versions run the same day, so nothing was cut.

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
