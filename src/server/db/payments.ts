import type { Payment, PaymentMethod } from "../../shared/types";

const SELECT = "SELECT id, invoice_id, amount, paid_on, method, note FROM payments";

export async function listPayments(db: D1Database, invoiceId: number): Promise<Payment[]> {
  const { results } = await db
    .prepare(`${SELECT} WHERE invoice_id = ? ORDER BY paid_on, id`)
    .bind(invoiceId)
    .all<Payment>();
  return results;
}

export function getPayment(db: D1Database, id: number): Promise<Payment | null> {
  return db.prepare(`${SELECT} WHERE id = ?`).bind(id).first<Payment>();
}

export async function sumPayments(db: D1Database, invoiceId: number): Promise<number> {
  const row = await db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE invoice_id = ?")
    .bind(invoiceId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export type PaymentInput = {
  invoice_id: number;
  amount: number;
  paid_on: string;
  method: PaymentMethod;
  note: string | null;
};

export async function createPayment(
  db: D1Database,
  input: PaymentInput,
): Promise<Payment | null> {
  const row = await db
    .prepare(
      `INSERT INTO payments (invoice_id, amount, paid_on, method, note)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.invoice_id, input.amount, input.paid_on, input.method, input.note)
    .first<{ id: number }>();

  return row ? getPayment(db, row.id) : null;
}

export async function deletePayment(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM payments WHERE id = ?").bind(id).run();
}
