---
title: Vibe coder vs. engineer
description: The same feature built twice, once for the demo and once for real users, and the questions that make the difference now that AI writes the code for both.
domain: foundations
stage: understand
freshness: durable
status: reviewed
track: 1
reviewed: 2026-10-06
concerns: []
---

A vibe coder asks "does it work?" An engineer asks "what happens when it doesn't?" Both use AI, and both can ship a feature in an afternoon. The difference is the questions they ask before calling it done. AI made code cheap. Judgment is still expensive: knowing what to build, what can go wrong, and how you'd know. An agent won't do that part unless you ask. It handles the cases you named, skips the ones you didn't, and says it's done either way ([AI speeds up implementation, not judgment](../principles.md#ai-speeds-up-implementation-not-judgment)).

## The same feature, built twice

You have a small SaaS on Next.js and Vercel. You tell your agent: "Let users upload a profile photo." A few minutes later you have this. Notice that everything, including who's uploading, comes from the form:

```ts
// app/api/avatar/route.ts: the vibe-coded version
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File;
  const userId = form.get('userId') as string;
  const blob = await put(file.name, file, { access: 'public' });
  await sql`update users set avatar_url = ${blob.url} where id = ${userId}`;
  return Response.json({ url: blob.url });
}
```

You pick a photo, it shows up, the demo works. Ship it.

Now read it like an engineer. Every line trusts the request.

- **Who can upload?** `userId` comes from the form, so anyone can change anyone's photo. There's no session check at all.
- **How big?** Vercel Functions reject request bodies over 4.5 MB with a `413` ("too large") error, so a photo straight off a phone fails with an error your UI never handles.
- **What type?** Nothing checks it, so your storage becomes free hosting for anything, on your bill.
- **What path?** The user's filename. `put` throws when the path already exists, so the second user to upload `photo.jpg` gets a 500.
- **What happens on failure?** If the upload works and the database update fails, the file sits in storage with nothing pointing to it. A double-click uploads twice, and old avatars are never deleted.

(`sql` stands for your database client.)

The engineered version isn't much longer. With Vercel Blob's client uploads, the browser sends the file straight to storage, and your route runs twice. First, `onBeforeGenerateToken` decides whether to hand out an upload token (a one-time pass for one file) and with what limits. `tokenPayload` carries the user ID along. After the upload, Blob calls `onUploadCompleted` with that payload, and you save the URL. Notice that the user ID now comes from the session, not the form:

```ts
// app/api/avatar/upload/route.ts: the engineered version
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const result = await handleUpload({
    body,
    request,
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
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      const { userId } = JSON.parse(tokenPayload!);
      await sql`update users set avatar_url = ${blob.url} where id = ${userId}`;
    },
  });
  return Response.json(result);
}
```

Size and type limits are baked into the token, and the random suffix means paths never clash.

<details>
<summary>Going deeper: testing on localhost, and private files</summary>

`onUploadCompleted` is Vercel's servers calling yours, so it can't reach `localhost` on your laptop. In development, run ngrok (it gives your laptop a public URL), or your database never hears about the upload. For anything more personal than an avatar, like ID scans, use a private Blob store and serve files through a route that checks who's asking.

</details>

Add a loading state, a useful error, and cleanup for the old photo and for any upload the database never recorded. Same agent, same afternoon. Someone just asked the questions.

## The questions an engineer asks

In plain words (the [concerns](../concerns/README.md) are the full list):

- **Who's allowed to do this,** and does the server check, or only the UI?
- **What am I trusting** from outside my code: a form field, a file, a webhook, a model's output?
- **What if it fails halfway,** or runs twice?
- **What happens with real data:** zero rows, 100,000 rows, a 40 MB photo, an emoji in a name?
- **What does it cost** at ten times the traffic, or when a bot finds it?
- **Whose personal data is this,** and who can see it?
- **Can everyone use it:** on a phone, with a keyboard, with a screen reader?
- **How would I know it broke** before a user tells me?
- **Can I undo it** if the deploy goes wrong?

Asking is one more sentence in the prompt. Not asking means the answer shows up later as an incident. A copy change triggers almost none of these, and a payment flow triggers most.

## Vibe coding is fine, until it crosses a floor

Andrej Karpathy coined "vibe coding" in February 2025 for building by prompt and never really reading the code. It's great for prototypes, throwaway tools, and weekend experiments. Simon Willison's test is a good one: if this has a bug or a security hole, could anyone be harmed, through lost money, a damaged reputation, or worse? If not, speed wins.

Some things never get a pass, even in a prototype. I call these the floors:

- **Secrets:** API keys, tokens, database URLs.
- **Auth:** who's signed in and what they're allowed to touch.
- **Money:** charges, refunds, anything billed per use.
- **Personal data:** emails, photos, health, location.
- **Destructive changes:** deleting data, rewriting rows, dropping columns.

You can't take any of these back. A leaked key is leaked the moment it's pushed. A double charge has already hit someone's card. A dropped column doesn't come back with a redeploy.

## How I do it

On my own side projects:

- Vibe code throwaway prototypes, on a branch I won't merge, whenever Willison's harm test says nobody gets hurt.
- Engineer the floors from the first commit. Ask your agent: "Before you build this, tell me where the secrets live, where the server checks who's signed in, and what touches money or personal data."
- Set up every repo with the [start-project](../../skills/start-project/SKILL.md) skill: a `check` script required to merge, and a preview deploy for every PR. Sentry goes in before the first real user. Stops [14](how-you-know-it-works.md), [16](shipping-changes-you-can-undo.md), and [18](knowing-it-broke.md) cover each.
- Before calling a feature done, run the [build-feature](../../skills/build-feature/SKILL.md) skill, or ask: "List every decision you made that I didn't specify, like limits, defaults, and what happens on failure." Read that list before the diff.
- Don't merge code I couldn't explain to someone else. If I can't, I ask the agent to walk me through it, or run the [learn](../../skills/learn/SKILL.md) skill.

## The standard

- **Every change gets the engineered treatment, not just the floors.** Each concern page ends with a "When stakes rise" list of what to add, and the [concerns table](../concerns/README.md#pick-the-concerns) says which pages a change touches. Do it once real users or real money show up. Engineered still means [simple](simple-first.md).
- **Someone besides the author reads every diff before it merges.** Do it when a second engineer joins. Until then, [review your own](reading-and-reviewing-code.md).
- **End-to-end tests of the critical flows, alerts with someone who answers them, and a written rollback condition for risky releases.** Do it once people pay you or rely on the app daily. Stops 14, 16, and 18 cover each.

## Before you ship, check

Paste this to your agent before you merge:

- The server checks who's signed in, and takes their ID from the session, never from the request.
- Every upload has a size limit and a list of allowed file types.
- If this fails halfway or runs twice, nothing is left half-done or doubled.
- Anything touching a floor (secrets, auth, money, personal data, deletes) has a server check, limits, and failure handling.
- You've listed every decision you made that I didn't specify, and I've read it.

## Sources

- [Simon Willison, "Not all AI-assisted programming is vibe coding" (2025)](https://simonwillison.net/2025/Mar/19/vibe-coding/), for the origin of the term and the harm test
- [Vercel Blob: client uploads](https://vercel.com/docs/vercel-blob/client-upload), including why `onUploadCompleted` can't reach localhost
- [Vercel Blob SDK: `put` options](https://vercel.com/docs/vercel-blob/using-blob-sdk), for the error on an existing path and `addRandomSuffix`
- [Vercel Blob: security](https://vercel.com/docs/vercel-blob/security), for private storage
- [Vercel Functions limits: request body size](https://vercel.com/docs/functions/limitations)
