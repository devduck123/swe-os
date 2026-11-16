import type { APIRoute } from 'astro';

// Everything is public. Point crawlers at the sitemap on the real domain.
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`,
  );
