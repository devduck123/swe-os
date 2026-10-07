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

A vibe coder asks "does it work?" An engineer asks "what happens when it doesn't?" Both use AI, and both can ship a feature in an afternoon. The difference is the questions they ask before calling it done. AI made code cheap. Judgment, knowing what to build, what can go wrong, and how you'd know, is still expensive, and an agent won't do it unless you ask.

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

Now read it like an engineer. Every line trusts the request.

- **Who can upload?** `userId` comes from the form, so anyone can change anyone's photo. There's no session check at all.
- **How big?** Vercel Functions reject request bodies over 4.5 MB with a `413`, so a photo straight off a phone fails with an error your UI never handles.
- **What type?** Nothing checks it. Blob serves files with `Content-Security-Policy: default-src 'none'` and `nosniff`, so an uploaded HTML page won't run. The real risk is abuse: your storage becomes free hosting for anything, on your bill.
- **What path?** The user's filename. `put` throws when the path already exists, so the second user to upload `photo.jpg` gets a 500.
- **What happens on failure?** If the upload works and the database update fails, you have an orphaned file. A double-click uploads twice, and old avatars are never deleted.

The engineered version isn't much longer. With Vercel Blob's client uploads, the browser sends the file straight to storage. Your server decides whether to hand out a short-lived upload token, and Blob calls you back when the upload finishes:

```ts
// app/api/avatar/upload/route.ts: the engineered version, trimmed
handleUpload({
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
    await db
      .update(users)
      .set({ avatarUrl: blob.url })
      .where(eq(users.id, userId));
  },
});
```

The user ID comes from the session. Size and type limits are baked into the token, and the random suffix means paths never clash. One catch: `onUploadCompleted` is a call from Vercel's servers to yours, so it never reaches `localhost`. Run a tunnel like ngrok in development, or your database never hears about the upload. And for anything more personal than an avatar, like ID scans, use a private Blob store (`access: 'private'`) and serve files through a route that checks who's asking.

Add a loading state, a useful error, and cleanup for the old photo. Same agent, same afternoon. Someone just asked the questions.

## AI makes judgment the bottleneck

Typing the handler by hand, you'd have had time to wonder where `userId` comes from. Now the code arrives finished, looks plausible, and runs. An agent handles the cases you named, skips the ones you didn't, and says it's done either way. So I treat agents as fast implementers, not as the person accountable for the result (see [AI speeds up implementation, not judgment](../principles.md#ai-speeds-up-implementation-not-judgment)). Delegating also feels like learning when it isn't. [Learning while agents write the code](learning-with-agents.md) covers that.

## The questions an engineer asks

The [concerns](../concerns/README.md) are the full list, and agents load the same pages. In plain words:

- **Who's allowed to do this,** and does the server check, or only the UI?
- **What am I trusting** from outside my code: a form field, a file, a webhook, a model's output?
- **What if it fails halfway,** or runs twice?
- **What happens with real data:** zero rows, 100,000 rows, a 40 MB photo, an emoji in a name?
- **What does it cost** at ten times the traffic, or when a bot finds it?
- **Whose personal data is this,** and who can see it?
- **Can everyone use it:** on a phone, with a keyboard, with a screen reader?
- **How would I know it broke** before a user tells me?
- **Can I undo it** if the deploy goes wrong?

Asking is one more sentence in the prompt. Not asking is expensive, because the answer shows up later as an incident instead of a decision. A copy change triggers almost none of these, and a payment flow triggers most. The [concerns table](../concerns/README.md#pick-the-concerns) does that routing for you.

## Vibe coding is fine, until it crosses a floor

Andrej Karpathy coined "vibe coding" in early 2025 for building by prompt and never really reading the code. It's great for prototypes, throwaway tools, and weekend experiments. Simon Willison's test is a good one: could anyone be harmed if this is wrong, by losing money or data or reputation? If not, speed wins.

Some things never get a pass, even in a prototype. I call these the floors:

- **Secrets:** API keys, tokens, database URLs.
- **Auth:** who's signed in and what they're allowed to touch.
- **Money:** charges, refunds, anything billed per use.
- **Personal data:** emails, photos, health, location.
- **Destructive changes:** deleting data, rewriting rows, dropping columns.

What these have in common is that you can't take them back. A leaked key is leaked the moment it's pushed. A double charge has already hit someone's card. A dropped column doesn't come back with a redeploy. A prototype that leaks a key is still a leak.

## What the vibe-coded version misses

- **Trusting the request.** Anyone can edit anyone's data, and you find out when a stranger's face shows up on someone's profile. See [trust boundaries](trust-boundaries.md).
- **Secrets in the client bundle.** A public env prefix ships the "server-only" key to every browser, and you're rotating it at midnight. See [secrets and agent safety](secrets-and-agent-safety.md).
- **Retries that charge twice.** A timeout looks like a failure, the code tries again, and you're refunding a customer. See [timeouts, retries, and idempotency](timeouts-retries-idempotency.md).
- **Code nobody can explain,** including the person who merged it. The first bug in it costs a day of reverse-engineering. See [reading and reviewing code](reading-and-reviewing-code.md).

## What I'd do

- Vibe code to find out whether an idea is worth anything. It's the cheapest experiment there is.
- Engineer the floors from the first commit: secrets that never ship to the browser, auth checked on the server, no real money or personal data until those parts are reviewed.
- Before calling a feature done, run the questions, or let the [build-feature](../../skills/build-feature/SKILL.md) skill run them, then read the decisions, not just the diff.
- Follow Willison's rule: don't merge code I couldn't explain to someone else.

Once real users or real money show up, everything gets the engineered treatment, not just the floors. Keep the rest [simple](simple-first.md).

## Sources

- [Simon Willison, "Not all AI-assisted programming is vibe coding" (2025)](https://simonwillison.net/2025/Mar/19/vibe-coding/), for the origin of the term and the harm test
- [Vercel Blob: client uploads](https://vercel.com/docs/vercel-blob/client-upload), including why `onUploadCompleted` can't reach localhost
- [Vercel Blob SDK: `put` options](https://vercel.com/docs/vercel-blob/using-blob-sdk), for the error on an existing path and `addRandomSuffix`
- [Vercel Blob: security](https://vercel.com/docs/vercel-blob/security), for the headers on every blob and private storage
- [Vercel Functions limits: request body size](https://vercel.com/docs/functions/limitations)
