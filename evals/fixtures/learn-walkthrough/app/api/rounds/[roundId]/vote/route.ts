import { sql } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roundId: string }> },
) {
  const { roundId } = await params;
  const { memberId, bookId } = await req.json();

  const existing = await sql`
    SELECT id FROM votes WHERE round_id = ${roundId} AND member_id = ${memberId}`;
  if (existing.length > 0) {
    await sql`UPDATE votes SET book_id = ${bookId} WHERE id = ${existing[0].id}`;
  } else {
    await sql`
      INSERT INTO votes (round_id, member_id, book_id)
      VALUES (${roundId}, ${memberId}, ${bookId})`;
  }
  return Response.json({ ok: true });
}
