import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseHTML } from 'linkedom';
import { root } from '../src/lib/routes.mjs';

const dist = resolve(root, 'dist');
const files = (await readdir(dist, { recursive: true }))
  .filter((f) => f.endsWith('.html'))
  .map((f) => resolve(dist, f));
const documents = new Map();
for (const file of files)
  documents.set(file, parseHTML(await readFile(file, 'utf8')).document);
let checked = 0;
for (const [file, document] of documents) {
  assert.equal(
    document.querySelectorAll('h1').length,
    1,
    `Expected one page heading: ${file}`,
  );
  assert(
    document.querySelector('title')?.textContent,
    `Missing title: ${file}`,
  );
  // A docs page whose Markdown failed to render ships an empty content area. Catch it here too.
  const content = document.querySelector('.sl-markdown-content');
  if (content) {
    assert(content.textContent.trim(), `Empty page content: ${file}`);
  }
  for (const anchor of document.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href');
    const sourceUrl =
      'https://swe-os.test/' +
      file.slice(dist.length + 1).replace(/index\.html$/, '');
    const url = new URL(href, sourceUrl);
    if (url.origin !== 'https://swe-os.test') continue;
    let target = resolve(dist, '.' + decodeURIComponent(url.pathname));
    const info = await stat(target).catch(() => {
      throw new Error(`Broken rendered link in ${file}: ${href}`);
    });
    if (info.isDirectory()) {
      target = resolve(target, 'index.html');
      await stat(target).catch(() => {
        throw new Error(`Link to a folder with no page in ${file}: ${href}`);
      });
    }
    if (url.hash && documents.has(target)) {
      assert(
        documents
          .get(target)
          .getElementById(decodeURIComponent(url.hash.slice(1))),
        `Missing fragment ${href} in ${file}`,
      );
    }
    checked++;
  }
}
console.log(
  `Checked ${checked} internal links and fragments across ${files.length} built pages.`,
);
