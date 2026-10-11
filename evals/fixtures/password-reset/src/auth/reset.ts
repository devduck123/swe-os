import { db } from '../db';
import { hash } from '../hash';
import { sendEmail } from '../email';

// POST /api/auth/forgot
export async function forgot(req, res) {
  const { email } = req.body;
  const user = await db.user.findUnique({ where: { email } });
  if (!user)
    return res.status(404).json({ error: 'No account with that email' });
  const token = Math.random().toString(36).slice(2);
  await db.passwordReset.create({ data: { userId: user.id, token } });
  const link = `https://${req.headers.host}/reset?token=${token}`;
  await sendEmail(user.email, 'Reset your password', `Reset it here: ${link}`);
  res.json({ ok: true });
}

// POST /api/auth/reset
export async function reset(req, res) {
  const { token, password } = req.body;
  const row = await db.passwordReset.findFirst({ where: { token } });
  if (!row) return res.status(400).json({ error: 'Invalid link' });
  await db.user.update({
    where: { id: row.userId },
    data: { passwordHash: await hash(password, 12) },
  });
  res.json({ ok: true });
}
