import type {
  ChuyenKhoan,
  Invoice,
  InvoiceDetail,
  InvoiceStatus,
  InvoiceWithRoom,
} from "../../shared/types";
import { maHoaDon } from "../domain/invoice";
import { chuanHoaNoiDung, nganHangHopLe, taoVietQR } from "../domain/vietqr";
import { getReadingByRoomKy } from "./readings";
import { listPayments, sumPayments } from "./payments";
import { buildSet, Where } from "./sql";

const COLUMNS = `id, room_id, ky, tien_phong, tien_dien, tien_nuoc, phi_khac,
                 don_gia_dien, don_gia_nuoc, tong_tien, trang_thai, ngay_tao`;

const WITH_ROOM_SELECT = `
  SELECT i.id, i.room_id, i.ky, i.tien_phong, i.tien_dien, i.tien_nuoc, i.phi_khac,
         i.don_gia_dien, i.don_gia_nuoc, i.tong_tien, i.trang_thai, i.ngay_tao,
         r.ten_phong
  FROM invoices i
  JOIN rooms r ON r.id = i.room_id
`;

/** Same row, plus the bank details the VietQR code is built from. */
const DETAIL_SELECT = `
  SELECT i.id, i.room_id, i.ky, i.tien_phong, i.tien_dien, i.tien_nuoc, i.phi_khac,
         i.don_gia_dien, i.don_gia_nuoc, i.tong_tien, i.trang_thai, i.ngay_tao,
         r.ten_phong, b.bank_bin, b.bank_so_tk, b.bank_chu_tk
  FROM invoices i
  JOIN rooms r ON r.id = i.room_id
  JOIN buildings b ON b.id = r.building_id
`;

export async function listInvoices(
  db: D1Database,
  filters: { ky?: string; room_id?: number; trang_thai?: InvoiceStatus } = {},
): Promise<InvoiceWithRoom[]> {
  const where = new Where()
    .add("i.ky = ?", filters.ky)
    .add("i.room_id = ?", filters.room_id)
    .add("i.trang_thai = ?", filters.trang_thai);

  const { results } = await db
    .prepare(`${WITH_ROOM_SELECT}${where.clause()} ORDER BY i.ky DESC, r.ten_phong`)
    .bind(...where.bindings())
    .all<Omit<InvoiceWithRoom, "ma_hoa_don">>();

  return results.map((row) => ({ ...row, ma_hoa_don: maHoaDon(row.id) }));
}

export function getInvoice(db: D1Database, id: number): Promise<Invoice | null> {
  return db.prepare(`SELECT ${COLUMNS} FROM invoices WHERE id = ?`).bind(id).first<Invoice>();
}

export function getInvoiceByRoomKy(
  db: D1Database,
  roomId: number,
  ky: string,
): Promise<Invoice | null> {
  return db
    .prepare(`SELECT ${COLUMNS} FROM invoices WHERE room_id = ? AND ky = ?`)
    .bind(roomId, ky)
    .first<Invoice>();
}

/** Full invoice view: line items, the reading behind them, and what was paid. */
export async function getInvoiceDetail(
  db: D1Database,
  id: number,
): Promise<InvoiceDetail | null> {
  type DetailRow = Omit<InvoiceWithRoom, "ma_hoa_don"> & {
    bank_bin: string | null;
    bank_so_tk: string | null;
    bank_chu_tk: string | null;
  };

  const row = await db.prepare(`${DETAIL_SELECT} WHERE i.id = ?`).bind(id).first<DetailRow>();
  if (!row) return null;

  const [reading, payments, daThu] = await Promise.all([
    getReadingByRoomKy(db, row.room_id, row.ky),
    listPayments(db, id),
    sumPayments(db, id),
  ]);

  const { bank_bin, bank_so_tk, bank_chu_tk, ...invoice } = row;
  const conLai = row.tong_tien - daThu;
  const maHd = maHoaDon(row.id);

  return {
    ...invoice,
    ma_hoa_don: maHd,
    reading,
    payments,
    da_thu: daThu,
    con_lai: conLai,
    chuyen_khoan: taoChuyenKhoan(
      { bank_bin, bank_so_tk, bank_chu_tk },
      conLai,
      maHd,
      row.trang_thai,
    ),
  };
}

/** No QR for a cancelled or fully paid invoice, or an unconfigured building. */
function taoChuyenKhoan(
  bank: { bank_bin: string | null; bank_so_tk: string | null; bank_chu_tk: string | null },
  conLai: number,
  maHoaDonStr: string,
  trangThai: InvoiceStatus,
): ChuyenKhoan | null {
  if (conLai <= 0 || trangThai === "huy") return null;

  const nganHang = nganHangHopLe(bank);
  if (!nganHang) return null;

  const noiDung = chuanHoaNoiDung(maHoaDonStr);

  return {
    vietqr: taoVietQR({ nganHang, soTien: conLai, noiDung }),
    bank_bin: nganHang.bank_bin,
    bank_so_tk: nganHang.bank_so_tk,
    bank_chu_tk: nganHang.bank_chu_tk,
    noi_dung: noiDung,
    so_tien: conLai,
  };
}

/**
 * One row per room for a period: the reading to bill from, the tariff to
 * snapshot, and whether an invoice already exists.
 */
export type GenerationCandidate = {
  room_id: number;
  ten_phong: string;
  gia_phong: number;
  don_gia_dien: number;
  don_gia_nuoc: number;
  dien_cu: number | null;
  dien_moi: number | null;
  nuoc_cu: number | null;
  nuoc_moi: number | null;
  invoice_id: number | null;
};

export async function listGenerationCandidates(
  db: D1Database,
  ky: string,
  roomIds?: number[],
): Promise<GenerationCandidate[]> {
  const filter =
    roomIds && roomIds.length > 0
      ? ` WHERE r.id IN (${roomIds.map(() => "?").join(", ")})`
      : "";

  const { results } = await db
    .prepare(
      `SELECT r.id AS room_id, r.ten_phong, r.gia_phong,
              b.don_gia_dien, b.don_gia_nuoc,
              rd.dien_cu, rd.dien_moi, rd.nuoc_cu, rd.nuoc_moi,
              inv.id AS invoice_id
       FROM rooms r
       JOIN buildings b ON b.id = r.building_id
       LEFT JOIN readings rd ON rd.room_id = r.id AND rd.ky = ?
       LEFT JOIN invoices inv ON inv.room_id = r.id AND inv.ky = ?
       ${filter}
       ORDER BY r.ten_phong`,
    )
    .bind(ky, ky, ...(roomIds ?? []))
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
        `INSERT INTO invoices (room_id, ky, tien_phong, tien_dien, tien_nuoc, phi_khac,
                               don_gia_dien, don_gia_nuoc, tong_tien, trang_thai, ngay_tao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING ${COLUMNS}`,
      )
      .bind(
        input.room_id,
        input.ky,
        input.tien_phong,
        input.tien_dien,
        input.tien_nuoc,
        input.phi_khac,
        input.don_gia_dien,
        input.don_gia_nuoc,
        input.tong_tien,
        input.trang_thai,
        input.ngay_tao,
      ),
  );

  // A D1 batch runs as one transaction: either every invoice for the period is
  // created or none is.
  const batches = await db.batch<Invoice>(statements);
  return batches.flatMap((batch) => batch.results);
}

export type InvoicePatch = {
  tien_phong?: number;
  phi_khac?: number;
  trang_thai?: InvoiceStatus;
  tong_tien?: number;
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
