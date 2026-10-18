import { sql } from '@/lib/db';
import { POST } from '@/app/api/rounds/[roundId]/vote/route';

export async function resetDb() {
  await sql`TRUNCATE votes, rounds, books, sessions, members, clubs CASCADE`;
}

export async function seedRound(opts: { closesIn?: string } = {}) {
  const [club] =
    await sql`INSERT INTO clubs (name) VALUES ('Test club') RETURNING *`;
  const [alice, bob] = await sql`
    INSERT INTO members (club_id, email)
    VALUES (${club.id}, 'alice@example.com'), (${club.id}, 'bob@example.com')
    RETURNING *`;
  const books = await sql`
    INSERT INTO books (title) VALUES ('Piranesi'), ('Klara and the Sun') RETURNING *`;
  const [round] = await sql`
    INSERT INTO rounds (club_id, closes_at)
    VALUES (${club.id}, now() + ${opts.closesIn ?? '1 day'}::interval)
    RETURNING *`;
  return { club, alice, bob, books, round };
}

// The test file mocks getSession to return whoever is signed in here.
export const signedIn: { memberId: string | null } = { memberId: null };

export async function voteAs(
  member: { id: string },
  roundId: string,
  bookId: string,
  extra: Record<string, unknown> = {},
) {
  signedIn.memberId = member.id;
  return POST(
    new Request('http://localhost/api/vote', {
      method: 'POST',
      body: JSON.stringify({ bookId, ...extra }),
    }),
    { params: Promise.resolve({ roundId }) },
  );
}
