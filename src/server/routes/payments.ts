import { Hono } from "hono";

import { getInvoice, updateInvoice } from "../db/invoices";
import { deletePayment, getPayment, sumPayments } from "../db/payments";
import { notFound, ok } from "../envelope";
import type { Invoice } from "../../shared/types";
import type { AppEnv } from "../types";
import { parseId } from "../validate";

/**
 * Re-derives the invoice status from what has actually been received, so
 * deleting a mistaken payment flips it back to unpaid. A cancelled invoice is
 * left alone — that state is a human decision, not an arithmetic one.
 */
export async function capNhatTrangThai(
  db: D1Database,
  invoiceId: number,
): Promise<Invoice | null> {
  const invoice = await getInvoice(db, invoiceId);
  if (!invoice || invoice.status === "CANCELLED") return invoice;

  const daThu = await sumPayments(db, invoiceId);
  const trangThai = daThu >= invoice.total ? "PAID" : "UNPAID";

  if (trangThai === invoice.status) return invoice;
  return updateInvoice(db, invoiceId, { status: trangThai });
}

export const paymentRoutes = new Hono<AppEnv>();

paymentRoutes.delete("/:id", async (c) => {
  const id = parseId(c.req.param("id"));

  const payment = await getPayment(c.env.DB, id);
  if (!payment) return notFound(c, "Payment not found.");

  await deletePayment(c.env.DB, id);
  const invoice = await capNhatTrangThai(c.env.DB, payment.invoice_id);

  return ok(c, { ok: true, invoice }, "Payment deleted.");
});
