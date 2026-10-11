import { sql } from '@/lib/db';
import { email } from '@/lib/email';

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
