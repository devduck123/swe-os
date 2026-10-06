// Source files link to each other with relative paths like `../concerns/security.md`,
// which work on GitHub and for agents reading raw files. This rewrites them to site routes.
import { dirname, resolve } from 'node:path';
import { repoPath, routeFor, rawFiles } from './routes.mjs';

const external = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;

export function rewriteHref(href, fromFile) {
  if (external.test(href)) return href;
  const [path, hash] = href.split('#');
  const target = repoPath(resolve(dirname(fromFile), path));
  const route = routeFor(target);
  const suffix = hash ? `#${hash}` : '';
  if (route !== null) return `/${route}/${suffix}`;
  if (rawFiles().includes(target)) return `/${target}${suffix}`;
  throw new Error(
    `${repoPath(fromFile)} links to ${href}, which the site doesn't serve.`,
  );
}

export default function remarkRepoLinks() {
  return (tree, file) => {
    const from = file.path ?? file.history?.[0];
    if (!from) return;
    // A SKILL.md starts with its own H1 for agents. On the site, the page title replaces it.
    if (
      repoPath(from).endsWith('/SKILL.md') &&
      tree.children[0]?.type === 'heading' &&
      tree.children[0].depth === 1
    ) {
      tree.children.shift();
    }
    const visit = (node) => {
      if ((node.type === 'link' || node.type === 'definition') && node.url) {
        node.url = rewriteHref(node.url, from);
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
