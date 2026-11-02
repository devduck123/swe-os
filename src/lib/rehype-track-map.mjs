// The track index (core/guides/README.md) lists its stops as `### Stage` headings, each followed
// by a numbered list. On the site, this turns that run of headings and lists into a journey map:
// the same headings, lists, and links, wrapped in elements the map's CSS and script can style.
// Nothing is added to the Markdown, so the raw file and llms.txt stay as they are.
//
// Two things here need Astro components, so the plugin leaves an empty `<span data-slot>` for
// src/components/MarkdownContent.astro to fill: the reading progress and each stage's duck pose.
import { repoPath } from './routes.mjs';

const stages = [
  'understand',
  'design',
  'build',
  'verify',
  'ship',
  'operate',
  'improve',
];

const el = (tagName, properties, children = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const text = (value) => ({ type: 'text', value });
const isBlank = (node) => node.type === 'text' && !node.value.trim();
const textOf = (node) =>
  node.type === 'text'
    ? node.value
    : (node.children ?? []).map(textOf).join('');

// The path sways left and right as it goes down the page. Each point on it (a stage marker or a
// stop) gets a value from -1 to 1, and CSS turns that into an offset.
const sway = (index) => Math.round(Math.sin(index * 0.72 + 0.5) * 100) / 100;

// A hand-drawn tick, shown on stops you've read. pathLength lets CSS draw it on with one value.
const tick = () =>
  el(
    'svg',
    {
      className: ['track-stop__tick'],
      viewBox: '0 0 32 32',
      ariaHidden: 'true',
      focusable: 'false',
    },
    // Drawn twice, like the duck: a paper-colored edge under the ink, so it reads on any stone.
    ['track-stop__tick-edge', 'track-stop__tick-ink'].map((name) =>
      el('path', {
        className: [name],
        d: 'M5.5 17.5c2.4 1.6 4.6 3.9 6.6 7 3.1-7.4 8-13.6 14.6-19.2',
        pathLength: '1',
      }),
    ),
  );

// "1: description" stays one line of text for screen readers. On screen, the title and the
// description sit on their own lines, so the separator is kept but visually hidden.
function stopText(children) {
  const out = [];
  let split = false;
  for (const node of children) {
    if (!split && node.type === 'text' && /^\s*:\s/.test(node.value)) {
      const [, sep, rest] = node.value.match(/^(\s*:)(\s[\s\S]*)$/);
      out.push(el('span', { className: ['sr-only'] }, [text(sep)]));
      out.push(
        el('span', { className: ['track-stop__desc'] }, [
          text(rest.trimStart()),
        ]),
      );
      split = true;
    } else if (split) {
      out[out.length - 1].children.push(node);
    } else {
      out.push(node);
    }
  }
  return out;
}

export default function rehypeTrackMap() {
  return (tree, file) => {
    const from = file.path ?? file.history?.[0];
    if (!from || repoPath(from) !== 'core/guides/README.md') return;

    // Find the run of `h3` + `ol` pairs: that's the track.
    const nodes = tree.children;
    const start = nodes.findIndex(
      (node, i) =>
        node.tagName === 'h3' &&
        nodes.slice(i + 1).find((n) => !isBlank(n))?.tagName === 'ol',
    );
    if (start === -1) return;
    const pairs = [];
    let end = start;
    for (let i = start; i < nodes.length; i++) {
      if (isBlank(nodes[i])) continue;
      if (nodes[i].tagName !== 'h3') break;
      const listAt = nodes.findIndex((n, j) => j > i && !isBlank(n));
      if (nodes[listAt]?.tagName !== 'ol') break;
      pairs.push([nodes[i], nodes[listAt]]);
      i = listAt;
      end = listAt;
    }

    let point = 0;
    let firstStop;
    let total = 0;
    const sections = pairs.map(([heading, list]) => {
      const name = textOf(heading).trim();
      const stage = stages.includes(name.toLowerCase())
        ? name.toLowerCase()
        : 'together';
      const items = list.children.filter((n) => n.tagName === 'li');
      const first = Number(list.properties.start ?? 1);
      const last = first + items.length - 1;
      const head = el(
        'div',
        {
          className: ['track-stage__head'],
          style: `--sway: ${sway(point++)}`,
        },
        [
          // The duck stands on a patch of ground, and the trail runs through the patch.
          el('span', { className: ['track-stage__pose'] }, [
            el('span', {
              className: ['track-stage__ground'],
              dataTrailPoint: '',
            }),
            el('span', { dataSlot: `pose:${stage}` }),
          ]),
          el('div', { className: ['track-stage__title'] }, [
            heading,
            el('p', { className: ['track-stage__note'], ariaHidden: 'true' }, [
              text(first === last ? `stop ${first}` : `stops ${first}–${last}`),
            ]),
          ]),
        ],
      );
      const stops = items.map((item, i) => {
        const link = item.children.find((n) => n.tagName === 'a');
        const href = link?.properties.href;
        firstStop ??= href;
        total++;
        return el(
          'li',
          {
            className: ['track-stop'],
            dataStop: href,
            style: `--sway: ${sway(point++)}`,
          },
          [
            el(
              'span',
              { className: ['track-stop__stone'], dataTrailPoint: '' },
              [
                el('span', { className: ['track-stop__num'] }, [
                  text(String(first + i)),
                ]),
                tick(),
              ],
            ),
            el('span', { className: ['track-stop__text'] }, [
              ...stopText(item.children.filter((n) => !isBlank(n))),
              el('span', { className: ['sr-only'], dataStopStatus: '' }),
            ]),
          ],
        );
      });
      list.properties.className = ['track-stops'];
      // Keep list semantics in Safari, which drops them from lists without bullets.
      list.properties.role = 'list';
      list.children = stops;
      return el('div', { className: ['track-stage'], dataStage: stage }, [
        head,
        list,
      ]);
    });

    const map = el(
      'div',
      { className: ['track-map', 'not-content'], dataTrackMap: '' },
      [
        el('span', {
          dataSlot: 'progress',
          dataFirst: firstStop,
          dataTotal: String(total),
        }),
        el('div', { className: ['track-map__stages'] }, sections),
      ],
    );
    nodes.splice(start, end - start + 1, map);
  };
}
