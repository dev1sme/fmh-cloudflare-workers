import { Hono } from "hono";

import type { GenerationCandidate } from "../db/invoices";
import {
  createInvoices,
  deleteInvoice,
  getInvoice,
  getInvoiceDetail,
  listGenerationCandidates,
  listInvoices,
  updateInvoice,
} from "../db/invoices";
import { createPayment, listPayments } from "../db/payments";
import { bayGio, homNay } from "../domain/period";
import { estimateInvoice, tongTien } from "../domain/invoice";
import { failure, notFound, ok } from "../envelope";
import { capNhatTrangThai } from "./payments";
import type { AppEnv } from "../types";
import type {
  GeneratePreview,
  GenerateResult,
  PreviewRoom,
  InvoiceStatus,
  PaymentMethod,
} from "../../shared/types";
import {
  fail,
  jsonBody,
  optionalEnum,
  optionalInt,
  optionalPeriod,
  optionalString,
  parseId,
  queryId,
  requireDate,
  requireEnum,
  requireId,
  requireInt,
  requirePeriod,
} from "../validate";

const STATUSES: readonly InvoiceStatus[] = ["UNPAID", "PAID", "CANCELLED"];
const METHODS: readonly PaymentMethod[] = ["BANK_TRANSFER", "CASH"];

export const invoiceRoutes = new Hono<AppEnv>();

invoiceRoutes.get("/", async (c) => {
  const invoices = await listInvoices(c.env.DB, {
    period: optionalPeriod(c.req.query("period")),
    room_id: queryId(c.req.query("room_id"), "room_id"),
    status: optionalEnum(c.req.query("status"), "status", STATUSES),
  });

  return ok(c, { invoices }, "Invoices retrieved.");
});

/**
 * Generates one invoice per room for a period.
 *
 * `room_ids` narrows the run to the rooms the manager picked; omitting it bills
 * every room. Rooms without a reading for that period, and rooms already
 * invoiced, are reported back as skipped rather than failing the whole batch —
 * the caller needs to know which rooms still need a meter entry.
 */
invoiceRoutes.post("/generate", async (c) => {
  const body = await jsonBody(c.req);
  const period = requirePeriod(body.period);
  const roomIds = parseRoomIds(body.room_ids);

  const candidates = await listGenerationCandidates(c.env.DB, period, roomIds);
  const skipped: GenerateResult["skipped"] = [];
  const inputs = [];

  for (const candidate of candidates) {
    const { room_id, room_name } = candidate;

    if (candidate.invoice_id !== null) {
      skipped.push({ room_id, room_name, reason: "ALREADY_INVOICED" });
      continue;
    }

    const amounts = estimateInvoice(candidate);
    if (!amounts) {
      skipped.push({ room_id, room_name, reason: "MISSING_READING" });
      continue;
    }

    const { electricity_used, water_used, ...tien } = amounts;

    inputs.push({
      room_id,
      period,
      ...tien,
      status: "UNPAID" as const,
      created_at: bayGio(),
    });
  }

  const created = await createInvoices(c.env.DB, inputs);

  return ok(
    c,
    { created, skipped } satisfies GenerateResult,
    `Generated ${created.length} invoice(s), skipped ${skipped.length}.`,
    created.length > 0 ? 201 : 200,
  );
});

/**
 * What `POST /generate` would do for a period, without writing anything: every
 * room, whether it can be billed, and the amounts it would be billed.
 *
 * Registered before `/:id` on purpose — Hono matches in registration order.
 */
invoiceRoutes.get("/generate-preview", async (c) => {
  const period = requirePeriod(c.req.query("period"));
  const candidates = await listGenerationCandidates(c.env.DB, period);

  return ok(
    c,
    { period, rooms: candidates.map(xemTruocPhong) } satisfies GeneratePreview,
    "Generation preview retrieved.",
  );
});

function xemTruocPhong(candidate: GenerationCandidate): PreviewRoom {
  const estimate = estimateInvoice(candidate);

  return {
    room_id: candidate.room_id,
    room_name: candidate.room_name,
    building_id: candidate.building_id,
    building_name: candidate.building_name,
    status:
      candidate.invoice_id !== null ? "ALREADY_INVOICED" : estimate ? "READY" : "MISSING_READING",
    estimate,
    invoice_id: candidate.invoice_id,
  };
}

/** Absent means every room; an empty list is a mistake, not "every room". */
function parseRoomIds(value: unknown): number[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) fail("INVALID_ROOM_IDS");
  if (value.length === 0) fail("EMPTY_ROOM_IDS");

  return value.map((item) => requireId(item, "room_ids"));
}

invoiceRoutes.get("/:id", async (c) => {
  const invoice = await getInvoiceDetail(c.env.DB, parseId(c.req.param("id")));
  if (!invoice) return notFound(c, "Invoice not found.");

  return ok(c, { invoice }, "Invoice retrieved.");
});

/**
 * Only the parts an admin legitimately corrects after issuing. Unit prices are
 * not patchable on purpose — a wrong tariff means deleting the invoice and
 * generating it again, so history stays honest.
 */
invoiceRoutes.patch("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  const current = await getInvoice(c.env.DB, id);
  if (!current) return notFound(c, "Invoice not found.");

  const rent_amount = optionalInt(body.rent_amount, "rent_amount") ?? current.rent_amount;
  const other_fees = optionalInt(body.other_fees, "other_fees") ?? current.other_fees;

  const invoice = await updateInvoice(c.env.DB, id, {
    rent_amount,
    other_fees,
    status: optionalEnum(body.status, "status", STATUSES),
    total: tongTien({ ...current, rent_amount, other_fees }),
  });

  return ok(c, { invoice }, "Invoice updated.");
});

invoiceRoutes.delete("/:id", async (c) => {
  await deleteInvoice(c.env.DB, parseId(c.req.param("id")));
  return ok(c, { ok: true }, "Invoice deleted.");
});

invoiceRoutes.get("/:id/payments", async (c) => {
  const payments = await listPayments(c.env.DB, parseId(c.req.param("id")));
  return ok(c, { payments }, "Payments retrieved.");
});

/** Records money received. Marks the invoice paid once the total is covered. */
invoiceRoutes.post("/:id/payments", async (c) => {
  const invoiceId = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  const invoice = await getInvoice(c.env.DB, invoiceId);
  if (!invoice) return notFound(c, "Invoice not found.");
  if (invoice.status === "CANCELLED") {
    return failure(c, "INVOICE_CANCELLED", "This invoice is cancelled.", 409);
  }

  const payment = await createPayment(c.env.DB, {
    invoice_id: invoiceId,
    amount: requireInt(body.amount, "amount"),
    paid_on: body.paid_on === undefined ? homNay() : requireDate(body.paid_on, "paid_on"),
    method:
      body.method === undefined
        ? "BANK_TRANSFER"
        : requireEnum(body.method, "method", METHODS),
    note: optionalString(body.note, "note", 200),
  });

  const updated = await capNhatTrangThai(c.env.DB, invoiceId);

  return ok(c, { payment, invoice: updated }, "Payment recorded.", 201);
});
