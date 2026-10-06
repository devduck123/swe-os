import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { routeFor, rawFiles, root } from '../src/lib/routes.mjs';
import { rewriteHref } from '../src/lib/remark-repo-links.mjs';

const from = (path) => join(root, path);

test('repo paths map to readable site routes', () => {
  assert.equal(routeFor('core/principles.md'), 'principles');
  assert.equal(routeFor('core/concerns/README.md'), 'concerns');
  assert.equal(routeFor('core/concerns/security.md'), 'concerns/security');
  assert.equal(
    routeFor('core/guides/timeouts-retries-idempotency.md'),
    'guides/timeouts-retries-idempotency',
  );
  assert.equal(routeFor('profile/voice.md'), 'profile/voice');
  assert.equal(routeFor('skills/README.md'), 'skills');
  assert.equal(routeFor('skills/explain/SKILL.md'), 'skills/explain');
  assert.equal(routeFor('templates/project/AGENTS.md'), null);
  assert.equal(routeFor('evals/README.md'), null);
});

test('relative source links become site routes, keeping fragments', () => {
  assert.equal(
    rewriteHref(
      '../../core/concerns/README.md#pick-the-concerns',
      from('skills/build-feature/SKILL.md'),
    ),
    '/concerns/#pick-the-concerns',
  );
  assert.equal(
    rewriteHref('security.md', from('core/concerns/README.md')),
    '/concerns/security/',
  );
  assert.equal(
    rewriteHref(
      '../principles.md#design-for-failure',
      from('core/concerns/reliability.md'),
    ),
    '/principles/#design-for-failure',
  );
});

test('files without a page link to their raw Markdown, and unknown targets fail loudly', () => {
  assert.equal(
    rewriteHref('../templates/project/AGENTS.md', from('skills/README.md')),
    '/templates/project/AGENTS.md',
  );
  assert.throws(
    () => rewriteHref('../../evals/README.md', from('core/guides/README.md')),
    /doesn't serve/,
  );
});

test('external links, absolute paths, and in-page anchors pass through untouched', () => {
  for (const href of [
    'https://example.com/x.md',
    'mailto:a@b.c',
    '/llms.txt',
    '#top',
  ]) {
    assert.equal(rewriteHref(href, from('core/principles.md')), href);
  }
});

test('raw files cover every page source plus templates, and nothing private', () => {
  const raw = rawFiles();
  for (const path of [
    'core/principles.md',
    'skills/build-feature/SKILL.md',
    'templates/project/AGENTS.md',
  ]) {
    assert(raw.includes(path), path);
  }
  assert(raw.every((path) => /^(core|profile|skills|templates)\//.test(path)));
});
