# Agent instructions

<!-- Replace everything in angle brackets. Delete lines that don't apply. Keep this file short. -->

<One sentence: what this project is and who it's for.>

Read [PROJECT.md](PROJECT.md) for the current goal, decisions, and known gaps. It's this project's tracker: update it in the same PR as any work that finishes, changes, or adds to the plan, a decision, or a gap.

## How we engineer

This project uses Tommy's SWE OS <v0.0.0>. Read it from whichever source is available:

- A local copy at `~/swe-os`, checked out at that version: `git -C ~/swe-os checkout <v0.0.0>`.
- Otherwise, print https://raw.githubusercontent.com/devduck123/swe-os/<v0.0.0>/skills/README.md with `curl`, and fetch the files it links the same way.

Start at `skills/README.md`. Pick the matching skill and load only the concerns and guides the task needs. This file and PROJECT.md override SWE OS wherever they disagree.

<Optional: "Use the profile in <path> instead of Tommy's." Point it at your own voice and default-stack files.>

## Commands

- Install: `<command>`
- Run: `<command>`
- Check (format, types, tests): `<command>`

Run the check command before you say a change is done.

## How we work

- **Git:** trunk-based. Each feature or fix gets a short-lived branch off `main` and one PR, squash-merged once `check` passes. Nobody pushes to `main` directly.
- **Docs live in the repo.** PROJECT.md is the tracker. [docs/design.md](docs/design.md) holds the system design and what it costs. [docs/brand.md](docs/brand.md) holds the look of the product's art and lists every piece. A decision that needs more than a row in PROJECT.md gets its own `docs/decisions/YYYY-MM-DD-title.md`, linked from that row.
- **Keep this file current.** When work adds a command, a convention, or a rule an agent couldn't infer from the code, update this file in the same PR.
- <Optional: "Tommy is learning <area>. In that area, leave one `TODO(human)` per feature for him to write.">

## Project rules

- <Conventions an agent can't infer from the code, like "all money is integer cents".>
- <Things that need a human, like "never run migrations against production".>
