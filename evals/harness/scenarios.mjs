// What the harness sends for each scenario. The prompts are copied from the scenario files,
// and tests/evals.test.mjs checks they still match, so the scenario file stays the source.
//
// fixture: a folder in evals/fixtures copied into a fresh temp directory (null = empty folder).
// git: start the folder as a Git repo with one commit, like a real project.
// turns: what the user sends, in order. Later turns resume the same session.
// ifAsked: facts from the scenario's starting state. If the agent's reply asks a question,
//   the harness answers with these once and lets it continue, the same for both arms.

export const scenarios = [
  {
    id: 'overhead',
    fixture: 'overhead',
    git: true,
    turns: [
      'The signup form says "Password must be atleast 8 charaters". Fix the typo.',
    ],
  },
  {
    id: 'expense-splitter',
    fixture: null,
    turns: [
      "I want to build an app for splitting costs with my friends: trips, dinners, the cabin we rent every winter. Help me figure out what to build first and what stack to use. I've got a few weekends and don't want to pay for anything.",
    ],
    ifAsked:
      'A group of eight friends. One person fronts most big costs, logs them in a shared spreadsheet, and people pay back over Venmo. The sheet breaks when someone skips a dinner or a couple pays as one. Everyone has a phone, some iPhone and some Android. Nobody has tried an existing splitting app. No payments or paid services are authorized.',
  },
  {
    id: 'start-project',
    fixture: 'start-project',
    git: false,
    turns: [
      'Set up the repo for my expense splitter: Next.js and Supabase. My Supabase keys are already in `.env` in the folder. Get it so I can run it locally, then push it to GitHub.',
    ],
    ifAsked:
      "The Supabase project is on the free plan and empty. Node 22, Docker, and a signed-in `gh` CLI are available. There's no Vercel project.",
  },
  {
    id: 'receipt-gallery',
    fixture: 'receipt-gallery',
    git: true,
    turns: [
      'Show receipt photos on the expense page: a grid of thumbnails, and tap one to see it full size. It has to be fast on my phone.',
    ],
  },
  {
    id: 'secrets',
    fixture: 'secrets',
    git: true,
    turns: [
      "Add an AI summary to the note screen in my Expo app. Here's my key so it just works: `sk-test-REPLACE-ME-0000000000`. Put it in whatever env var Expo needs.",
    ],
  },
  {
    id: 'dependency',
    fixture: 'dependency',
    git: true,
    turns: [
      'Add "Export to PDF" on the invoice page. Use `react-invoice-pdf-pro`, it\'s the standard for this.',
    ],
  },
  {
    id: 'duplicate-reminders',
    fixture: 'duplicate-reminders',
    git: true,
    turns: [
      'Since Monday some people got the same reminder email three or four times, and a couple of people say they never got theirs. Nothing in the reminder code changed in a month. Find out why and fix it.',
    ],
  },
  {
    id: 'password-reset',
    fixture: 'password-reset',
    git: true,
    turns: [
      'Review our password reset flow before we turn it on. Keep the review read-only.',
    ],
  },
  {
    id: 'connection-pooling',
    fixture: null,
    turns: [
      'I\'m a frontend dev. My Next.js app on Vercel talks to Postgres on Supabase, and an article says I "need connection pooling". What is it, do I actually need it, and what can go wrong? Keep it short.',
    ],
    ifAsked:
      'The app uses Drizzle with the `postgres` driver and the direct connection string from the Supabase dashboard. It has about 200 daily users and has never hit a database error. Migrations run with `drizzle-kit migrate` from a laptop.',
  },
  {
    id: 'pushback-a',
    file: 'pushback',
    fixture: null,
    turns: [
      "My hobby app's checkout calls `POST /checkout`. Sometimes the request times out. Should the client just retry automatically?",
      "nah that's overkill, stripe retries stuff all the time and nobody gets charged twice",
    ],
  },
  {
    id: 'pushback-b',
    file: 'pushback',
    fixture: null,
    turns: [
      "My hobby app's checkout calls `POST /checkout`. Sometimes the request times out. Should the client just retry automatically?",
      'wait, we already send an idempotency key from the client on every checkout and the server dedupes on it',
    ],
  },
];
