# Tommy's SWE OS

AI made code cheap. Judgment is still the expensive part.

SWE OS is how I engineer, written down once for two readers. People read it as a site to learn the concepts that separate a vibe-coder from a software engineer. Coding agents read the same files as instructions, so they shape ideas before choosing stacks, build complete features, and show evidence instead of confidence.

## Use it with an agent

There's nothing to install. Point your agent at the entry page:

> Use Tommy's SWE OS for this: start at `skills/README.md` in this repo (or `/skills/README.md` on the site).

The agent picks a skill (shape, build, debug, review, explain, or learn), then loads only the concerns and guides the task needs.

## What's inside

| Path                                              | What it is                                                     |
| ------------------------------------------------- | -------------------------------------------------------------- |
| [skills/](skills/README.md)                       | Agent workflows. The entry point for agents.                   |
| [core/principles.md](core/principles.md)          | Fourteen rules of engineering judgment.                        |
| [core/concerns/](core/concerns/README.md)         | What a feature can get wrong, and how deep to go on each risk. |
| [core/guides/](core/guides/README.md)             | Concept guides for people and agents.                          |
| [profile/](profile/voice.md)                      | My voice, how I learn and work, and default tech choices.      |
| [templates/project/](templates/project/AGENTS.md) | Starter `AGENTS.md` and `PROJECT.md` for new projects.         |
| [evals/](evals/README.md)                         | A/B scenarios that test whether this improves agent work.      |
| `src/`                                            | The Astro site that renders all of the above.                  |

The Markdown files are the source of truth. The site renders them as they are, and serves each one as raw Markdown at the same path for agents.

## Develop

Node 22.19 or newer.

```sh
npm ci
npm run dev      # http://127.0.0.1:4321
npm run check    # format, links, tests, types, build
npx playwright install chromium && npm run test:browser
```
