import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackList, trackProblems } from '../src/lib/track.mjs';

const page = [
  '## Follow the work',
  '',
  '### Understand',
  '',
  '1. [First](first.md): the idea.',
  '',
  '### Design',
  '',
  '2. [Second](second.md): the shape.',
  '',
  '### Put it together',
  '',
  '3. [Recipe](../recipes/recipe.md): all of it.',
  '',
  '## How a stop is built',
  '',
  '1. Not a stop.',
].join('\n');
const stops = [
  {
    file: 'core/guides/first.md',
    href: 'first.md',
    track: 1,
    stage: 'understand',
  },
  {
    file: 'core/guides/second.md',
    href: 'second.md',
    track: 2,
    stage: 'design',
  },
  { file: 'core/recipes/recipe.md', href: '../recipes/recipe.md', track: 3 },
];

test('the track page lists each stop with its number and stage', () => {
  assert.deepEqual(
    trackList(page).map(({ n, href, stage }) => [n, href, stage]),
    [
      [1, 'first.md', 'understand'],
      [2, 'second.md', 'design'],
      [3, '../recipes/recipe.md', undefined],
    ],
  );
  assert.deepEqual(trackProblems(page, stops), []);
});

test('a stop with the wrong stage or number, or one missing from the page, is caught', () => {
  // Stop 27 said Design while the map filed it under "Put it together".
  assert.match(
    trackProblems(page, [
      stops[0],
      stops[1],
      { ...stops[2], stage: 'design' },
    ]).join('\n'),
    /recipe\.md has stage design, but .* under "Put it together", which isn't a stage/,
  );
  assert.match(
    trackProblems(page, [
      { ...stops[0], stage: 'build' },
      stops[1],
      stops[2],
    ]).join('\n'),
    /first\.md has stage build, but .* under "Understand"/,
  );
  assert.match(
    trackProblems(page, [stops[0], { ...stops[1], track: 3 }, stops[2]]).join(
      '\n',
    ),
    /second\.md has track 3, but core\/guides\/README\.md lists \.\.\/recipes\/recipe\.md there/,
  );
  assert.match(
    trackProblems(page.replace('2. [Second]', '4. [Second]'), stops).join('\n'),
    /numbers second\.md 4, but it's stop 2/,
  );
  assert.match(
    trackProblems(page, [stops[0], stops[2]]).join('\n'),
    /lists second\.md, which has no track number/,
  );
});
