# Brand

What SWE OS looks like, so new art matches the old. This site follows the same rule it gives other projects in [profile/design.md](../profile/design.md): each piece of art is a component in `src/components/brand/`, and this page describes the style. To change the style, change this page first.

## The feel

Calm pages and expressive art, as if drawn by the person who made [ducktommy.com](https://www.ducktommy.com/). The page is quiet: warm paper or deep slate, an editorial serif, plenty of space. The art carries the personality: a plush duck living in a small hand-drawn world, a pond at night or in the morning.

## The duck

A plush toy duck in a graduation cap, drawn as a die-cut sticker.

- **Proportions:** a big round head wider than the body, a small oval tummy, nubby arms that dangle long like a little monkey's, and two flat orange feet. The cap tilts about 7° to the left, with an orange tassel on the right.
- **Line:** warm brown ink, `oklch(0.3 0.04 55)`, about 2.4 units on the 104-unit-wide duck. Round joins.
- **Sticker edge:** a white die-cut border, `#fffdf6`, 9 units wide, behind every part, including the arms. A part that moves takes its own border with it.
- **Colors:** body `oklch(0.93 0.1 97)`, shade `oklch(0.87 0.115 88)`, beak and feet `oklch(0.76 0.15 50)`, cap `oklch(0.27 0.035 268)`, blush `oklch(0.8 0.1 22 / 0.55)`.
- **Character:** curious and a little earnest. It reads, looks around, and waves. It never looks smug or corporate.

## Scenes and marks

- **Scene art** (the pond, dock, lamp, reeds, stars) uses the same brown line, but thinner and without a sticker edge, so the duck stays the focus. Shapes are slightly uneven, like they were drawn by hand: no perfect circles or ruler-straight lines.
- **Night** is deep slate into a dusky plum at the horizon, with a butter moon and warm lamp light. **Morning** is warm paper into peach, with a soft sun and mist. Each theme gets its own scene, not a recolor.
- **The trail** on the track map is one dashed scene line that winds through the stops, with stepping stones for stops, a patch of ground under each stage's duck, and a small flag at the end. A stop you've read gets a butter stone and a coral tick, drawn on once.
- **Hand-drawn marks** (underlines, arrows, circles, highlights) are single SVG strokes with round caps in the accent color or soft ink, and handwritten notes use Caveat. Use them sparingly, a few per page, where Tommy would scribble on a printout.

## Motion

- Springy and short. Each move has a small wind-up, the move, and a settle: a wave lifts the hand toward the face, and the body leans and the head tilts with it.
- Ambient motion (fireflies, ripples, the lamp) plays for a few seconds when the page loads, then rests. Nothing loops on its own, so no pause control is needed. Hover, scroll, and actions bring it back to life.
- The duck reacts to the reader: its eyes follow the pointer, it hops when something is copied, and its cap tips when the theme changes.
- Under reduced motion, the art is still and fully drawn.

## Assets

| Asset       | File                                   | Used on                                                                                   |
| ----------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| The duck    | `src/components/brand/Duck.astro`      | Site title, landing, footer, 404, stops                                                   |
| Favicon     | `public/favicon.svg`                   | Browser tab (a still duck)                                                                |
| Share image | `public/og.png`                        | Link previews (a screenshot of the hero)                                                  |
| Stage poses | `src/components/brand/StagePose.astro` | The track map on `/guides/`, one per stage (the same duck until each stage gets its pose) |
