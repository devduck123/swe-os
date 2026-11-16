# Agent instructions

<!-- Replace everything in angle brackets. Delete lines that don't apply. Keep this file short. -->

<One sentence: what this project is and who it's for.>

Read [PROJECT.md](PROJECT.md) for the current goal, decisions, and known gaps. It's this project's tracker: update it in the same PR as any work that finishes, changes, or adds to the plan, a decision, or a gap.

## How we engineer

This project uses SWE OS <v0.0.0>. Read it from whichever source is available:

- A local clone at `<swe-os clone, like ~/swe-os>`. Read each file at that version without changing the clone's checkout: `git -C <swe-os clone> show <v0.0.0>:skills/README.md`. If the tag is missing, run `git -C <swe-os clone> fetch --tags` first. Links are relative to the file they're in, so turn each into a path from the repo root first: `../core/principles.md` in `skills/README.md` is `core/principles.md`.
- Otherwise, print https://raw.githubusercontent.com/devduck123/swe-os/<v0.0.0>/skills/README.md with `curl`, and fetch the files it links the same way.

Start at `skills/README.md`. Pick the matching skill and load only the concerns and guides the task needs. This file and PROJECT.md override SWE OS wherever they disagree.

<Optional: "Use the profile in `<your profile folder>` instead of SWE OS's." Copy the files from SWE OS's `profile/` you want to change and edit them. `voice.md` and `defaults.md` matter most. Any file the folder doesn't have falls back to SWE OS's.>

## Commands

- Install: `<command>`
- Run: `<command>`
- Check (format, types, tests): `<command>`

Run the check command before you say a change is done.

## How we work

- **Git:** trunk-based. Each feature or fix gets a short-lived branch off `main` and one PR, squash-merged once `check` passes. Nobody pushes to `main` directly.
- <Optional: "Agents merge their own PRs once the gate passes." Add it when the user hands the repo over. Without it, an agent waits for their approval.>
- **Docs live in the repo.** PROJECT.md is the tracker. [docs/design.md](docs/design.md) holds the system design and what it costs. [docs/brand.md](docs/brand.md) holds how the product sounds and, if it has art, its look and every piece. A decision that needs more than a row in PROJECT.md gets its own `docs/decisions/YYYY-MM-DD-title.md`, linked from that row.
- **Keep this file current.** When work adds a command, a convention, or a rule an agent couldn't infer from the code, update this file in the same PR.
- <Optional: "The user is learning <area>. In that area, leave one `TODO(human)` per feature for them to write.">

## Project rules

- <Conventions an agent can't infer from the code, like "all money is integer cents".>
- <Things that need a human, like "never run migrations against production".>
