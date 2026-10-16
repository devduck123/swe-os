// What the reader sees: the body without frontmatter, collapsed "Going deeper" blocks, or Sources.
export const mainPath = (markdown) =>
  markdown
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
    .replace(/<details>[\s\S]*?<\/details>/g, '')
    .replace(/\n## Sources[\s\S]*$/, '')
    .trim();
