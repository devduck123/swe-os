import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';

const Body = z.object({ bookId: z.uuid() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roundId: string }> },
) {
  const session = await getSession();
  if (!session) return new Response('Sign in to vote', { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response('Pick a book', { status: 400 });

  const { roundId } = await params;
  const rows = await sql`
    INSERT INTO votes (round_id, member_id, book_id)
    SELECT r.id, m.id, ${parsed.data.bookId}
    FROM rounds r
    JOIN members m ON m.club_id = r.club_id AND m.id = ${session.memberId}
    WHERE r.id = ${roundId} AND r.closes_at > now()
    ON CONFLICT (round_id, member_id)
    DO UPDATE SET book_id = EXCLUDED.book_id, created_at = now()
    RETURNING id`;
  if (rows.length === 0)
    return new Response('Voting is closed', { status: 409 });
  return Response.json({ ok: true });
}
