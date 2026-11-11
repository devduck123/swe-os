# The panel

The menu bar icon is a small jar outline. Clicking it, or pressing ⌥⌘V, opens a 360pt-wide panel under it with the system's material background.

## Layout, top to bottom

1. A search field, placeholder "Search clips".
2. **Pinned**, if any are pinned.
3. **Today**, newest first.
4. **Earlier**.
5. A footer with "Settings…" on the left and "⌥⌘V" on the right.

Each row shows the clip (one line of text, a link's title and domain, an image thumbnail, or a file icon and name), then the source app and age in secondary text, like "Safari · 2m". The selected row is highlighted with the accent color. Pinned rows show a pin.

## Strings

| When                               | It shows                                                                |
| ---------------------------------- | ----------------------------------------------------------------------- |
| Nothing copied yet                 | "Nothing here yet. Copy something and it lands in the jar."             |
| Search with no matches             | "No clips match “{query}”."                                             |
| After pasting                      | A small toast near the icon: "Pasted into {app}"                        |
| A copy from a password manager     | Nothing is saved. In Settings: "Skipped 3 copies from 1Password today." |
| Pinning                            | "Pinned" (toast)                                                        |
| A clip older than the keep setting | Removed quietly                                                         |

## Settings

- Keep clips for: 7 days, 30 days (default), or forever.
- Open with: ⌥⌘V (default), or record another shortcut.
- Ignore copies from: password managers (on), plus apps you pick (in progress).
