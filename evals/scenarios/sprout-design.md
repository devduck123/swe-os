# Make Sprout feel like a product

This one measures [Design taste](../../profile/design.md) directly, so unlike the other scenarios, what it rewards is written in SWE OS. The prompt asks for feel and names none of the rules. The harness screenshots each result and measures the rules itself, so a grader judges the page and not only the diff.

## Task

> Sprout works, but it looks like a homework assignment. Make it feel like a real product, something people would actually want to open every morning. It's for people who keep killing their houseplants, and most of them will use it on their phone.

## Starting state

A small working app in plain HTML, CSS, and JavaScript, with no build step, hosted as static files on GitHub Pages. Plants are saved in `localStorage`. You can add a plant, mark it watered, and remove it. It's almost unstyled. The seed data has an overdue plant, one due today, and one with a very long name.

If asked: Yes, spend the tokens if it is for exploring design directions. Otherwise use your judgment.

## Reviewer-only notes

A strong run:

- **Picks a direction that fits this product.** A palette, type, shapes, and motion chosen for people who feel a bit guilty about their plants, with a point of view. Not a generic card layout that could be any app, and not the usual gradient and rounded-card template.
- **Feels made by a person.** The art looks drawn by hand, with uneven lines, and any character has real range. The layout is recognizable on its own, not a greeting over a list of cards. Tidy and cute with one mascot on a card list is a 2 on Design, however clean it is.
- **Draws real art.** Illustrations made for Sprout as inline SVG, like a plant that droops when it's overdue and perks up when watered. Emoji standing in for art doesn't count. The art is easy to find and reuse, not buried in a long script.
- **Makes the daily action feel good.** Watering a plant gives feedback that explains the change: the plant perks up, the count changes, the item moves. Motion is short, and it never makes anyone wait.
- **Cares about the small states.** The empty first run, all plants happy, an overdue plant, and the long name all look intended. The words have personality.
- **Keeps it usable.** Text contrast holds at 4.5:1 in every theme it offers, and it either follows the system's dark mode well or stays readable in it. Reduced motion is honored. Everything works by keyboard with a visible focus state. Buttons are about 44px on a phone. Removing a plant can't happen by accident next to the main action. Colors and motion timing live in tokens, not one-off values.
- **Keeps it working and light.** Adding, watering, removing, and saved data all still work, including data already saved on someone's device. It stays static files with no build step, and needs no heavy library.
- **Verifies by looking.** It opens the page at phone width and checks what it sees, in both themes and from the keyboard, and says what it didn't check.

Asking once before spending extra tokens on exploring directions is fine. Deduct for animation that moves on its own past five seconds with no pause control, art that hides information from screen readers, a framework or build step nobody asked for, or claiming visual checks it never ran.
