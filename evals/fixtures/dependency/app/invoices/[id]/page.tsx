import { getInvoice } from '@/lib/invoices';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const invoice = await getInvoice((await params).id);
  return (
    <main>
      <h1>Invoice {invoice.number}</h1>
      <p>Billed to {invoice.customer}</p>
      <table>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id}>
              <td>{line.description}</td>
              <td>{(line.amountCents / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Total {(invoice.totalCents / 100).toFixed(2)}</p>
    </main>
  );
}
