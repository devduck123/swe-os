# Learner test 2026-10-18T010730

2 reader(s) per stop, graded by Claude in character as the reader in `reader.md`. Spent $2.63 API-equivalent.

**Clarity 3.9, usefulness 4.2** (1–5). Every reader's takeaway matched the intended lesson on 18 of 22 stops.

| # | Stop | Clarity | Usefulness | Match | Lost at |
| --- | --- | --- | --- | --- | --- |
| 1 | Vibe coder vs. engineer | 4.0 | 4.0 | yes, yes | "your route runs twice. First, `onBeforeGenerateToken`"; "`put` throws when the path already exists"; "a `check` script required to merge" |
| 2 | How a request travels through your app | 3.5 | 4.0 | partly, yes | "Next.js adds `s-maxage` to pages it caches"; "It holds a pool of open connections"; "One instance also handles several requests at once" |
| 3 | Shape before you build | 4.0 | 4.5 | yes, yes | "anything that touches a floor: auth"; "not the next one in UTC"; "one complete journey, thin, from the screen to the database" |
| 4 | Simple first: when complexity earns its place | 4.0 | 4.0 | yes, yes | "every mutation has to update both"; "it refetches from the server instead"; "Dependencies get an audit in CI" |
| 5 | Data that stays correct | 4.0 | 4.0 | yes, yes | "with the recipe's `pg` driver (Neon's"; "a Postgres function you call with"; "It also locks the row, so" |
| 6 | Trust boundaries: validation and authorization | 4.0 | 4.5 | partly, yes | "owners skip RLS unless it's forced"; "counts every function instance shares, not kept in memory"; "A row in Postgres is enough" |
| 7 | Timeouts, retries, and idempotency | 4.0 | 4.0 | partly, yes | "Both clicks have to land on the same order"; "NOTIFY pgrst, 'reload config';"; "Leave the migration role alone" |
| 8 | Local first, then managed services | 4.0 | 4.0 | yes, yes | "If your Vercel build command runs migrations"; "created in CI from a seed-only branch"; "money brings webhooks, refunds, taxes" |
| 9 | What a complete frontend feature includes | 4.0 | 5.0 | yes, yes | "Times are stored as `timestamptz`"; "and an error boundary shows one"; "`min-w-0` plus `truncate` fixes it" |
| 10 | Accessibility in practice | 4.0 | 4.0 | yes, yes | "aria-describedby pointing at the error's id"; "with a Controller, pass field.ref to it"; "role="status" waits until it finishes speaking" |
| 11 | AI features in production | 4.0 | 5.0 | yes, yes | "AbortSignal.any([req.signal, AbortSignal.timeout(30_000)])"; "In-memory limits don't hold on serverless."; "but OWASP says it's unclear" |
| 12 | Secrets and safety when agents write your code | 4.0 | 4.5 | yes, yes | "gitleaks in CI scans every PR"; "a connection string for a read-only role"; "strip the rest in Sentry's `beforeSend` hook" |
| 13 | Background jobs and webhooks | 4.0 | 4.0 | yes, yes | "Insert the row in the request and process it in `after()`"; "WHERE id = $1 AND status = 'pending'"; "its retries take most of a week" |
| 14 | How you know it works | 4.0 | 4.5 | yes, yes | "rejects.toThrow(/not allowed/)"; "run integration test files one at a time"; "getByRole('status')" |
| 15 | Reading and reviewing code you didn't write | 4.0 | 4.0 | partly, partly | "filters by the owner from the session"; "Ask Git why. Code tells you"; "in the ruleset on `main`" |
| 16 | Shipping changes you can undo | 3.0 | 4.0 | yes, yes | "over the direct connection string, not the pooled one"; "every migration must work with the old code too"; "watch error tracking for ten minutes" |
| 17 | Database changes without downtime | 4.0 | 4.0 | yes, yes | "use the safer version in "Going deeper" below"; "is one giant transaction"; "The migration's version is then a no-op there" |
| 18 | Knowing it broke before your users do | 4.0 | 4.0 | yes, yes | "On Neon, a health check that queries"; "Stripe then retries, and Sentry records it"; "Wrap <my most important job> in" |
| 19 | When production breaks anyway | 4.0 | 4.5 | yes, yes | "SET session_replication_role = replica"; "Notice it's one transaction"; "copies the projects with these IDs" |
| 20 | Performance and cost: scale from evidence | 4.0 | 4.0 | yes, yes | "AND (created_at, id) < ($1, $2)"; "the pooler host under **Connect**"; "In Next.js 16, data isn't cached unless you opt in" |
| 21 | Learning while agents write the code | 4.0 | 4.0 | yes, yes | "learning a new async library"; "Leave me the core as one `TODO(human)`, with a failing test."; "cycle time and how often their PRs need rework" |
| 22 | The side-project stack | 3.5 | 4.0 | yes, yes | "checks a short-lived signed token itself"; "Each client holds open connections"; "run Better Auth's migration to create the table" |
