// The track's stages, and how core/guides/README.md lists the stops: a `### Stage` heading over
// a numbered list. The content schema, the track map (rehype-track-map.mjs), and the validator
// use this. The duck's pose for each stage lives in src/components/brand/StagePose.astro.

export const stages = [
  'understand',
  'design',
  'build',
  'verify',
  'ship',
  'operate',
  'improve',
];

/**
 * Every stop the track page lists, in order: its number, its link, and the heading it's under.
 * A heading that isn't a stage, like "Put it together", gives its stops no stage.
 */
export function trackList(markdown) {
  const list = [];
  let heading;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^##\s/.test(line)) heading = undefined;
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) heading = h3[1];
    const item = line.match(/^(\d+)\.\s+\[[^\]]*\]\(([^)\s#]+)/);
    if (!item || !heading) continue;
    const stage = heading.toLowerCase();
    list.push({
      n: Number(item[1]),
      href: item[2],
      heading,
      stage: stages.includes(stage) ? stage : undefined,
    });
  }
  return list;
}

/**
 * Where the track page and the stops' frontmatter disagree. Each stop is { file, href, track,
 * stage }, with href written the way the track page links to it.
 */
export function trackProblems(markdown, stops) {
  const list = trackList(markdown);
  const problems = [];
  list.forEach((entry, i) => {
    if (entry.n !== i + 1)
      problems.push(
        `core/guides/README.md numbers ${entry.href} ${entry.n}, but it's stop ${i + 1} on the list`,
      );
    if (!stops.some((stop) => stop.href === entry.href))
      problems.push(
        `core/guides/README.md lists ${entry.href}, which has no track number`,
      );
  });
  for (const stop of stops) {
    const entry = list[stop.track - 1];
    if (entry?.href !== stop.href)
      problems.push(
        `${stop.file} has track ${stop.track}, but core/guides/README.md lists ${entry?.href ?? 'nothing'} there`,
      );
    else if (entry.stage !== stop.stage)
      problems.push(
        `${stop.file} has stage ${stop.stage ?? '(none)'}, but core/guides/README.md lists it under "${entry.heading}"${entry.stage ? '' : ", which isn't a stage, so leave stage out"}`,
      );
  }
  return problems;
}
