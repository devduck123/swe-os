import { cookies } from 'next/headers';
import { sql } from './db';

export async function getSession(): Promise<{ memberId: string } | null> {
  const token = (await cookies()).get('session')?.value;
  if (!token) return null;
  const [row] = await sql`
    SELECT member_id FROM sessions WHERE token = ${token} AND expires_at > now()`;
  return row ? { memberId: row.member_id } : null;
}
