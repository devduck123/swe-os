// What a shared link shows, used by the docs pages (astro.config.mjs) and the landing page.
export const siteName = "Tommy's SWE OS";
export const ogImageAlt =
  'The SWE OS duck and its little robot agent reading a book under the moon, next to the headline: AI keeps getting better at code. Shipping it well is still the hard part.';

// Vercel Web Analytics: no cookies, so no banner. Only production builds count visits, so
// previews and local runs never load the script.
export const analytics = process.env.VERCEL_ENV === 'production';
export const analyticsScript = '/_vercel/insights/script.js';
