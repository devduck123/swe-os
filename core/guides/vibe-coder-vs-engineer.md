---
title: Vibe coder vs. engineer
description: The same feature built twice, once for the demo and once for real users, and the questions that make the difference now that AI writes the code for both.
domain: foundations
stage: understand
freshness: durable
status: draft
track: 1
reviewed: 2026-10-06
concerns: []
---

A vibe coder asks "does it work?" An engineer asks "what happens when it doesn't?" Both of them use AI now, and both can ship a feature in an afternoon. The difference is the list of questions they ask before calling it done.

That list is what this track teaches. AI made code cheap. Judgment, meaning knowing what to build, what can go wrong, and how you'd know, is still the expensive part, and it's the part an agent won't do unless you ask.

## The same feature, built twice

You have a small SaaS on Next.js and Vercel. You tell your agent: "Let users upload a profile photo." A few minutes later you have this:

```ts
// app/api/avatar/route.ts: the vibe-coded version
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File;
  const userId = form.get('userId') as string;
  const blob = await put(file.name, file, { access: 'public' });
  await db
    .update(users)
    .set({ avatarUrl: blob.url })
    .where(eq(users.id, userId));
  return Response.json({ url: blob.url });
}
```

You pick a photo, it shows up, the demo works. Ship it.

Now read it the way an engineer would. Every line trusts the request.

- **Who can upload?** The handler takes `userId` from the form, so anyone who can send a request can change anyone's photo. There's no session check at all.
- **How big?** Nothing limits the size. And Vercel Functions reject request bodies over 4.5 MB with a `413`, so a big photo straight off a phone can fail with an error your UI never handles.
- **What type?** Nothing checks it. Someone uploads an HTML page or an executable instead of a photo, and now your storage hosts it with your app linking to it.
- **Where is it stored?** Under the user's own filename, in a public bucket. Two users named `photo.jpg` collide, and a profile photo is personal data sitting at a guessable URL.
- **What does it cost?** Every upload is kept forever, and old avatars never get deleted. A bot that finds the endpoint can fill your storage, and you pay for it.
- **What happens on failure?** If the upload works and the database update fails, you have an orphaned file and a user who sees an error. If the user double-clicks, you upload twice. If the network drops, the button probably spins forever.

The engineered version isn't much longer. With Vercel Blob's client uploads, the browser sends the file straight to storage, and your server only decides whether to hand out a short-lived upload token:

```ts
// app/api/avatar/upload/route.ts: the engineered version, trimmed
onBeforeGenerateToken: async () => {
  const session = await auth();
  if (!session) throw new Error('Not signed in');
  return {
    allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maximumSizeInBytes: 5 * 1024 * 1024,
    addRandomSuffix: true,
    tokenPayload: JSON.stringify({ userId: session.user.id }),
  };
},
```

The user ID now comes from the session, not the request. Size and type limits are baked into the token, so the browser can't ask for more. Filenames can't collide. Add a loading state, an error message that says what to do, and a cleanup for the old photo, and you're done. Same agent, same afternoon. The only difference is that someone asked the questions.

## Why AI makes judgment the bottleneck

Both versions took an agent minutes. Writing code used to be the slow part, so it hid how much thinking happened while you typed. When you wrote the upload handler by hand, you had time to wonder "wait, where does `userId` come from?" Now the code arrives finished, looks plausible, and runs. Nothing slows you down long enough to ask.

An agent builds what you asked for. If you ask for an upload, you get an upload. It'll handle the cases you named and quietly skip the ones you didn't, and it'll tell you it's done either way. That's why I treat agents as fast implementers, not as the person accountable for the result (see [AI speeds up implementation, not judgment](../principles.md#ai-speeds-up-implementation-not-judgment)).

There's a second trap: delegating feels like progress even when you're not learning anything, and you can't feel the gap from the inside. [Learning while agents write the code](learning-with-agents.md) has the research on this and what to do about it.

## The questions an engineer asks

The [concerns](../concerns/README.md) are the full list, and agents load the same pages. In plain words, they come down to questions like these:

- **Who's allowed to do this,** and does the server check, or only the UI?
- **What am I trusting** that came from outside my code: a form field, a file, a webhook, a model's output?
- **What if it fails halfway,** or runs twice?
- **What happens with real data:** zero rows, 100,000 rows, a 40 MB photo, a name with an emoji in it?
- **What does it cost** at ten times the traffic, or when a bot finds it?
- **Whose personal data is this,** and who can see it?
- **Can everyone use it:** on a phone, with only a keyboard, with a screen reader?
- **How would I know it broke** before a user tells me?
- **Can I undo it** if the deploy goes wrong?

Asking is cheap. With an agent, it's literally one more sentence in the prompt or one more line in your review. Not asking is what gets expensive, because the answer shows up later as an incident instead of a decision.

You won't need every question every time. A copy change triggers almost none. A payment flow triggers most of them. Picking the few that matter is part of the skill, and the [concerns table](../concerns/README.md#pick-the-concerns) does that routing for you.

## Vibe coding is fine, until it crosses a floor

Andrej Karpathy coined "vibe coding" in early 2025 for building by prompt and never really reading the code. I think it's great for the right job. Prototypes, throwaway tools, a weekend experiment to see if an idea has legs, a project you're building to learn: vibe away. Simon Willison's test is a good one. Could anyone be harmed if this is wrong, by losing money or data or reputation? If not, the stakes are low and speed wins.

Some things never get a pass, even in a prototype. I call these the floors:

- **Secrets:** API keys, tokens, database URLs.
- **Auth:** who's signed in and what they're allowed to touch.
- **Money:** charges, refunds, anything billed per use.
- **Personal data:** emails, photos, health, location.
- **Destructive changes:** deleting data, rewriting rows, dropping columns.

What these have in common is that you can't take them back. A leaked key is leaked the moment it's pushed. A double charge has already hit someone's card. A dropped column doesn't come back with a redeploy. A prototype that leaks a key is still a leak.

Proportion cuts both ways. A weekend project doesn't need Google's infrastructure, and [simple first](simple-first.md) is a whole stop about that. But a product with real users shouldn't inherit the shortcuts from its weekend.

## What the vibe-coded version misses

A preview of the track. Each of these has its own stop.

- **Secrets in the client bundle.** The key that "only the server uses" ships to every browser because of a public env prefix. More in [how a request travels](how-a-request-travels.md) and [secrets and agent safety](secrets-and-agent-safety.md).
- **Trusting the request.** `userId` comes from the body, so anyone can edit anyone's data. See [trust boundaries](trust-boundaries.md).
- **Forms that break on double submit,** with no loading, empty, or error states. Users click twice and get two orders. See [complete frontend features](complete-frontend-features.md).
- **Retries that charge twice.** A timeout looks like a failure, the code retries, and the card gets charged again. See [timeouts, retries, and idempotency](timeouts-retries-idempotency.md).
- **Surprise bills.** A free tier with a cliff, or an unauthenticated endpoint calling a paid API. See [local first, then managed](local-first-then-managed.md) and [performance and cost](performance-and-cost.md).
- **Packages that don't exist.** The agent imports a plausible name, and someone has registered it with malware inside. See [dependencies](../concerns/dependencies.md).
- **A migration that drops data.** The code rolls back, the data doesn't. See [database changes without downtime](database-changes-without-downtime.md).
- **Code nobody can explain,** including the person who merged it. See [reading and reviewing code](reading-and-reviewing-code.md).

## What I'd do

- Vibe code to find out whether an idea is worth anything. It's the cheapest experiment there is.
- Engineer the floors from the first commit, even in a prototype: secrets in env vars that never ship to the browser, auth checked on the server, no real money or real personal data until those parts are reviewed.
- Before calling any feature done, run the questions above, or let the [build-feature](../../skills/build-feature/SKILL.md) skill run them, then read the decisions, not just the diff.
- Follow Willison's rule for anything with my name on it: don't merge code I couldn't explain to someone else.

Once real users or real money show up, the whole thing gets the engineered treatment, not just the floors.

## What changes at scale

- The questions turn into process: design reviews, code review, test plans, on-call rotations. Same questions, asked by more people.
- The cost of a missed question grows with the number of users who hit it at once.
- More of your code comes from agents, so the ability to review code you didn't write becomes the main skill on the team.

## How to use the track

Read it in order the first time. Each stop covers one thing the happy path hides, and the stages follow real work: understand, design, build, verify, ship, operate, improve. After that, jump to whatever your current feature touches. Every stop ends with what the vibe-coded version misses and what I'd do, so you can skim those two sections when you're short on time.

Then use it on something real. Ship a small project, run the questions on every feature, and keep score of which ones caught something. The [side-project stack](../recipes/side-project-stack.md) puts the whole track into one setup you can ship this weekend.

## Sources

- [Simon Willison, "Not all AI-assisted programming is vibe coding" (2025)](https://simonwillison.net/2025/Mar/19/vibe-coding/), for the origin of the term and the harm test
- [Vercel Blob: client uploads](https://vercel.com/docs/vercel-blob/client-upload) and [`onBeforeGenerateToken` options](https://vercel.com/docs/vercel-blob/using-blob-sdk)
- [Vercel Functions limits: request body size](https://vercel.com/docs/functions/limitations)
