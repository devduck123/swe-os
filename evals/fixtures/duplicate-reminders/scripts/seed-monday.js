// Inserts 600 reminders due now, like Monday 09:00. Needs DATABASE_URL (Postgres in Docker).
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);
const rows = Array.from({ length: 600 }, (_, i) => ({
  email: `user${i}@example.com`,
  title: `Standup notes ${i}`,
  remind_at: new Date(),
}));
await sql`INSERT INTO reminders ${sql(rows)}`;
await sql.end();
console.log('seeded 600 reminders');
