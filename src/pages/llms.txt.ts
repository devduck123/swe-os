// An index for agents, following the llms.txt convention. Every link is raw Markdown.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { rawFiles } from '../lib/routes.mjs';

export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => (site ? new URL(path, site).href : path);
  const docs = await getCollection('docs');
  const skills = await getCollection('skills');
  const line = (title: string, path: string, description?: string) =>
    `- [${title}](${url('/' + path)})${description ? `: ${description}` : ''}`;
  const section = (heading: string, prefix: string) =>
    [
      `## ${heading}`,
      '',
      ...docs
        .filter((d) => d.filePath?.startsWith(prefix))
        .sort((a, b) => a.filePath!.localeCompare(b.filePath!))
        .map((d) => line(d.data.title, d.filePath!, d.data.description)),
      '',
    ].join('\n');

  const body = [
    "# Tommy's SWE OS",
    '',
    '> Engineering judgment for people and coding agents. Agents: read the entry page first, pick a skill, and load only the concerns and guides the task needs.',
    '',
    line('Using SWE OS with an agent (start here)', 'skills/README.md'),
    '',
    '## Skills',
    '',
    ...skills
      .sort((a, b) => a.data.name.localeCompare(b.data.name))
      .map((s) => line(s.data.name, s.filePath!, s.data.description)),
    '',
    section('Concerns', 'core/concerns/'),
    section('Guides', 'core/guides/'),
    section('Principles', 'core/principles'),
    section('Profile', 'profile/'),
    '## Templates',
    '',
    ...rawFiles()
      .filter((path) => path.startsWith('templates/'))
      .map((path) => line(`Template: ${path.split('/').at(-1)}`, path)),
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
