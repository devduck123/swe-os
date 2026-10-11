export type Invoice = {
  number: string;
  customer: string;
  totalCents: number;
  lines: { id: string; description: string; amountCents: number }[];
};

export async function getInvoice(id: string): Promise<Invoice> {
  return {
    number: `INV-${id}`,
    customer: 'Acme Co',
    totalCents: 12500,
    lines: [{ id: '1', description: 'Design work', amountCents: 12500 }],
  };
}
