import type { Invoice, Reading, InvoiceEstimate } from "../../shared/types";

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
  "rent_amount" | "electricity_amount" | "water_amount" | "other_fees" | "electricity_rate" | "water_rate" | "total"
>;

/**
 * Turns a meter reading into invoice amounts.
 *
 * Unit prices are passed in by the caller (from the building at generation
 * time) and stored on the invoice — a later tariff change must never alter an
 * invoice that has already been issued.
 */
export function tinhHoaDon(input: {
  reading: Pick<Reading, "electricity_start" | "electricity_end" | "water_start" | "water_end">;
  rent: number;
  electricity_rate: number;
  water_rate: number;
  other_fees?: number;
}): InvoiceAmounts {
  const soDien = input.reading.electricity_end - input.reading.electricity_start;
  const soNuoc = input.reading.water_end - input.reading.water_start;

  const rent_amount = input.rent;
  const electricity_amount = soDien * input.electricity_rate;
  const water_amount = soNuoc * input.water_rate;
  const other_fees = input.other_fees ?? 0;

  return {
    rent_amount,
    electricity_amount,
    water_amount,
    other_fees,
    electricity_rate: input.electricity_rate,
    water_rate: input.water_rate,
    total: rent_amount + electricity_amount + water_amount + other_fees,
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
export function estimateInvoice(candidate: {
  rent: number;
  electricity_rate: number;
  water_rate: number;
  electricity_start: number | null;
  electricity_end: number | null;
  water_start: number | null;
  water_end: number | null;
}): InvoiceEstimate | null {
  const { electricity_end, water_end } = candidate;
  if (electricity_end === null || water_end === null) return null;

  const electricity_start = candidate.electricity_start ?? 0;
  const water_start = candidate.water_start ?? 0;

  return {
    ...tinhHoaDon({
      reading: { electricity_start, electricity_end, water_start, water_end },
      rent: candidate.rent,
      electricity_rate: candidate.electricity_rate,
      water_rate: candidate.water_rate,
    }),
    electricity_used: electricity_end - electricity_start,
    water_used: water_end - water_start,
  };
}

/** Recomputes the total after an admin edits one of the parts. */
export function tongTien(
  parts: Pick<Invoice, "rent_amount" | "electricity_amount" | "water_amount" | "other_fees">,
): number {
  return parts.rent_amount + parts.electricity_amount + parts.water_amount + parts.other_fees;
}
