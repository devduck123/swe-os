// One place that knows how repo files map to site routes.
// The content loader, the link rewriter, the raw Markdown endpoint, llms.txt, the sidebar,
// and the validator all use it.
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';
import { parse } from 'yaml';

// The repo root is the nearest folder with a package.json. Walking up (instead of a fixed
// '../../') keeps this working after Astro bundles the module into dist/.
const findRoot = (dir) => {
  if (existsSync(join(dir, 'package.json'))) return dir;
  if (dirname(dir) === dir)
    throw new Error('No package.json above src/lib/routes.mjs');
  return findRoot(dirname(dir));
};
export const root = findRoot(dirname(fileURLToPath(import.meta.url)));

/** Repo-relative path with forward slashes, so route matching works on Windows too. */
export const repoPath = (absolute) =>
  relative(root, absolute).split(sep).join('/');

/** YAML frontmatter of a Markdown string, tolerant of CRLF line endings. */
export function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  return match ? parse(match[1]) : {};
}

/** Files rendered as Starlight docs pages. Skills render through their own collection. */
export const docPatterns = ['core/**/*.md', 'profile/*.md', 'skills/README.md'];

const rules = [
  [/^core\/principles\.md$/, 'principles'],
  [/^core\/(concerns|guides|recipes)\/README\.md$/, '$1'],
  [/^core\/(concerns|guides|recipes)\/([a-z0-9-]+)\.md$/, '$1/$2'],
  [/^profile\/([a-z0-9-]+)\.md$/, 'profile/$1'],
  [/^skills\/README\.md$/, 'skills'],
  [/^skills\/([a-z0-9-]+)\/SKILL\.md$/, 'skills/$1'],
];

/** Site route (no slashes) for a repo-relative Markdown path, or null if it has no page. */
export function routeFor(path) {
  for (const [pattern, replacement] of rules) {
    if (pattern.test(path)) return path.replace(pattern, replacement);
  }
  return null;
}

/** Every Markdown file the site serves as raw text at its repo path, for agents. */
export function rawFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.md')) files.push(repoPath(path));
    }
  };
  for (const dir of ['core', 'profile', 'skills', 'templates'])
    walk(join(root, dir));
  return files.sort();
}
