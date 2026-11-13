---
title: Design taste
description: What I want UIs to feel like, the freedom agents have to get there, and the few rules that never bend.
freshness: durable
---

I don't design much by hand anymore. Agents go straight to code, and some of the best UIs I've shipped came from an agent trying something I wouldn't have thought of. So this page isn't a template. It's what I like, what separates a designed product from a vibe-coded one, and the few rules that keep a bold design usable.

## Start from what the product is

Learn the product before you draw anything. Read its README, any product or vision doc (it says what the product is for better than a feature list), its code, and what the person told you, and answer three questions: what does it do, who uses it, and where does it live? A phone app, a browser tab, and a tool in a Mac's menu bar want different pages.

Then pick the register, which is how serious it should feel. A tool that lives on someone's computer should look at home there: calm, in the platform's own type and surfaces, with the charm in the details. A personal site, a game, or a kids' app can be loud. My portfolio is expressive because it's about me. A Mac utility's page that leaned into poster art, with condensed capitals and road-sign buttons, read as goofy, and the only parts that looked right were its recreated app panels.

If what you can read doesn't answer those questions, ask one short question before you design, like who it's for or how serious it should feel. A wrong guess here costs a rebuild, not a tweak. Don't ask anything you can read for yourself.

## Go further than the default

Default framework styling shipped as-is isn't a design. Every product gets its own palette, type, shapes, and motion, picked with conviction within its register. Surprise me.

What I keep noticing on sites I love:

- **The real product, working.** If there's a product, show it: its real screens, states, and messages, moving on their own the way they do in use. Recreate them faithfully from the app. A page that only describes a product feels like a pitch.
- **Micro-interactions.** A button that gives a little when pressed, a checkbox that draws its tick, a toast that settles instead of popping.
- **Real art.** Illustrations, icons, and graphics drawn for this product, usually as inline SVG, instead of stock images or an emoji in a circle.
- **Motion with character.** Springy where the product is playful, smooth and quick where it's a tool. Motion explains a change: where something went, what just happened. CSS transitions first. In React, [Motion](https://motion.dev/) is the reference for springs, gestures, and exit animations.
- **Personality in the small places.** Empty states, loading states, errors, and the 404 get the same care as the main screen, in words and in pictures.
- **A favicon and a social card, every time.** People see both before they see the page, and a blank card makes a great site look unfinished. Draw them from the product's own art: an SVG favicon with a 180px Apple touch icon, and a 1200×630 social image with a title and description, rendered from the page so it stays in sync.
- **Type that fits the register.** A tool for one platform often wants that platform's own system font, with a fallback that still looks right to visitors on other platforms. Elsewhere, a display face that carries the mood, with a quiet text face doing the reading.

## No designer? Code can be your artist

For a real, legit project, hire a designer, and follow their lead once you have. If you can't, frontier models can make SVG illustrations, canvas scenes, and animation that feels drawn by a person. Use that before stock images, an icon pack, or a template. No artist worked on [my portfolio](https://www.ducktommy.com/), and its [Extras page](https://www.ducktommy.com/extras) shows every draft of its duck, from a crane through five sketches. First drafts of art are rarely good. Render it, look at it, and redraw.

## Don't build your first idea

Your first idea is everyone's first idea. In my first design eval, six agents given the same app made nearly the same screen: a greeting over a list of cards, on cream, with a floating add button. Before you build, say what the obvious version would be, then build something else. Change the layout and the structure, not only the colors.

On a new product or a redesign, write three directions first, a few sentences each, all in the product's register but different in layout and structure. That costs almost nothing, so don't ask.

Your three directions are probably everyone's three, too. In the next eval, three agents given the same app wrote the same three directions, word for word in places, and all built the same one. So cross out any direction someone could guess from the kind of product alone, like a recipe card for a cooking app or a notebook for a notes app. Replace it with one that grows from something only this product has: its people, its data, its name, or when and where it gets used. Build the strongest one left, and say in your report what the other two were.

Building more than one costs real tokens, so ask whoever's running you first, in one line, unless they've already told you to spend them. If they say no, or nobody's there to answer, build just one.

## Make it feel like a person made it

Clean, cute, and accessible is where agents land by default now, and it still feels generated. I want to feel the hand of whoever made it, and feel like they were thinking about me.

- **A skilled hand or a craft behind it.** Art built from perfect circles and rounded rectangles looks generated, but wobble everywhere and cartoon proportions read as a kid's book cover. Draw confident lines that vary on purpose, or follow a real craft's rules, like a woodblock's few inks or origami's flat folds.
- **Real range, played straight.** A character with one smile and one frown is a sticker. Give it feelings it commits to, like grumpy, smug, or relieved, and let the situation carry the joke instead of a mugging face.
- **Art with a job, in the right amount.** Each piece carries something a label would otherwise say. How much art a page holds depends on the register: a playful app can have it all over the main screen, while a tool gets one focal moment, like its app icon or a scene you find, and lets its own interface do the rest.
- **An idea I get without help.** One agent explained a product with a printed receipt, and I didn't get it. If a concept needs a caption to make sense, pick another.
- **One metaphor, once, with the product in it.** A metaphor earns the hero, not every section. Repeat it in the roadmap, the footer, and the 404, and it turns into a theme park. If the metaphor is about the product, show the product in the picture.
- **A bold layout.** One thing huge, scale that jumps, something that breaks the grid. Someone should recognize the page with its text blurred.
- **Plain words.** Say what it does the way you'd tell a friend: short, specific, calm. Product copy follows [Writing](writing.md) too, so no slogans, no three-beat taglines, and no line that would fit any app. A little humor goes a long way.

## Critique it before you show it

On my last product page, the biggest fixes came when I asked the agent to review it as a 10x designer, not while it was building. Do that before anyone sees it: look at screenshots at phone and desktop width, cold, as a senior product designer who knows the product.

- Can someone tell what this is and where it lives within five seconds?
- Does it fit the register, or does it look like a different kind of product?
- What looks generated? Template sections, icons in circles, three cards in a row, copy that would fit any app.
- Is the real product on the page? Is anything empty, static, or unfinished?
- Where does the eye land first, and is that the right thing?

Fix the worst problems, then look again. Your report gives an honest read of what's still weak. "It looks good" isn't a critique.

## What I've liked

- [My portfolio](https://www.ducktommy.com/): a big editorial serif, a dark, quiet [palette](palette.md), one focal visual with a soft glow and slow motion, and room to breathe.
- This site's landing page: the playful end, a little cute and a little animated, with a mascot.
- A coming-soon page for a desktop tool, drawn as the desktop itself: the system font, the app's real panels replaying real requests on their own, and the character kept to its app icon and a small scene in the wallpaper.
- [OpenPacks](https://backpacks-app.vercel.app/): a product screen kept neutral on purpose. That's the floor for a tool, not the goal.

## Keep the art: it's an asset

The art an agent draws for a product is some of the most valuable work in the repo, and the hardest to recreate exactly. Treat it like code: named, kept, and reused.

- **Each piece is a component.** Inline SVG in `components/brand/`, with props for size and pose, colors from theme tokens or `currentColor`, and its animation (reduced motion included) beside it. The favicon and social image go in `public/`.
- **One style, written down.** `docs/brand.md` describes the look (the character's proportions, stroke, corners, colors, and motion) and lists every asset in one line: what it is and where it's used. New art follows it. To change the style, change the doc first.
- **Reuse before drawing new.** Give the mascot a new pose before inventing a second character.
- **Don't replace or restyle an existing piece** unless asked. Add a variant instead.

## The rules that don't bend

Expressive never costs someone the ability to use the thing.

- **Contrast.** Text is at least 4.5:1 against what's behind it, large text 3:1, and a form field's edge and focus ring 3:1. Check every color pair you add, in every theme the product has.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, keep fades and drop movement, parallax, and looping animation. Anything that moves on its own for more than five seconds gets a pause control, whether it loops or repeats a few times, and delays count.
- **Motion never blocks.** Nobody waits for an animation to finish before they can act. UI transitions take 150 to 300ms. Animate `opacity` and `transform`, which don't make the page recompute its layout.
- **Art is accessible and light.** A decorative graphic is hidden from screen readers (`aria-hidden="true"` or empty `alt`), and a meaningful one gets a text alternative. Inline SVG and CSS before big images and heavy animation libraries. The page's main content still loads fast on a phone.
- **Keyboard and touch work.** Every interactive thing has a visible focus state and works by keyboard. Hover effects are a bonus, never the only way to find a control. Primary touch targets are about 44px.
- **One system per project.** Whatever direction you pick, write it down as tokens in the theme file: colors for light and dark, type, radius, shadows, and motion timing. Components use the tokens, never raw hex or one-off values, so the tenth screen matches the first. A site follows the system's theme and has a toggle that remembers the visitor's choice. With shadcn/ui, that's its [theme variables](https://ui.shadcn.com/docs/theming), and new ones go through `@theme inline`.

## Sources

- [shadcn/ui theming](https://ui.shadcn.com/docs/theming) and [dark mode](https://ui.shadcn.com/docs/dark-mode)
- WCAG 2.2: [contrast minimum (1.4.3)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast (1.4.11)](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), and [pause, stop, hide (2.2.2)](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Motion for React](https://motion.dev/docs/react)
- [Apple's guidance on hit targets](https://developer.apple.com/design/human-interface-guidelines/accessibility#Buttons-and-controls)
