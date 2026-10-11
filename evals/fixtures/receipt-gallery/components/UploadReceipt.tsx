'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export function UploadReceipt({ expenseId }: { expenseId: string }) {
  const [busy, setBusy] = useState(false);
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const path = `${expenseId}/${crypto.randomUUID()}-${file.name}`;
    await supabase.storage.from('receipts').upload(path, file);
    await supabase.from('receipts').insert({ expense_id: expenseId, path });
    setBusy(false);
  }
  return (
    <label className="mt-3 inline-block cursor-pointer rounded-md border px-3 py-2">
      {busy ? 'Uploading…' : 'Add receipt'}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onChange}
      />
    </label>
  );
}
