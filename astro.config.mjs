import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, fontProviders } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkRepoLinks from './src/lib/remark-repo-links.mjs';
import { frontmatter, root } from './src/lib/routes.mjs';

// Sidebar entries come from the files on disk, so a new guide or concern shows up by existing.
// The config is read once, so restart `npm run dev` after adding a file to see it in the sidebar.
// Pages with a `track` number come first, in track order, so Starlight's next and previous
// links walk the learning track. Everything else follows alphabetically.
const pages = (dir) =>
  readdirSync(join(root, dir))
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .map((file) => ({
      slug: file.replace(/\.md$/, ''),
      track: frontmatter(readFileSync(join(root, dir, file), 'utf8')).track,
    }))
    .sort(
      (a, b) =>
        (a.track ?? Infinity) - (b.track ?? Infinity) ||
        a.slug.localeCompare(b.slug),
    )
    .map((page) => page.slug);
// The track follows the lifecycle, so the Learn sidebar groups guides by their `stage`.
const stages = [
  'understand',
  'design',
  'build',
  'verify',
  'ship',
  'operate',
  'improve',
];
const guideStage = (slug) =>
  frontmatter(readFileSync(join(root, 'core/guides', `${slug}.md`), 'utf8'))
    .stage;
const skillItems = readdirSync(join(root, 'skills'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const source = readFileSync(
      join(root, 'skills', entry.name, 'SKILL.md'),
      'utf8',
    );
    return {
      label: frontmatter(source).metadata.title,
      link: `/skills/${entry.name}/`,
    };
  });

// Fonts are downloaded at build time and served from this site: no third-party request,
// metric-matched fallbacks to limit layout shift, and only the axes we use.
const google = (name, cssVariable, fallbacks, family) => ({
  provider: fontProviders.google(),
  name,
  cssVariable,
  fallbacks,
  subsets: ['latin'],
  ...family,
});
const fonts = [
  google('Fraunces', '--font-fraunces', ['Georgia', 'serif'], {
    weights: ['400 800'],
    // Upright only: an italic face would be a second large file for two words of emphasis.
    styles: ['normal'],
    // The headline wraps differently in the fallback serif, so a late swap shifts the whole
    // hero. 'optional' uses Fraunces when it arrives in time (it's preloaded) and never swaps.
    display: 'optional',
    // SOFT is pinned at 100 (the only value we use), which halves the file size.
    options: {
      experimental: {
        variableAxis: {
          opsz: [['9', '144']],
          SOFT: ['100'],
          WONK: [['0', '1']],
        },
      },
    },
  }),
  google('DM Sans', '--font-dm-sans', ['system-ui', 'sans-serif'], {
    weights: ['400 700'],
    styles: ['normal', 'italic'],
  }),
  google(
    'JetBrains Mono',
    '--font-jetbrains-mono',
    ['ui-monospace', 'monospace'],
    {
      weights: ['400', '600'],
    },
  ),
  google('Caveat', '--font-caveat', ['cursive'], { weights: ['700'] }),
];

// The public URL, for the sitemap, absolute llms.txt links, and share cards. It's written here
// because Vercel's production-URL variable keeps reporting the project's first domain, not the alias.
// When the domain changes, change it here, in the README, and in the repo's homepage.
const site = process.env.SITE_URL ?? 'https://tommy-swe-os.vercel.app';
const ogImage = new URL('/og.png', site).href;

export default defineConfig({
  site,
  output: 'static',
  fonts,
  markdown: { processor: unified({ remarkPlugins: [remarkRepoLinks] }) },
  integrations: [
    starlight({
      title: "Tommy's SWE OS",
      description: 'Engineering judgment for people and their coding agents.',
      editLink: {
        baseUrl: 'https://github.com/devduck123/swe-os/edit/main/',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/devduck123/swe-os',
        },
      ],
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: ogImage } },
        {
          tag: 'meta',
          attrs: { property: 'og:image:alt', content: "Tommy's SWE OS" },
        },
      ],
      customCss: ['./src/styles/tokens.css', './src/styles/docs.css'],
      // Wrap long lines so code blocks never need a keyboard-unreachable horizontal scroll.
      expressiveCode: { defaultProps: { wrap: true } },
      // Content lives at the repo root, not src/content/docs, so opt it into Starlight's Markdown transforms.
      markdown: { processedDirs: ['./core', './profile', './skills'] },
      // src/pages/404.astro replaces the default, which looks for a docs entry we don't have.
      disable404Route: true,
      components: {
        Head: './src/components/Head.astro',
        PageTitle: './src/components/PageTitle.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Home', link: '/' },
            { label: 'Use it with an agent', slug: 'skills' },
          ],
        },
        {
          label: 'Learn',
          items: [
            { label: 'The track', slug: 'guides' },
            ...stages.map((stage) => ({
              label: stage[0].toUpperCase() + stage.slice(1),
              // Collapsed so How I build and Standards stay in view. Starlight opens the current page's stage.
              collapsed: true,
              items: pages('core/guides')
                .filter((p) => guideStage(p) === stage)
                .map((p) => ({ slug: `guides/${p}` })),
            })),
          ],
        },
        {
          // Tommy's own way: his defaults and the stack he'd ship.
          label: 'How I build',
          items: [
            { label: 'My defaults', slug: 'profile/defaults' },
            { label: 'My design taste', slug: 'profile/design' },
            ...pages('core/recipes').map((p) => ({ slug: `recipes/${p}` })),
            { label: 'All recipes', slug: 'recipes' },
          ],
        },
        {
          // The professional standard: judgment, then one page per risk (the concerns).
          label: 'Standards',
          items: [
            { label: 'The fourteen principles', slug: 'principles' },
            { label: 'All standards', slug: 'concerns' },
            {
              label: 'By risk',
              collapsed: true,
              items: pages('core/concerns').map((p) => ({
                slug: `concerns/${p}`,
              })),
            },
          ],
        },
        { label: 'Skills', items: skillItems },
        {
          label: 'About me',
          // Reading order: who Tommy is, how SWE OS sounds, then how he learns.
          items: ['tommy', 'voice', 'writing', 'learning']
            .concat(
              pages('profile').filter(
                (p) => !['defaults', 'design'].includes(p),
              ),
            )
            .filter((p, i, all) => all.indexOf(p) === i)
            .map((p) => ({ slug: `profile/${p}` })),
        },
      ],
    }),
  ],
});
