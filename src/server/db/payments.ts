import type { Payment, PaymentMethod } from "../../shared/types";

const SELECT = "SELECT id, invoice_id, so_tien, ngay_tt, phuong_thuc, ghi_chu FROM payments";

export async function listPayments(db: D1Database, invoiceId: number): Promise<Payment[]> {
  const { results } = await db
    .prepare(`${SELECT} WHERE invoice_id = ? ORDER BY ngay_tt, id`)
    .bind(invoiceId)
    .all<Payment>();
  return results;
}

export function getPayment(db: D1Database, id: number): Promise<Payment | null> {
  return db.prepare(`${SELECT} WHERE id = ?`).bind(id).first<Payment>();
}

export async function sumPayments(db: D1Database, invoiceId: number): Promise<number> {
  const row = await db
    .prepare("SELECT COALESCE(SUM(so_tien), 0) AS total FROM payments WHERE invoice_id = ?")
    .bind(invoiceId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export type PaymentInput = {
  invoice_id: number;
  so_tien: number;
  ngay_tt: string;
  phuong_thuc: PaymentMethod;
  ghi_chu: string | null;
};

export async function createPayment(
  db: D1Database,
  input: PaymentInput,
): Promise<Payment | null> {
  const row = await db
    .prepare(
      `INSERT INTO payments (invoice_id, so_tien, ngay_tt, phuong_thuc, ghi_chu)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(input.invoice_id, input.so_tien, input.ngay_tt, input.phuong_thuc, input.ghi_chu)
    .first<{ id: number }>();

  return row ? getPayment(db, row.id) : null;
}

export async function deletePayment(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM payments WHERE id = ?").bind(id).run();
}
