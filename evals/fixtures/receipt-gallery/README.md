# Splitty

Next.js App Router on Supabase, deployed to Vercel Hobby, styled with Tailwind.

- Receipt uploads work: photos go to the Supabase Storage bucket `receipts`, and each upload adds a row to `receipts`.
- The `receipts` bucket was set to public in the Supabase dashboard to get images loading.
- Row-level security on the tables limits users to their own groups' expenses.
- The seed gives one expense 30 receipts: photos straight from a phone, 3–6 MB each, portrait and landscape mixed.
