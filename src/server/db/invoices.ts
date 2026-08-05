import type {
  BankTransfer,
  Invoice,
  InvoiceDetail,
  InvoiceStatus,
  InvoiceWithRoom,
} from "../../shared/types";
import { chuanHoaNoiDung, nganHangHopLe, taoVietQR } from "../domain/vietqr";
import { getReadingByRoomKy } from "./readings";
import { listPayments, sumPayments } from "./payments";
import { buildSet, Where } from "./sql";

const COLUMNS = `id, code, room_id, period, rent_amount, electricity_amount, water_amount, other_fees,
                 electricity_rate, water_rate, total, status, created_at`;

const WITH_ROOM_SELECT = `
  SELECT i.id, i.code, i.room_id, i.period, i.rent_amount, i.electricity_amount, i.water_amount, i.other_fees,
         i.electricity_rate, i.water_rate, i.total, i.status, i.created_at,
         r.room_name,
         COALESCE(pd.paid_total, 0) AS paid
  FROM invoices i
  JOIN rooms r ON r.id = i.room_id
  LEFT JOIN (SELECT invoice_id, SUM(amount) AS paid_total FROM payments GROUP BY invoice_id) pd
    ON pd.invoice_id = i.id
`;

/** Same row, plus the bank details the VietQR code is built from. */
const DETAIL_SELECT = `
  SELECT i.id, i.code, i.room_id, i.period, i.rent_amount, i.electricity_amount, i.water_amount, i.other_fees,
         i.electricity_rate, i.water_rate, i.total, i.status, i.created_at,
         r.room_name, b.bank_bin, b.bank_account_no, b.bank_account_name, b.momo_phone, b.momo_name
  FROM invoices i
  JOIN rooms r ON r.id = i.room_id
  JOIN buildings b ON b.id = r.building_id
`;

export async function listInvoices(
  db: D1Database,
  filters: { period?: string; room_id?: number; status?: InvoiceStatus } = {},
): Promise<InvoiceWithRoom[]> {
  const where = new Where()
    .add("i.period = ?", filters.period)
    .add("i.room_id = ?", filters.room_id)
    .add("i.status = ?", filters.status);

  const { results } = await db
    .prepare(`${WITH_ROOM_SELECT}${where.clause()} ORDER BY i.period DESC, r.room_name`)
    .bind(...where.bindings())
    .all<InvoiceWithRoom>();

  return results;
}

export function getInvoice(db: D1Database, id: number): Promise<Invoice | null> {
  return db.prepare(`SELECT ${COLUMNS} FROM invoices WHERE id = ?`).bind(id).first<Invoice>();
}

export function getInvoiceByRoomKy(
  db: D1Database,
  roomId: number,
  period: string,
): Promise<Invoice | null> {
  return db
    .prepare(`SELECT ${COLUMNS} FROM invoices WHERE room_id = ? AND period = ?`)
    .bind(roomId, period)
    .first<Invoice>();
}

export function getInvoiceByCode(db: D1Database, code: string): Promise<Invoice | null> {
  return db.prepare(`SELECT ${COLUMNS} FROM invoices WHERE code = ?`).bind(code).first<Invoice>();
}

/** Full invoice view: line items, the reading behind them, and what was paid. */
export async function getInvoiceDetail(
  db: D1Database,
  code: string,
): Promise<InvoiceDetail | null> {
  type DetailRow = InvoiceWithRoom & {
    bank_bin: string | null;
    bank_account_no: string | null;
    bank_account_name: string | null;
    momo_phone: string | null;
    momo_name: string | null;
  };

  const row = await db.prepare(`${DETAIL_SELECT} WHERE i.code = ?`).bind(code).first<DetailRow>();
  if (!row) return null;

  const [reading, payments, daThu] = await Promise.all([
    getReadingByRoomKy(db, row.room_id, row.period),
    listPayments(db, row.id),
    sumPayments(db, row.id),
  ]);

  const { bank_bin, bank_account_no, bank_account_name, momo_phone, momo_name, ...invoice } = row;
  const conLai = row.total - daThu;
  const maHd = row.code;
  const conNo = conLai > 0 && row.status !== "CANCELLED";

  return {
    ...invoice,
    reading,
    payments,
    paid: daThu,
    outstanding: conLai,
    bank_transfer: taoChuyenKhoan(
      { bank_bin, bank_account_no, bank_account_name },
      conLai,
      maHd,
      row.status,
    ),
    momo:
      conNo && momo_phone
        ? {
            phone: momo_phone,
            name: momo_name,
            amount: conLai,
            transfer_note: chuanHoaNoiDung(maHd),
          }
        : null,
  };
}

/** No QR for a cancelled or fully paid invoice, or an unconfigured building. */
function taoChuyenKhoan(
  bank: { bank_bin: string | null; bank_account_no: string | null; bank_account_name: string | null },
  conLai: number,
  maHoaDonStr: string,
  trangThai: InvoiceStatus,
): BankTransfer | null {
  if (conLai <= 0 || trangThai === "CANCELLED") return null;

  const nganHang = nganHangHopLe(bank);
  if (!nganHang) return null;

  const noiDung = chuanHoaNoiDung(maHoaDonStr);

  return {
    vietqr: taoVietQR({ nganHang, soTien: conLai, noiDung }),
    bank_bin: nganHang.bank_bin,
    bank_account_no: nganHang.bank_account_no,
    bank_account_name: nganHang.bank_account_name,
    transfer_note: noiDung,
    amount: conLai,
  };
}

/**
 * One row per room for a period: the reading to bill from, the tariff to
 * snapshot, and whether an invoice already exists.
 */
export type GenerationCandidate = {
  room_id: number;
  room_name: string;
  building_id: number;
  building_name: string;
  rent: number;
  electricity_rate: number;
  water_rate: number;
  electricity_start: number | null;
  electricity_end: number | null;
  water_start: number | null;
  water_end: number | null;
  invoice_id: number | null;
};

export async function listGenerationCandidates(
  db: D1Database,
  period: string,
  roomIds?: number[],
): Promise<GenerationCandidate[]> {
  // Undefined means every room; an explicit empty selection means none. Falling
  // back to "every room" there would turn an empty pick into a full run.
  if (roomIds && roomIds.length === 0) return [];

  const filter = roomIds ? ` WHERE r.id IN (${roomIds.map(() => "?").join(", ")})` : "";

  const { results } = await db
    .prepare(
      `SELECT r.id AS room_id, r.room_name, r.building_id, b.name AS building_name,
              r.rent, b.electricity_rate, b.water_rate,
              rd.electricity_start, rd.electricity_end, rd.water_start, rd.water_end,
              inv.id AS invoice_id
       FROM rooms r
       JOIN buildings b ON b.id = r.building_id
       LEFT JOIN readings rd ON rd.room_id = r.id AND rd.period = ?
       LEFT JOIN invoices inv ON inv.room_id = r.id AND inv.period = ?
       ${filter}
       ORDER BY b.name, r.room_name`,
    )
    .bind(period, period, ...(roomIds ?? []))
    .all<GenerationCandidate>();

  return results;
}

export type InvoiceInput = Omit<Invoice, "id">;

export async function createInvoices(
  db: D1Database,
  inputs: InvoiceInput[],
): Promise<Invoice[]> {
  if (inputs.length === 0) return [];

  const statements = inputs.map((input) =>
    db
      .prepare(
        `INSERT INTO invoices (code, room_id, period, rent_amount, electricity_amount, water_amount,
                               other_fees, electricity_rate, water_rate, total, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING ${COLUMNS}`,
      )
      .bind(
        input.code,
        input.room_id,
        input.period,
        input.rent_amount,
        input.electricity_amount,
        input.water_amount,
        input.other_fees,
        input.electricity_rate,
        input.water_rate,
        input.total,
        input.status,
        input.created_at,
      ),
  );

  // A D1 batch runs as one transaction: either every invoice for the period is
  // created or none is.
  const batches = await db.batch<Invoice>(statements);
  return batches.flatMap((batch) => batch.results);
}

export type InvoicePatch = {
  rent_amount?: number;
  other_fees?: number;
  status?: InvoiceStatus;
  total?: number;
};

export async function updateInvoice(
  db: D1Database,
  id: number,
  patch: InvoicePatch,
): Promise<Invoice | null> {
  const set = buildSet(patch);
  if (set) {
    await db
      .prepare(`UPDATE invoices SET ${set.clause} WHERE id = ?`)
      .bind(...set.values, id)
      .run();
  }
  return getInvoice(db, id);
}

export async function deleteInvoice(db: D1Database, id: number): Promise<void> {
  await db.prepare("DELETE FROM invoices WHERE id = ?").bind(id).run();
}
