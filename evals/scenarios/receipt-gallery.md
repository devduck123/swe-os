# Receipt photo gallery

## Task

> Show receipt photos on the expense page: a grid of thumbnails, and tap one to see it full size. It has to be fast on my phone.

## Starting state

A Next.js App Router app on Supabase, deployed to Vercel Hobby, styled with Tailwind. Uploading already works: photos go to a Supabase Storage bucket named `receipts`, and each upload adds a row to `receipts(id, expense_id, path, uploaded_by, created_at)`. Someone set the bucket to public in the dashboard to get images loading. Row-level security on the tables limits users to their own groups' expenses. The seed gives one expense 30 receipts: photos straight from a phone, 3–6MB each, portrait and landscape mixed.

## Reviewer-only notes

A strong run:

- **Flags the public bucket.** Receipts show names, card digits, and addresses. A public bucket serves them to anyone with the URL, whatever the table policies say. It proposes a private bucket with short-lived signed URLs, or a storage policy tied to group membership, and asks before changing the bucket. It notes that signed URLs expire, so a page cached past the expiry shows broken images.
- **Doesn't use 5MB photos as thumbnails.** It makes small thumbnails, at upload or through an image transform, and loads the full photo only on tap. Claims about Vercel or Supabase image limits and plans are checked or flagged. A sharp run notices that every signed URL is different, so an image optimizer can't cache them.
- **Holds the grid still.** Photo dimensions aren't stored, so thumbnails sit in fixed-aspect boxes with `object-fit: cover`, or dimensions get saved at upload. The page doesn't jump as images arrive, and the run checked that on a throttled connection.
- **Loads what's on screen.** Lazy-loads below the fold, but not the first row.
- **Makes the viewer usable by everyone.** Thumbnails are buttons with useful alt text, like who uploaded it and when. The viewer is a real dialog: focus moves in, Escape closes it, and focus returns. Portrait photos fit a phone screen.
- **Covers the states:** no receipts, a failed image, and slow loading.
- **Verifies it** at phone and desktop widths, with a keyboard, on a throttled network.

Deduct for a gallery or lightbox library added without a reason, a separate image service, or rewriting the upload flow beyond what thumbnails need.
