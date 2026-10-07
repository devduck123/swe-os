# Reminders sent more than once

## Task

> Since Monday some people got the same reminder email three or four times, and a couple of people say they never got theirs. Nothing in the reminder code changed in a month. Find out why and fix it.

## Starting state

A Next.js app on Vercel with Postgres. A Vercel cron job calls this route every 5 minutes. Each send through the email provider takes about 120ms.

```ts
// app/api/cron/reminders/route.ts
export const maxDuration = 10;

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response('Unauthorized', { status: 401 });

  const due = await sql`
    SELECT id, email, title FROM reminders
    WHERE sent_at IS NULL
      AND remind_at <= now()
      AND remind_at > now() - interval '20 minutes'`;

  for (const r of due) {
    await email.send({ to: r.email, subject: r.title, text: r.title });
  }
  await sql`UPDATE reminders SET sent_at = now() WHERE id = ANY(${due.map((r) => r.id)})`;
  return Response.json({ sent: due.length });
}
```

What the operator provides:

- **Monday's logs, 09:00 to 09:20.** Four invocations, one per run, each ending in `Task timed out after 10 seconds`. On other days every run returns `{"sent": n}` with `n` under 20.
- **The data.** About 600 rows have `remind_at` at 09:00 on Monday. New teams signed up last week. Before that, no minute ever had more than 20.
- **A local setup.** Postgres in Docker. `npm run seed:monday` inserts 600 reminders due now. `EMAIL_MODE=log` swaps the provider for a logger that waits 120ms per send. Tests run with Vitest.

## Reviewer-only notes

**The cause.** At about 120ms each, 600 sends take over a minute. Every run is killed at 10 seconds, after sending roughly the first 80 and before the `UPDATE`. Nothing gets marked, so each run resends the same first rows. After 20 minutes the window drops the batch, so the rest never go out.

A strong run:

- **Reproduces it.** Uses the seed and log mode under the 10-second limit, or a test with a fake sender that stops after N sends, and shows a second run resending.
- **Fixes the cause.** Records progress per reminder instead of after the loop. For example, claim each row with a conditional update (`... WHERE id = $1 AND sent_at IS NULL RETURNING id`) before sending, or mark each one right after its send. Says which failure the choice accepts: a crash between the two steps either loses one reminder or repeats one. Bounds each run so it finishes, with a `LIMIT` that fits the time budget or the provider's batch API. A provider idempotency key, if the provider supports one, is a good extra.
- **Fixes the silent drop.** The 20-minute window makes missed reminders vanish without a trace. At minimum, log or alert when due rows age out.
- **Writes a regression test** that fails before the fix: interrupt a run after N sends, run again, and assert each reminder went out once.

Red herrings: runs start 5 minutes apart and die at 10 seconds, so they never overlap. A lock or lease alone fixes nothing here. Raising `maxDuration` alone hides the bug until the next spike. Deduct if either is presented as the fix.

Critical failure: claiming it's fixed without reproducing it, or a fix that can silently send a reminder zero times without saying so.
