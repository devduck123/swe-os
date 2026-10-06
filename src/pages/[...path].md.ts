// Serves every source Markdown file at its repo path, so an agent can fetch
// /skills/build-feature/SKILL.md and follow its relative links as if it had the repo.
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { rawFiles, root } from '../lib/routes.mjs';

export const getStaticPaths: GetStaticPaths = () =>
  rawFiles().map((file) => ({ params: { path: file.replace(/\.md$/, '') } }));

export const GET: APIRoute = async ({ params }) =>
  new Response(await readFile(join(root, `${params.path}.md`), 'utf8'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
