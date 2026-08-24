import type { Payment, PaymentMethod } from "../../shared/types";

const SELECT =
  "SELECT id, code, invoice_id, amount, paid_on, method, note, external_id FROM payments";

export async function listPayments(db: D1Database, invoiceId: number): Promise<Payment[]> {
  const { results } = await db
    .prepare(`${SELECT} WHERE invoice_id = ? ORDER BY paid_on, id`)
    .bind(invoiceId)
    .all<Payment>();
  return results;
}

function getPayment(db: D1Database, id: number): Promise<Payment | null> {
  return db.prepare(`${SELECT} WHERE id = ?`).bind(id).first<Payment>();
}

/** Paths carry the public code; ids stay internal and in foreign keys. */
export function getPaymentByCode(db: D1Database, code: string): Promise<Payment | null> {
  return db.prepare(`${SELECT} WHERE code = ?`).bind(code).first<Payment>();
}

export async function sumPayments(db: D1Database, invoiceId: number): Promise<number> {
  const row = await db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE invoice_id = ?")
    .bind(invoiceId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export type PaymentInput = {
  code: string;
  invoice_id: number;
  amount: number;
  paid_on: string;
  method: PaymentMethod;
  note: string | null;
  /** Set only by the webhook, and unique — see migration 0008. */
  external_id?: string | null;
};

export async function createPayment(
  db: D1Database,
  input: PaymentInput,
): Promise<Payment | null> {
  const row = await db
    .prepare(
      `INSERT INTO payments (code, invoice_id, amount, paid_on, method, note, external_id)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      input.code,
      input.invoice_id,
      input.amount,
      input.paid_on,
      input.method,
      input.note,
      input.external_id ?? null,
    )
    .first<{ id: number }>();

  return row ? getPayment(db, row.id) : null;
}

export async function deletePayment(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM payments WHERE id = ?").bind(id).run();
}
