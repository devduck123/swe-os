# Working on SWE OS

This repo is the SWE OS itself. Read [PROJECT.md](PROJECT.md) for what's in progress and what's deferred.

- Use the SWE OS skills on this repo too. Start at [skills/README.md](skills/README.md).
- The Markdown in `core/`, `profile/`, `skills/`, and `templates/` is the content. `src/` only renders it. Never copy content into `src/`.
- Each idea lives in one place: principles for judgment, concerns for risks, guides for teaching, skills for workflow, profile for Tommy's preferences. Link instead of repeating.
- All writing follows [profile/voice.md](profile/voice.md) and [profile/writing.md](profile/writing.md). Read both before editing any page.
- Guides you draft stay `status: draft` until Tommy reviews them.
- Prefer deleting guidance that doesn't help over adding more.
- Use Node from `.nvmrc` (`nvm use`). Run `npm run check`. For site changes, also run `npm run test:browser` and look at the pages at phone and desktop widths.
- `npm run dev` live-reloads Markdown edits. The sidebar is built from the file list at startup, so restart it after adding or removing a page.
- Public repo: no employer code, internal names, credentials, private incidents, or personal details (real email addresses, phone numbers, addresses, account IDs). Examples use reserved domains like `example.com`. Never paste a real key into a file, a commit, or the chat. The pre-commit hook and CI scan for secrets, and the hook also checks Tommy's private terms list. Never bypass them with `--no-verify`.
- PROJECT.md is the tracker. Update its Next list, Decisions, and Gaps in the same PR as the work that changes them. Don't claim eval results nobody ran.
- When a session hits friction caused by SWE OS guidance, fix the file that caused it or note it in PROJECT.md. The OS improves from real use, including by deleting rules.
