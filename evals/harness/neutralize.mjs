// Blind grading is approximate: B's output has tells. Before the grader sees a reply, strip the
// labels SWE OS adds and any mention of SWE OS itself, but keep what those sections say.

const LABELS = [
  'Worth learning',
  'SWE OS feedback',
  'OS note',
  'Leave the OS better',
  'Concerns',
  'Not verified',
  'Evidence',
  'Deferred',
];

export function neutralize(text, sweosPath = '') {
  let out = text;
  if (sweosPath) out = out.replaceAll(sweosPath, '<docs>');
  for (const label of LABELS) {
    // "**Worth learning.**", "**Worth learning:**", "## Worth learning", "Worth learning:"
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out
      .replace(new RegExp(`^#{1,6}\\s*${escaped}\\s*$`, 'gim'), '')
      .replace(new RegExp(`\\*\\*${escaped}[.:]?\\*\\*[.:]?\\s*`, 'gi'), '')
      .replace(new RegExp(`^${escaped}[.:]\\s*`, 'gim'), '');
  }
  // Sentences that name SWE OS or its files give the arm away.
  out = out
    .split('\n')
    .map((line) =>
      line
        .split(/(?<=[.!?])\s+/)
        .filter(
          (sentence) =>
            !/SWE ?OS|skills\/[\w-]+\/SKILL\.md|core\/(concerns|guides)\/|profile\/[\w-]+\.md|\bbuild-feature\b|\brule \d+\b/i.test(
              sentence,
            ),
        )
        .join(' '),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return out;
}

// Commands that read SWE OS give the arm away, so the grader doesn't see them. A chained
// command keeps its other parts: in round 3, hiding all of "cd <swe-os> && ... && npm view x"
// hid the npm check too, and the grader called the agent's true report of it fake.
// Entries look like "Bash <command>" or "Read <path>".
export function hideSweos(entry, sweosPath) {
  if (!entry.includes(sweosPath)) return entry;
  const [tool, ...rest] = entry.split(' ');
  if (tool !== 'Bash') return null;
  const kept = rest
    .join(' ')
    .split(/\s*(?:&&|\|\||;)\s*/)
    .filter((part) => part && !part.includes(sweosPath))
    .filter((part) => !/\b(core|skills|profile|templates)\//.test(part));
  return kept.length ? `Bash ${kept.join(' && ')}` : null;
}
