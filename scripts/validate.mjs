// Checks the source Markdown the way GitHub and agents will read it.
// The site build separately validates frontmatter and rendered links.
import assert from 'node:assert/strict';
import {
  existsSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { frontmatter, repoPath, root, routeFor } from '../src/lib/routes.mjs';
import { rewriteHref } from '../src/lib/remark-repo-links.mjs';

const read = (path) => readFileSync(join(root, path), 'utf8');
const markdownIn = (dir) =>
  readdirSync(join(root, dir), { recursive: true })
    .filter((file) => file.endsWith('.md'))
    .map((file) => join(dir, file));

const sources = [
  ...readdirSync(root).filter((file) => file.endsWith('.md')),
  ...['core', 'profile', 'skills', 'templates', 'evals'].flatMap(markdownIn),
];

// 1. Every relative link resolves to a file in the repo.
let links = 0;
for (const file of sources) {
  const text = read(file).replace(/^```[^\n]*\n[\s\S]*?^```/gm, '');
  for (const [, href] of text.matchAll(/\]\(([^\s)]+)\)/g)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) continue;
    const target = resolve(dirname(join(root, file)), href.split('#')[0]);
    assert(
      !relative(root, target).startsWith('..'),
      `${file} links outside the repo: ${href}`,
    );
    assert(existsSync(target), `${file} has a broken link: ${href}`);
    // Pages on the site can only link to files the site serves. Astro would only log this
    // and ship an empty page, so fail here with a clear message instead.
    if (routeFor(repoPath(join(root, file))) !== null)
      rewriteHref(href, join(root, file));
    links++;
  }
}

// 2. Skills follow the Agent Skills format, and each client adapter points at the canonical folder.
const skills = readdirSync(join(root, 'skills')).filter((name) =>
  statSync(join(root, 'skills', name)).isDirectory(),
);
for (const name of skills) {
  const text = read(`skills/${name}/SKILL.md`);
  const data = frontmatter(text);
  assert.equal(
    data.name,
    name,
    `skills/${name}: frontmatter name must match the folder`,
  );
  assert(
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) && name.length <= 64,
    `skills/${name}: invalid name`,
  );
  assert(
    data.description?.length > 0 && data.description.length <= 1024,
    `skills/${name}: description`,
  );
  assert(
    data.metadata?.title && data.metadata?.example,
    `skills/${name}: metadata needs title and example`,
  );
  assert(
    text.split('\n').length < 200,
    `skills/${name}: keep skills short; move detail to concerns or guides`,
  );
  for (const client of ['.agents', '.claude']) {
    const adapter = join(root, client, 'skills', name);
    assert.equal(
      readlinkSync(adapter),
      `../../skills/${name}`,
      `${client}/skills/${name} must link to skills/${name}`,
    );
    assert.equal(realpathSync(adapter), join(root, 'skills', name));
  }
}

// 3. Every concern is reachable from the routing table, and guides only name real concerns.
const concerns = readdirSync(join(root, 'core/concerns'))
  .filter((file) => file !== 'README.md')
  .map((file) => file.replace(/\.md$/, ''));
const routing = read('core/concerns/README.md');
for (const id of concerns) {
  assert(
    routing.includes(`](${id}.md)`),
    `core/concerns/${id}.md is not in the routing table`,
  );
}
for (const file of markdownIn('core/guides').filter(
  (f) => !f.endsWith('README.md'),
)) {
  const data = frontmatter(read(file));
  for (const id of data.concerns ?? []) {
    assert(concerns.includes(id), `${file} names unknown concern "${id}"`);
  }
  assert(data.status, `${file} needs a status: draft or reviewed`);
  if (data.freshness === 'fast-moving')
    assert(data.reviewed, `${file} is fast-moving and needs a reviewed date`);
}

console.log(
  `Checked ${links} links in ${sources.length} files, ${skills.length} skills, and ${concerns.length} concerns.`,
);
