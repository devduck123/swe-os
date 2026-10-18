-- Keep only each member's newest vote in a round, then make the database enforce it.
DELETE FROM votes v
USING votes newer
WHERE v.round_id = newer.round_id
  AND v.member_id = newer.member_id
  AND (v.created_at, v.id) < (newer.created_at, newer.id);

CREATE UNIQUE INDEX votes_one_per_member ON votes (round_id, member_id);
