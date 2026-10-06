# Working on SWE OS

This repo is the SWE OS itself. Read [PROJECT.md](PROJECT.md) for what's in progress and what's deferred.

- Use the SWE OS skills on this repo too. Start at [skills/README.md](skills/README.md).
- The Markdown in `core/`, `profile/`, `skills/`, and `templates/` is the content. `src/` only renders it. Never copy content into `src/`.
- Each idea lives in one place: principles for judgment, concerns for risks, guides for teaching, skills for workflow, profile for Tommy's preferences. Link instead of repeating.
- All writing follows [profile/voice.md](profile/voice.md). Read it before editing any page.
- Guides you draft stay `status: draft` until Tommy reviews them.
- Prefer deleting guidance that doesn't help over adding more.
- Use Node from `.nvmrc` (`nvm use`). Run `npm run check`. For site changes, also run `npm run test:browser` and look at the pages at phone and desktop widths.
- `npm run dev` live-reloads Markdown edits. The sidebar is built from the file list at startup, so restart it after adding or removing a page.
- Public repo: no employer code, internal names, credentials, or private incidents.
- Record deferred gaps in PROJECT.md. Don't claim eval results nobody ran.
