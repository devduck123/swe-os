# Reminders

Sends reminder emails. A Vercel cron calls `/api/cron/reminders` every 5 minutes.

## Local setup

- Postgres in Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:18`, then load `schema.sql`.
- `DATABASE_URL=postgres://postgres:dev@localhost:5432/postgres`
- `npm run seed:monday` inserts 600 reminders due now.
- `EMAIL_MODE=log` swaps the email provider for a logger that waits 120ms per send.
- Tests run with Vitest.

## Data

About 600 rows had `remind_at` at 09:00 on Monday. New teams signed up last week. Before that, no minute ever had more than 20 reminders.
