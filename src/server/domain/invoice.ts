import type { Invoice, Reading, TamTinhHoaDon } from "../../shared/types";

/** Code printed on the invoice and used as the bank transfer memo, e.g. HD00123. */
export function maHoaDon(invoiceId: number): string {
  return `HD${String(invoiceId).padStart(5, "0")}`;
}

/** Extracts an invoice id from a transfer memo. Used by the SePay webhook. */
export function parseMaHoaDon(text: string): number | null {
  const match = /HD(\d{1,10})/i.exec(text);
  if (!match) return null;

  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export type InvoiceAmounts = Pick<
  Invoice,
  "tien_phong" | "tien_dien" | "tien_nuoc" | "phi_khac" | "don_gia_dien" | "don_gia_nuoc" | "tong_tien"
>;

/**
 * Turns a meter reading into invoice amounts.
 *
 * Unit prices are passed in by the caller (from the building at generation
 * time) and stored on the invoice — a later tariff change must never alter an
 * invoice that has already been issued.
 */
export function tinhHoaDon(input: {
  reading: Pick<Reading, "dien_cu" | "dien_moi" | "nuoc_cu" | "nuoc_moi">;
  gia_phong: number;
  don_gia_dien: number;
  don_gia_nuoc: number;
  phi_khac?: number;
}): InvoiceAmounts {
  const soDien = input.reading.dien_moi - input.reading.dien_cu;
  const soNuoc = input.reading.nuoc_moi - input.reading.nuoc_cu;

  const tien_phong = input.gia_phong;
  const tien_dien = soDien * input.don_gia_dien;
  const tien_nuoc = soNuoc * input.don_gia_nuoc;
  const phi_khac = input.phi_khac ?? 0;

  return {
    tien_phong,
    tien_dien,
    tien_nuoc,
    phi_khac,
    don_gia_dien: input.don_gia_dien,
    don_gia_nuoc: input.don_gia_nuoc,
    tong_tien: tien_phong + tien_dien + tien_nuoc + phi_khac,
  };
}

/**
 * Prices one room for a period from its raw generation candidate, or returns
 * null when the period has no reading yet.
 *
 * Both the preview and the generation route go through this, so what the
 * manager is shown before confirming is by construction what gets written.
 * The opening numbers default to 0 — a room's first ever period bills from
 * zero rather than refusing to invoice.
 */
export function tamTinhHoaDon(candidate: {
  gia_phong: number;
  don_gia_dien: number;
  don_gia_nuoc: number;
  dien_cu: number | null;
  dien_moi: number | null;
  nuoc_cu: number | null;
  nuoc_moi: number | null;
}): TamTinhHoaDon | null {
  const { dien_moi, nuoc_moi } = candidate;
  if (dien_moi === null || nuoc_moi === null) return null;

  const dien_cu = candidate.dien_cu ?? 0;
  const nuoc_cu = candidate.nuoc_cu ?? 0;

  return {
    ...tinhHoaDon({
      reading: { dien_cu, dien_moi, nuoc_cu, nuoc_moi },
      gia_phong: candidate.gia_phong,
      don_gia_dien: candidate.don_gia_dien,
      don_gia_nuoc: candidate.don_gia_nuoc,
    }),
    so_dien: dien_moi - dien_cu,
    so_nuoc: nuoc_moi - nuoc_cu,
  };
}

/** Recomputes the total after an admin edits one of the parts. */
export function tongTien(
  parts: Pick<Invoice, "tien_phong" | "tien_dien" | "tien_nuoc" | "phi_khac">,
): number {
  return parts.tien_phong + parts.tien_dien + parts.tien_nuoc + parts.phi_khac;
}
