import type {
  Dashboard,
  DashboardDebt,
  DashboardHistoryPoint,
  DashboardRevenue,
  DashboardRooms,
  DashboardUsage,
} from "../../shared/types";
import { kyTruoc } from "../domain/ky";

/**
 * Everything the manager dashboard shows, in one `db.batch()`.
 *
 * Six statements go out as a single round trip because the Worker has ~10 ms
 * of CPU per request and a serial chain of awaits spends most of it waiting.
 *
 * `huy` invoices are excluded from every money figure: a cancelled invoice was
 * never owed, so counting it would overstate both revenue and debt.
 */

/** Paid-so-far per invoice. Joined rather than correlated so it scans once. */
const PAID_PER_INVOICE = `
  SELECT invoice_id, SUM(so_tien) AS da_thu FROM payments GROUP BY invoice_id
`;

const HISTORY_PERIODS = 12;

export async function getDashboard(db: D1Database, ky: string): Promise<Dashboard> {
  const truoc = kyTruoc(ky);

  const [revenue, debts, rooms, usage, usagePrev, history] = await db.batch([
    db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN i.trang_thai != 'huy' THEN i.tong_tien END), 0) AS billed,
           COALESCE(SUM(CASE WHEN i.trang_thai != 'huy' THEN pd.da_thu END), 0) AS collected,
           COALESCE(SUM(i.trang_thai = 'chua_thanh_toan'), 0) AS unpaid,
           COALESCE(SUM(i.trang_thai = 'da_thanh_toan'), 0) AS paid,
           COALESCE(SUM(i.trang_thai = 'huy'), 0) AS cancelled
         FROM invoices i
         LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
         WHERE i.ky = ?`,
      )
      .bind(ky),

    // Every period, not just this one — an old unpaid invoice is the whole
    // point of the list.
    db.prepare(
      `SELECT i.room_id, r.ten_phong AS room_name,
              SUM(i.tong_tien - COALESCE(pd.da_thu, 0)) AS amount,
              COUNT(*) AS invoice_count,
              MIN(i.ky) AS oldest_period
       FROM invoices i
       JOIN rooms r ON r.id = i.room_id
       LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
       WHERE i.trang_thai != 'huy' AND i.tong_tien - COALESCE(pd.da_thu, 0) > 0
       GROUP BY i.room_id, r.ten_phong
       ORDER BY amount DESC`,
    ),

    db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM rooms) AS total,
           (SELECT COUNT(*) FROM tenants WHERE ngay_ra IS NULL) AS occupied,
           (SELECT COALESCE(SUM(so_nguoi), 0) FROM tenants WHERE ngay_ra IS NULL) AS occupants,
           (SELECT COUNT(*) FROM rooms r
             WHERE NOT EXISTS (
               SELECT 1 FROM readings rd WHERE rd.room_id = r.id AND rd.ky = ?
             )) AS missing_readings`,
      )
      .bind(ky),

    db.prepare(USAGE).bind(ky),
    db.prepare(USAGE).bind(truoc),

    db
      .prepare(
        `SELECT i.ky AS period,
                COALESCE(SUM(CASE WHEN i.trang_thai != 'huy' THEN i.tong_tien END), 0) AS billed,
                COALESCE(SUM(CASE WHEN i.trang_thai != 'huy' THEN pd.da_thu END), 0) AS collected
         FROM invoices i
         LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
         GROUP BY i.ky
         ORDER BY i.ky DESC
         LIMIT ?`,
      )
      .bind(HISTORY_PERIODS),
  ]);

  const money = first<RevenueRow>(revenue);
  const roomRow = first<RoomsRow>(rooms);

  return {
    period: ky,
    revenue: revenueOf(money),
    debts: (debts.results ?? []) as DashboardDebt[],
    rooms: {
      total: roomRow?.total ?? 0,
      occupied: roomRow?.occupied ?? 0,
      vacant: Math.max(0, (roomRow?.total ?? 0) - (roomRow?.occupied ?? 0)),
      occupants: roomRow?.occupants ?? 0,
      missing_readings: roomRow?.missing_readings ?? 0,
    } satisfies DashboardRooms,
    usage: {
      electricity: first<UsageRow>(usage)?.electricity ?? 0,
      water: first<UsageRow>(usage)?.water ?? 0,
      electricity_previous: first<UsageRow>(usagePrev)?.electricity ?? 0,
      water_previous: first<UsageRow>(usagePrev)?.water ?? 0,
    } satisfies DashboardUsage,
    // The query sorts newest first so LIMIT keeps recent periods; the chart
    // wants oldest first.
    history: ((history.results ?? []) as DashboardHistoryPoint[]).slice().reverse(),
  };
}

const USAGE = `
  SELECT COALESCE(SUM(dien_moi - dien_cu), 0) AS electricity,
         COALESCE(SUM(nuoc_moi - nuoc_cu), 0) AS water
  FROM readings WHERE ky = ?
`;

type RevenueRow = {
  billed: number;
  collected: number;
  unpaid: number;
  paid: number;
  cancelled: number;
};

type RoomsRow = { total: number; occupied: number; occupants: number; missing_readings: number };
type UsageRow = { electricity: number; water: number };

function first<T>(result: D1Result): T | undefined {
  return (result.results ?? [])[0] as T | undefined;
}

function revenueOf(row: RevenueRow | undefined): DashboardRevenue {
  const billed = row?.billed ?? 0;
  const collected = row?.collected ?? 0;

  return {
    billed,
    collected,
    // Overpayment would otherwise show as negative debt.
    outstanding: Math.max(0, billed - collected),
    counts: {
      unpaid: row?.unpaid ?? 0,
      paid: row?.paid ?? 0,
      cancelled: row?.cancelled ?? 0,
    },
  };
}
