---
title: Going public
description: Shipping is when the code works. Launching is when strangers can find it and trust it, and that part has its own traps.
stage: ship
track: 20
concerns: [launch, privacy]
freshness: durable
status: reviewed
---

The day you share the link is the one day the most people look. Everything they see first comes from outside your app: the preview in the chat where someone pasted it, the search result, the icon in their browser tab. None of that shows up on `localhost`, and most of it is cached or judged once, so fixing it the next day is too late.

## Easy to miss

- **The link preview is your first impression, and it's cached.** Chat apps and social sites fetch your title, description, and image the first time someone shares the link, then keep that copy. Share it before the card is right and the broken version spreads. Check it in a real link preview.
- **The small things show whether anyone finished it.** A blank or framework-default favicon, no icon when someone saves the site to their phone's home screen, or a bare 404 page tells visitors the site isn't ready.
- **Two domains split you in half.** Add a custom domain and the old `vercel.app` address still works, so search engines can see two copies of every page. Pick one, mark it canonical, and redirect the other.
- **An email address is personal data.** One signup field means you need a privacy page: what you keep, why, who else sees it (your email and analytics tools), and how to get removed. Write it before the form goes live.
- **A public form is a bot target.** A waitlist with no protection fills with fake addresses. A hidden field and a rate limit stop most of it. Asking people to confirm stops the rest.
- **You get one spike.** Decide what counts, like signups rather than page views, and set up analytics before you post. A tool that doesn't set cookies doesn't need a cookie banner.
- **Free tiers have a commercial line, not just a usage line.** Some hosts' free plans are for non-commercial use only. Check the current terms before you launch something you'll charge for.

**How I do it:** a small personal project stays on Vercel, with Vercel's own analytics. Before I share the link, I check the social card, favicon, and icons on my phone, and make sure the pages are fast, responsive, and accessible.

**Ask your agent:** "Before this goes public, check every page's title, description, social card, favicon, and icons on the real domain, make sure previews aren't indexed, and list every limit an announcement could hit."

## Go deeper

- [Google Search Central: SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [The Open Graph protocol](https://ogp.me)
