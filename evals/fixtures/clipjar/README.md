# Clipjar

Clipboard history for macOS. Clipjar lives in the menu bar and keeps everything you copy, so the thing you copied ten minutes ago is still one shortcut away.

## How it works

- Copy as usual. Clipjar saves text, links, images, and files.
- Press ⌥⌘V to open the panel under the menu bar icon. Type to filter, use the arrow keys, and press Return to paste into the app you were in.
- Pin the clips you reuse, like an address or a code snippet. Pinned clips stay at the top and never expire.
- Clipjar skips copies from password managers and anything an app marks as concealed.

## Privacy

Everything stays on your Mac, in an encrypted SQLite file. There's no account, no sync, and Clipjar makes no network requests.

## Status

Private beta, about 40 testers. No public download or release date yet.

- Works: history, search, pinning, the password-manager skip, and a 30-day default for how long clips are kept.
- In progress: images over 20 MB, and a setting to exclude more apps.
- Not planned yet: sync between Macs, and snippets with placeholders.

Requires macOS 14 or later. Built with SwiftUI.

## Repo

- `Sources/`: the app (not in this checkout).
- `docs/ui.md`: the panel's layout and every string it shows.
- `site/`: the website, deployed as static files on Vercel. Empty so far.
