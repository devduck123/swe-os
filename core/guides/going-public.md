---
title: Going public
description: Shipping is when the code works. Launching is when strangers can find it, trust it, and hear from you, and that part has its own traps.
stage: ship
track: 18
concerns: [launch, privacy]
freshness: durable
status: draft
---

The day you share the link is the one day the most people look. Everything they see first comes from outside your app: the preview in the chat where someone pasted it, the search result, the email in their inbox or their spam folder. None of that shows up on `localhost`, and most of it is cached or judged once, so fixing it the next day is too late.

## Easy to miss

- **The link preview is your first impression, and it's cached.** Chat apps and social sites fetch your title, description, and image the first time someone shares the link, then keep that copy. Share it before the card is right and the broken version spreads. Check it in a real link preview.
- **Two domains split you in half.** Add a custom domain and the old `vercel.app` address still works, so search engines can see two copies of every page. Pick one, mark it canonical, and redirect the other.
- **A new domain can't send email yet.** Gmail and Yahoo want proof the mail is really from you (SPF, DKIM, and DMARC records), and a domain with no sending history looks like spam. Set it up days before the launch email, not the morning of.
- **An email address is personal data.** One signup field means you need a privacy page: what you keep, why, who else sees it (your email and analytics tools), and how to get removed. Write it before the form goes live.
- **A public form is a bot target.** A waitlist with no protection fills with fake addresses, and confirmation emails to them hurt your sending reputation. A hidden field and a rate limit stop most of it. Asking people to confirm stops the rest.
- **You get one spike.** Decide what counts, like signups rather than page views, and set up analytics before you post. A tool that doesn't set cookies doesn't need a cookie banner.
- **Free tiers have a commercial line, not just a usage line.** Vercel Hobby is for non-commercial use. A product you'll charge for belongs on a paid plan before it launches.

**How I do it:** a private preview I click through on my phone first, the social card checked in a real link preview, a privacy page before any signup form, and analytics that don't set cookies.

**Ask your agent:** "Before this goes public, check every page's title, description, and social card on the real domain, make sure previews aren't indexed, and list every limit an announcement could hit."

## Go deeper

- [Google Search Central: SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google: email sender guidelines](https://support.google.com/a/answer/81126)
- [The Open Graph protocol](https://ogp.me)
