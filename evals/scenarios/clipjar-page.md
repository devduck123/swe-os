# A coming-soon page for a Mac utility

This one measures [Design taste](../../profile/design.md) on a product unlike Sprout: a serious tool that lives in a Mac's menu bar, with a name that invites a cute mascot. Design taste says to start from what the product is, so unlike most scenarios, what it rewards is written in SWE OS. The prompt names none of it. The harness screenshots the page and measures the rules, so a grader judges the page and not only the diff.

## Task

> Clipjar is in private beta. Build its coming-soon page in site/, something I can link from my portfolio. Make it look great.

## Starting state

A repo for a macOS menu bar app. The README says what it does, who it's for in passing, what works, what's in progress, and that there's no public download yet. `docs/ui.md` describes the panel and lists every string it shows. `site/` is empty and deploys to Vercel as static files. There's no app icon or other art.

If asked: It's for developers and writers who copy a lot. It should feel like a polished, native Mac utility. Use your judgment on everything else and finish.

## Reviewer-only notes

A strong run:

- **Reads the product first.** It uses the README and `docs/ui.md`, and the page shows it understood what Clipjar is: a quiet utility in the menu bar, for people who copy a lot.
- **Picks a register that fits a Mac tool.** Calm, native-feeling type and surfaces, with charm in the details. A kids'-book cartoon of a jar, poster type, or a theme park of jar puns is the wrong register, however well drawn: Design 1 at most. A generic SaaS template (gradient hero, three icon cards, pricing) is also a 1.
- **Shows the real product.** The panel recreated from `docs/ui.md`, with its real strings, ideally working: a clip copied, ⌥⌘V, the panel opening, Return, "Pasted into Notes". Invented features, screens, or strings count against it.
- **Uses art with restraint.** At most one focal piece, like an app icon or one scene, and one metaphor at most. The jar can be a mark without becoming a character on every section.
- **Writes plain, specific copy.** What it does and why it's safe, said simply. No slogans, no three-beat taglines, no line that would fit any app.
- **Is honest about status.** Private beta, no download, no release date. No fake download button, waitlist form with nowhere to send it, pricing, testimonials, or user counts beyond the README's.
- **Finishes the edges.** A favicon and a social card from the product's own art, a sensible title and description, and a 404 if it adds pages.
- **Keeps it usable.** Contrast holds at 4.5:1 in every theme it offers. Reduced motion is honored, anything moving on its own past five seconds can be paused, everything works by keyboard with a visible focus state, and nothing scrolls sideways on a phone.
- **Verifies by looking.** It opens the page at phone and desktop width, in both themes, critiques what it sees, and says what it didn't check.

Asking one question about the audience or the feel before designing is fine. So is asking once before building several directions. Deduct for a build step or framework nobody asked for when static files would do, and for claiming visual checks it never ran.
