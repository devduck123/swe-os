# Billing app API

Express behind a reverse proxy that forwards any `Host` header unchanged. Prisma over Postgres. `sendEmail` sends real email from our domain. `hash` is bcrypt. Sessions are rows in the `session` table, looked up by cookie. Accounts hold invoices and saved payment methods.

`src/auth/reset.ts` is all of the password reset code, and nothing else limits or filters these routes.
