import { beforeEach, expect, test, vi } from 'vitest';
import { sql } from '@/lib/db';
import { resetDb, seedRound, signedIn, voteAs } from './helpers';

vi.mock('@/lib/session', () => ({
  getSession: async () =>
    signedIn.memberId ? { memberId: signedIn.memberId } : null,
}));

beforeEach(resetDb);

test('two votes at once leave one row', async () => {
  const { round, alice, books } = await seedRound();
  const results = await Promise.all([
    voteAs(alice, round.id, books[0].id),
    voteAs(alice, round.id, books[1].id),
  ]);
  expect(results.map((r) => r.status)).toEqual([200, 200]);
  const votes = await sql`SELECT * FROM votes WHERE member_id = ${alice.id}`;
  expect(votes).toHaveLength(1);
});

test('a vote after the round closes gets 409', async () => {
  const { round, alice, books } = await seedRound({ closesIn: '-1 minute' });
  const res = await voteAs(alice, round.id, books[0].id);
  expect(res.status).toBe(409);
});

test('a memberId in the body is ignored', async () => {
  const { round, alice, bob, books } = await seedRound();
  await voteAs(alice, round.id, books[0].id, { memberId: bob.id });
  const [vote] = await sql`SELECT member_id FROM votes`;
  expect(vote.member_id).toBe(alice.id);
});
