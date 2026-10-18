// Checks the source Markdown the way GitHub and agents will read it.
// The site build separately validates frontmatter and rendered links.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
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
    .map((file) => repoPath(join(root, dir, file)));

const sources = [
  ...readdirSync(root).filter((file) => file.endsWith('.md')),
  ...['core', 'profile', 'skills', 'templates', 'evals'].flatMap(markdownIn),
].filter((file) => !/^evals\/(project\/)?results\//.test(file)); // Eval output, not content.

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
      readlinkSync(adapter).replaceAll('\\', '/'),
      `../../skills/${name}`,
      `${client}/skills/${name} must link to skills/${name}`,
    );
    assert.equal(realpathSync(adapter), join(root, 'skills', name));
  }
}

// 3. Every concern is reachable from the routing table.
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
// 4. Guides and recipes carry a status, and the track has one page per position, all linked
//    from the track page.
const trackPage = read('core/guides/README.md');
const seenTrack = new Map();
for (const file of [
  ...markdownIn('core/guides'),
  ...markdownIn('core/recipes'),
].filter((f) => !f.endsWith('README.md'))) {
  const data = frontmatter(read(file));
  for (const id of data.concerns ?? []) {
    assert(concerns.includes(id), `${file} names unknown concern "${id}"`);
  }
  assert(data.status, `${file} needs a status: outline, draft, or reviewed`);
  if (data.freshness === 'fast-moving')
    assert(data.reviewed, `${file} is fast-moving and needs a reviewed date`);
  if (data.track) {
    // Every stop ends the same way: How I do it (Tommy's habits), The standard (what teams add, and when), Before you ship (checks to paste to the agent), then Sources.
    const text = read(file).replace(/^```[^\n]*\n[\s\S]*?^```/gm, '');
    const heads = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    const end = heads.filter((h) => h !== 'Sources').slice(-3);
    assert.deepEqual(
      end,
      ['How I do it', 'The standard', 'Before you ship, check'],
      `${file} must end with "## How I do it", "## The standard", then "## Before you ship, check", then Sources`,
    );
    // Plain bullets, not "- [ ]": a task-list checkbox renders as an unlabeled form input.
    const checks =
      text
        .split('## Before you ship, check')[1]
        .split('## Sources')[0]
        .match(/^- /gm) ?? [];
    assert(
      checks.length >= 3 && checks.length <= 6,
      `${file}: "Before you ship, check" needs 3 to 6 checks as bullets, has ${checks.length}`,
    );
    assert(
      !seenTrack.has(data.track),
      `${file} and ${seenTrack.get(data.track)} share track ${data.track}`,
    );
    seenTrack.set(data.track, file);
    const href = file.startsWith('core/guides/')
      ? file.split('/').at(-1)
      : `../recipes/${file.split('/').at(-1)}`;
    assert(
      trackPage.includes(`](${href})`),
      `${file} is on the track but not linked from core/guides/README.md`,
    );
  }
}

// 5. The plugin's version is the release version. Installed plugins only update when it changes.
const { version } = JSON.parse(read('package.json'));
const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
assert.equal(
  plugin.version,
  version,
  '.claude-plugin/plugin.json version must match package.json',
);

// 6. The repo is public, so no real email address belongs in a tracked file. Examples use
//    reserved domains (RFC 2606), like billing@attacker.example.
const exampleDomain =
  /(^|\.)(example|test|invalid|localhost)$|^example\.(com|net|org)$/i;
const tracked = execFileSync('git', ['ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\0')
  .filter(
    (file) =>
      file &&
      file !== 'package-lock.json' &&
      existsSync(join(root, file)) &&
      lstatSync(join(root, file)).isFile(),
  )
  .filter((file) => !/\.(png|jpe?g|gif|webp|ico|woff2?)$/i.test(file));
for (const file of tracked) {
  for (const [address, domain] of read(file).matchAll(
    /[\w.%+-]+@([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})\b/gi,
  )) {
    assert(
      // No-reply addresses (commit attribution in recorded eval runs) aren't anyone's inbox.
      exampleDomain.test(domain) ||
        /^noreply@|@users\.noreply\.github\.com$/i.test(address),
      `${file} contains a real-looking email address (${address}). Use an example domain like name@example.com.`,
    );
  }
}

console.log(
  `Checked ${links} links in ${sources.length} files, ${skills.length} skills, and ${concerns.length} concerns.`,
);
