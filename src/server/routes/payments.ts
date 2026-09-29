import { Hono } from "hono";

import { getInvoice, updateInvoice } from "../db/invoices";
import { deletePayment, getPaymentByCode, sumPayments } from "../db/payments";
import { CODE_PREFIX } from "../domain/code";
import { notFound, ok } from "../envelope";
import type { Invoice } from "../../shared/types";
import type { AppEnv } from "../types";
import { parseCode } from "../validate";

/**
 * Re-derives the invoice status from what has actually been received, so
 * deleting a mistaken payment flips it back to unpaid. A cancelled invoice is
 * left alone — that state is a human decision, not an arithmetic one.
 */
export async function syncInvoiceStatus(
  db: D1Database,
  invoiceId: number,
): Promise<Invoice | null> {
  const invoice = await getInvoice(db, invoiceId);
  if (!invoice || invoice.status === "CANCELLED") return invoice;

  const paidTotal = await sumPayments(db, invoiceId);
  const status = paidTotal >= invoice.total ? "PAID" : "UNPAID";

  if (status === invoice.status) return invoice;
  return updateInvoice(db, invoiceId, { status });
}

export const paymentRoutes = new Hono<AppEnv>();

// Paths carry the public code; the row id stays internal and in foreign keys.
paymentRoutes.delete("/:code", async (c) => {
  const payment = await getPaymentByCode(c.env.DB, parseCode(CODE_PREFIX.payment, c.req.param("code")));
  if (!payment) return notFound(c, "Payment not found.");

  await deletePayment(c.env.DB, payment.id);
  const invoice = await syncInvoiceStatus(c.env.DB, payment.invoice_id);

  return ok(c, { ok: true, invoice }, "Payment deleted.");
});
