# Tommy's SWE OS

AI made code cheap. Judgment is still the expensive part.

**Read it at [tommy-swe-os.vercel.app](https://tommy-swe-os.vercel.app).**

SWE OS is how I build software, written once for two readers. People read it as a site to learn what separates a vibe coder from a software engineer. Coding agents read the same files as instructions, so they shape ideas before picking a stack, build complete features, and show evidence instead of confidence.

## Learn

Start with [the track](https://tommy-swe-os.vercel.app/guides/): 22 stops from "what's the difference?" to "here's the stack I'd ship, and why", following real work from understanding the problem to running it in production. Every stop ends with what the vibe-coded version misses.

## Use it with an agent

There's nothing to install. Pick one:

**Quick: read it from the site.** Paste this into Claude Code, Codex, Cursor, or whatever you use:

> Use Tommy's SWE OS for this task. Download https://tommy-swe-os.vercel.app/skills/README.md as raw text with curl, follow the skill that fits, and fetch each file it links the same way.

**Best: keep a copy on your machine.** You get the exact text, and it works offline and in sandboxes without network access, like Codex's default.

```sh
git clone https://github.com/devduck123/swe-os ~/swe-os
```

> Use Tommy's SWE OS at ~/swe-os for this task. Start at skills/README.md and follow the skill that fits.

The agent picks a skill (shape, start, build, debug, review, explain, or learn), then loads only the concerns and guides the task needs. Your project's own `AGENTS.md` always wins. To make it yours, fork the repo and rewrite `profile/`.

## What's inside

| Path                                              | What it is                                                     |
| ------------------------------------------------- | -------------------------------------------------------------- |
| [core/guides/](core/guides/README.md)             | The track: 22 stops across the software lifecycle.             |
| [core/recipes/](core/recipes/README.md)           | Whole setups, like the side-project stack.                     |
| [core/principles.md](core/principles.md)          | Fourteen rules of engineering judgment.                        |
| [core/concerns/](core/concerns/README.md)         | What a feature can get wrong, and how deep to go on each risk. |
| [skills/](skills/README.md)                       | Seven agent workflows. The entry point for agents.             |
| [profile/](profile/tommy.md)                      | Who I am, my voice, how I learn, and my default stack.         |
| [templates/project/](templates/project/AGENTS.md) | Starter `AGENTS.md`, `PROJECT.md`, and `CLAUDE.md`.            |
| [evals/](evals/README.md)                         | A/B scenarios for testing whether this improves agent work.    |
| `src/`                                            | The Astro site that renders all of the above.                  |

The Markdown files are the source of truth. The site renders them, and serves each one as raw Markdown at the same path for agents, with an index at `/llms.txt`.

## Develop

Node 22.19 or newer (`nvm use`).

```sh
npm ci
npm run dev      # http://127.0.0.1:4321
npm run check    # format, links, tests, types, build
npx playwright install chromium && npm run test:browser
```

## License

The writing is [CC BY 4.0](LICENSE-CONTENT.md): reuse it with credit. The code and templates are [MIT](LICENSE).
