import { Hono } from "hono";

import { hmacSha256Hex, soSanhBiMat } from "../auth";
import { getInvoiceByCode } from "../db/invoices";
import { createPayment } from "../db/payments";
import { sinhMa } from "../domain/code";
import { CODE_PREFIX } from "../domain/code";
import { parseMaHoaDon } from "../domain/invoice";
import { failure, ok } from "../envelope";
import type { AppEnv } from "../types";
import { capNhatTrangThai } from "./payments";

/**
 * What SePay POSTs on a balance change. Only the fields this route acts on are
 * declared; everything else in the payload is ignored on purpose, so a new
 * field appearing upstream cannot break parsing.
 */
type SePayEvent = {
  id?: number | string;
  transferType?: string;
  transferAmount?: number;
  content?: string;
  code?: string | null;
  referenceCode?: string | null;
  transactionDate?: string;
  gateway?: string;
};

/**
 * `transactionDate` arrives as "2026-08-07 14:32:10". Only the date is stored,
 * because that is all `payments.paid_on` holds, and a malformed value falls
 * back to today rather than writing something the date column cannot answer
 * questions about.
 */
function ngayGiaoDich(value: string | undefined): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value ?? "");
  return match ? match[1]! : new Date().toISOString().slice(0, 10);
}

export const webhookRoutes = new Hono<AppEnv>();

/**
 * SePay balance-change webhook. Records an incoming transfer against the
 * invoice named in its memo.
 *
 * Read the response codes here as instructions to SePay rather than as a
 * verdict on the request. SePay retries anything that is not a 2xx, so a
 * situation retrying cannot fix — a transfer for an invoice that does not
 * exist, a cancelled invoice, money going out rather than in, a delivery
 * already recorded — answers 200 and stops. Only a genuinely transient or
 * fixable problem gets a non-2xx.
 *
 * The envelope already answers `{"success": true, …}`, which is exactly what
 * SePay checks for alongside the status code.
 */
webhookRoutes.post("/sepay-payment", async (c) => {
  const secret = c.env.SEPAY_WEBHOOK_SECRET;

  // Unset means the integration is off. Answering 401 here would be a lie —
  // no signature would ever verify — and 503 keeps an unconfigured deployment
  // from silently accepting anonymous writes to the payments table.
  if (!secret) {
    return failure(c, "WEBHOOK_NOT_CONFIGURED", "Webhook is not configured.", 503);
  }

  const signature = c.req.header("X-SePay-Signature") ?? "";
  const timestamp = c.req.header("X-SePay-Timestamp") ?? "";

  // Rejects a replayed delivery: a request captured off the wire stops being
  // usable five minutes later, even though its signature stays valid forever.
  // SePay signs each retry afresh, so this does not fight the retry logic.
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) {
    return failure(c, "STALE_SIGNATURE", "Signature timestamp is missing or stale.", 401);
  }

  // The body must be read as text and verified before it is parsed. Signing
  // covers the exact bytes SePay sent; parsing and re-serialising would
  // reorder keys and drop whitespace, and the signature would never match.
  const raw = await c.req.text();
  const expected = `sha256=${await hmacSha256Hex(secret, `${timestamp}.${raw}`)}`;

  if (!soSanhBiMat(signature, expected)) {
    return failure(c, "UNAUTHORIZED", "Invalid webhook signature.", 401);
  }

  let event: SePayEvent;
  try {
    event = JSON.parse(raw) as SePayEvent;
  } catch {
    return failure(c, "INVALID_DATA", "Body is not valid JSON.", 400);
  }

  // Money leaving the account is not a tenant paying a bill. Recording one
  // would credit an invoice for a transfer that went the other way.
  if (event.transferType !== "in") {
    return ok(c, { recorded: false, reason: "NOT_INCOMING" }, "Ignored: not an incoming transfer.");
  }

  const amount = Number(event.transferAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return ok(c, { recorded: false, reason: "INVALID_AMOUNT" }, "Ignored: no usable amount.");
  }

  // The memo is where the tenant's banking app puts the code. SePay's own
  // `code` field is only populated when its parsing rules are configured, so
  // it is a fallback rather than the source.
  const maHoaDon = parseMaHoaDon(event.content ?? "") ?? parseMaHoaDon(event.code ?? "");
  if (!maHoaDon) {
    return ok(c, { recorded: false, reason: "NO_INVOICE_CODE" }, "Ignored: no invoice code in memo.");
  }

  const invoice = await getInvoiceByCode(c.env.DB, maHoaDon);
  if (!invoice) {
    return ok(c, { recorded: false, reason: "INVOICE_NOT_FOUND" }, "Ignored: no such invoice.");
  }

  // A cancelled invoice was never owed. The money still arrived, so this is
  // something for the manager to sort out by hand rather than something to
  // record against a bill that no longer exists.
  if (invoice.status === "CANCELLED") {
    return ok(c, { recorded: false, reason: "INVOICE_CANCELLED" }, "Ignored: invoice is cancelled.");
  }

  const externalId = event.id === undefined || event.id === null ? null : String(event.id);

  try {
    await createPayment(c.env.DB, {
      code: sinhMa(CODE_PREFIX.payment),
      invoice_id: invoice.id,
      amount: Math.round(amount),
      paid_on: ngayGiaoDich(event.transactionDate),
      method: "BANK_TRANSFER",
      note: [event.gateway, event.referenceCode].filter(Boolean).join(" · ") || null,
      external_id: externalId,
    });
  } catch (err) {
    // The unique index on external_id is what makes a retry safe, including
    // two retries racing each other. Hitting it means this transaction is
    // already recorded, which is success from SePay's point of view.
    if ((err as Error).message?.includes("UNIQUE constraint failed")) {
      return ok(c, { recorded: false, reason: "ALREADY_RECORDED" }, "Already recorded.");
    }
    throw err;
  }

  // Re-derived from the sum of payments rather than set to PAID outright: a
  // tenant who transfers less than the total has paid something, not
  // everything, and the invoice has to keep saying so.
  const updated = await capNhatTrangThai(c.env.DB, invoice.id);

  return ok(
    c,
    { recorded: true, invoice_code: invoice.code, status: updated?.status ?? invoice.status },
    "Payment recorded.",
  );
});
