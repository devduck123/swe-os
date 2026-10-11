CREATE TABLE reminders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  title text NOT NULL,
  remind_at timestamptz NOT NULL,
  sent_at timestamptz
);
