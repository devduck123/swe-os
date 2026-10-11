import { createClient } from '@/lib/supabase/server';
import { UploadReceipt } from '@/components/UploadReceipt';

export default async function ExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: expense } = await supabase
    .from('expenses')
    .select('id, title, amount_cents, paid_by')
    .eq('id', id)
    .single();
  if (!expense) return <p className="p-6">Expense not found.</p>;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">{expense.title}</h1>
      <p className="mt-1 text-neutral-600">
        ${(expense.amount_cents / 100).toFixed(2)}
      </p>
      <section className="mt-8">
        <h2 className="text-lg font-medium">Receipts</h2>
        <UploadReceipt expenseId={expense.id} />
      </section>
    </main>
  );
}
