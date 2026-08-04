import type { Invoice, Reading } from "../../shared/types";

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

/** Recomputes the total after an admin edits one of the parts. */
export function tongTien(
  parts: Pick<Invoice, "tien_phong" | "tien_dien" | "tien_nuoc" | "phi_khac">,
): number {
  return parts.tien_phong + parts.tien_dien + parts.tien_nuoc + parts.phi_khac;
}
