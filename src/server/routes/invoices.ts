import { Hono } from "hono";

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
import { bayGio, homNay } from "../domain/ky";
import { tinhHoaDon, tongTien } from "../domain/invoice";
import { capNhatTrangThai } from "./payments";
import type { AppEnv } from "../types";
import type { GenerateResult, InvoiceStatus, PaymentMethod } from "../../shared/types";
import {
  jsonBody,
  optionalEnum,
  optionalInt,
  optionalKy,
  optionalString,
  parseId,
  queryId,
  requireDate,
  requireEnum,
  requireId,
  requireInt,
  requireKy,
} from "../validate";

const STATUSES: readonly InvoiceStatus[] = ["chua_thanh_toan", "da_thanh_toan", "huy"];
const METHODS: readonly PaymentMethod[] = ["chuyen_khoan", "tien_mat"];

export const invoiceRoutes = new Hono<AppEnv>();

invoiceRoutes.get("/", async (c) => {
  const invoices = await listInvoices(c.env.DB, {
    ky: optionalKy(c.req.query("ky")),
    room_id: queryId(c.req.query("room_id"), "room_id"),
    trang_thai: optionalEnum(c.req.query("trang_thai"), "trang_thai", STATUSES),
  });

  return c.json({ invoices });
});

/**
 * Generates one invoice per room for a period.
 *
 * Rooms without a reading for that period, and rooms already invoiced, are
 * reported back as skipped rather than failing the whole batch — the caller
 * needs to know which rooms still need a meter entry.
 */
invoiceRoutes.post("/generate", async (c) => {
  const body = await jsonBody(c.req);
  const ky = requireKy(body.ky);

  const roomIds = Array.isArray(body.room_ids)
    ? body.room_ids.map((value) => requireId(value, "room_ids"))
    : undefined;

  const candidates = await listGenerationCandidates(c.env.DB, ky, roomIds);
  const skipped: GenerateResult["skipped"] = [];
  const inputs = [];

  for (const candidate of candidates) {
    if (candidate.invoice_id !== null) {
      skipped.push({ room_id: candidate.room_id, ten_phong: candidate.ten_phong, reason: "da_co_hoa_don" });
      continue;
    }
    if (candidate.dien_moi === null || candidate.nuoc_moi === null) {
      skipped.push({ room_id: candidate.room_id, ten_phong: candidate.ten_phong, reason: "thieu_chi_so" });
      continue;
    }

    const amounts = tinhHoaDon({
      reading: {
        dien_cu: candidate.dien_cu ?? 0,
        dien_moi: candidate.dien_moi,
        nuoc_cu: candidate.nuoc_cu ?? 0,
        nuoc_moi: candidate.nuoc_moi,
      },
      gia_phong: candidate.gia_phong,
      don_gia_dien: candidate.don_gia_dien,
      don_gia_nuoc: candidate.don_gia_nuoc,
    });

    inputs.push({
      room_id: candidate.room_id,
      ky,
      ...amounts,
      trang_thai: "chua_thanh_toan" as const,
      ngay_tao: bayGio(),
    });
  }

  const created = await createInvoices(c.env.DB, inputs);

  return c.json({ created, skipped } satisfies GenerateResult, created.length > 0 ? 201 : 200);
});

invoiceRoutes.get("/:id", async (c) => {
  const invoice = await getInvoiceDetail(c.env.DB, parseId(c.req.param("id")));
  if (!invoice) return c.json({ error: "not_found" }, 404);

  return c.json({ invoice });
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
  if (!current) return c.json({ error: "not_found" }, 404);

  const tien_phong = optionalInt(body.tien_phong, "tien_phong") ?? current.tien_phong;
  const phi_khac = optionalInt(body.phi_khac, "phi_khac") ?? current.phi_khac;

  const invoice = await updateInvoice(c.env.DB, id, {
    tien_phong,
    phi_khac,
    trang_thai: optionalEnum(body.trang_thai, "trang_thai", STATUSES),
    tong_tien: tongTien({ ...current, tien_phong, phi_khac }),
  });

  return c.json({ invoice });
});

invoiceRoutes.delete("/:id", async (c) => {
  await deleteInvoice(c.env.DB, parseId(c.req.param("id")));
  return c.json({ ok: true });
});

invoiceRoutes.get("/:id/payments", async (c) => {
  const payments = await listPayments(c.env.DB, parseId(c.req.param("id")));
  return c.json({ payments });
});

/** Records money received. Marks the invoice paid once the total is covered. */
invoiceRoutes.post("/:id/payments", async (c) => {
  const invoiceId = parseId(c.req.param("id"));
  const body = await jsonBody(c.req);

  const invoice = await getInvoice(c.env.DB, invoiceId);
  if (!invoice) return c.json({ error: "not_found" }, 404);
  if (invoice.trang_thai === "huy") return c.json({ error: "hoa_don_da_huy" }, 409);

  const payment = await createPayment(c.env.DB, {
    invoice_id: invoiceId,
    so_tien: requireInt(body.so_tien, "so_tien"),
    ngay_tt: body.ngay_tt === undefined ? homNay() : requireDate(body.ngay_tt, "ngay_tt"),
    phuong_thuc:
      body.phuong_thuc === undefined
        ? "chuyen_khoan"
        : requireEnum(body.phuong_thuc, "phuong_thuc", METHODS),
    ghi_chu: optionalString(body.ghi_chu, "ghi_chu", 200),
  });

  const updated = await capNhatTrangThai(c.env.DB, invoiceId);

  return c.json({ payment, invoice: updated }, 201);
});
