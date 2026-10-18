# Design

<!-- Written during shaping, agreed with the user before setup, and updated when a part is added or swapped. Keep it to what changes decisions. -->

## How it fits together

<The parts and how a request moves through them, in a short list or one diagram. For example: "Browser → Next.js on Vercel → Postgres on Neon. Uploads go straight from the browser to Blob with a signed URL.">

## Parts and why

| Part       | Why this one | Left out, and what would add it |
| ---------- | ------------ | ------------------------------- |
| <Database> | <Why.>       | <Redis: a measured hot read.>   |

## What it costs

<The usage you're assuming, shown as math: users × actions per user per day × 30 = actions per month. Then the same at 10 times that, and one bad month (a bot, a retry loop). Size it to the project: a few lines for a friends-only app.>

| Part       | Free limit              | Where the bill jumps                      | Expected    | 10×         | Bad month   |
| ---------- | ----------------------- | ----------------------------------------- | ----------- | ----------- | ----------- |
| <Database> | <From its pricing page> | <The usage that moves you to a paid plan> | <$ a month> | <$ a month> | <$ a month> |

Prices checked <YYYY-MM-DD> from <links to the pricing pages>.

**Spending guard:** <The hard cap or alert on each usage-billed part, and who gets it.>
