import type { Invoice, Reading, InvoiceEstimate } from "../../shared/types";
import { CODE_PREFIX, sinhMa } from "./code";

/**
 * The invoice code: printed on the invoice, used as the bank transfer memo,
 * and used in the URL instead of the row id.
 *
 * Random, not derived from the id. A sequential code told anyone holding one
 * invoice how many exist and what the neighbouring ones are called, in a
 * string that is also printed on the payment QR.
 *
 * Uppercase hex because a human types this into a transfer memo: `0-9A-F`
 * has no O/I/l to be misread as 0/1. Four bytes give 4.3 billion codes, and
 * the unique index catches the birthday collision that a few thousand
 * invoices will never actually reach.
 */
export function sinhMaHoaDon(): string {
  return sinhMa(CODE_PREFIX.invoice);
}

/**
 * Extracts an invoice code from a transfer memo. Used by the SePay webhook.
 *
 * Banks upper-case and strip memos unpredictably, so the match is
 * case-insensitive and the result is normalised back to upper case.
 *
 * The `i` flag covers the `HD` prefix as well as the hex. Without it the
 * character class accepted `hd…` digits while the prefix still demanded
 * capitals, so a memo the bank had lower-cased was silently unmatched and the
 * transfer went unrecognised.
 */
export function parseMaHoaDon(text: string): string | null {
  const match = /HD([0-9A-F]{8})/i.exec(text);
  return match ? `HD${match[1]!.toUpperCase()}` : null;
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
function tinhHoaDon(input: {
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
