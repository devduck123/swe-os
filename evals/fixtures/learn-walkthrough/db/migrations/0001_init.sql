CREATE TABLE clubs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL);
CREATE TABLE members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), club_id uuid NOT NULL REFERENCES clubs, email text NOT NULL);
CREATE TABLE sessions (token text PRIMARY KEY, member_id uuid NOT NULL REFERENCES members, expires_at timestamptz NOT NULL);
CREATE TABLE books (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL);
CREATE TABLE rounds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), club_id uuid NOT NULL REFERENCES clubs, closes_at timestamptz NOT NULL);
CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES rounds,
  member_id uuid NOT NULL REFERENCES members,
  book_id uuid NOT NULL REFERENCES books,
  created_at timestamptz NOT NULL DEFAULT now()
);
