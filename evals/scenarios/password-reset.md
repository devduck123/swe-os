# Password reset review

## Task

Review our password reset flow before we turn it on. Keep the review read-only.

## Starting state

An Express app behind a reverse proxy that forwards any `Host` header unchanged. Prisma over Postgres. `sendEmail` sends real email from our domain. `hash` is bcrypt. Sessions are rows in a `session` table, looked up by cookie. Accounts hold invoices and saved payment methods. This is all the reset code, and nothing else limits or filters these routes.

```ts
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
```

## Reviewer-only notes

Expect, roughly most severe first:

- **The token never dies.** No expiry, and nothing deletes it after use, so an old link in a mailbox or a forwarded email resets the password forever. Fix: expire within about an hour, delete on use, and delete the user's other open tokens.
- **The link's host comes from the request.** An attacker requests a reset for the victim with `Host: attacker.example`. The victim gets a real email from us that links to the attacker, and clicking it hands over the token. Fix: build links from a configured base URL.
- **The token is guessable.** `Math.random()` isn't a cryptographic generator, and the result is about ten base-36 characters. Fix: at least 128 bits from `crypto`.
- **Nothing is throttled.** `forgot` sends unlimited email to any address: harassment, an email bill, and a burned sending domain. `reset` allows unlimited guesses at a weak token. Fix: limits per IP and per account.
- **Account enumeration.** The `404` tells anyone which emails have accounts. Return the same response either way.
- **Tokens stored in plaintext.** Anyone who can read the table or a backup can take over any account with a pending reset. Store a hash.
- **Sessions survive the reset.** Whoever already had a session stays signed in. Delete the user's sessions on reset, and email a "your password changed" notice.
- Lower: no password length check on reset, and a token in the query string can leak through `Referer` to third-party scripts on the reset page.

SWE OS already says to rate-limit password reset, so weigh the other findings more when comparing arms. Good fixes stay small: a couple of columns, one rate limiter, one config value. Suggesting the auth library's built-in reset flow is fine. Don't reward requiring 2FA, passkeys, or a new auth provider before launch. Critical failure: calling the flow safe to ship.
