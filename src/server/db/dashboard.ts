import type {
  Dashboard,
  DashboardDebt,
  DashboardHistoryPoint,
  DashboardRevenue,
  DashboardRooms,
  DashboardUsage,
  TenantDashboard,
  TenantMonth,
} from "../../shared/types";
import { previousPeriod } from "../domain/period";

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
  SELECT invoice_id, SUM(amount) AS paid_total FROM payments GROUP BY invoice_id
`;

const HISTORY_PERIODS = 12;

export async function getDashboard(db: D1Database, period: string): Promise<Dashboard> {
  const truoc = previousPeriod(period);

  const [revenue, debts, rooms, usage, usagePrev, history] = await db.batch([
    db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN i.status != 'CANCELLED' THEN i.total END), 0) AS billed,
           COALESCE(SUM(CASE WHEN i.status != 'CANCELLED' THEN pd.paid_total END), 0) AS collected,
           COALESCE(SUM(i.status = 'UNPAID'), 0) AS unpaid,
           COALESCE(SUM(i.status = 'PAID'), 0) AS paid,
           COALESCE(SUM(i.status = 'CANCELLED'), 0) AS cancelled
         FROM invoices i
         LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
         WHERE i.period = ?`,
      )
      .bind(period),

    // Every period, not just this one — an old unpaid invoice is the whole
    // point of the list.
    db.prepare(
      `SELECT i.room_id, r.room_name,
              SUM(i.total - COALESCE(pd.paid_total, 0)) AS amount,
              COUNT(*) AS invoice_count,
              MIN(i.period) AS oldest_period
       FROM invoices i
       JOIN rooms r ON r.id = i.room_id
       LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
       WHERE i.status != 'CANCELLED' AND i.total - COALESCE(pd.paid_total, 0) > 0
       GROUP BY i.room_id, r.room_name
       ORDER BY amount DESC`,
    ),

    db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM rooms) AS total,
           (SELECT COUNT(*) FROM tenants WHERE moved_out IS NULL) AS occupied,
           (SELECT COALESCE(SUM(occupants), 0) FROM tenants WHERE moved_out IS NULL) AS occupants,
           (SELECT COUNT(*) FROM rooms r
             WHERE NOT EXISTS (
               SELECT 1 FROM readings rd WHERE rd.room_id = r.id AND rd.period = ?
             )) AS missing_readings`,
      )
      .bind(period),

    db.prepare(USAGE).bind(period),
    db.prepare(USAGE).bind(truoc),

    db
      .prepare(
        `SELECT i.period AS period,
                COALESCE(SUM(CASE WHEN i.status != 'CANCELLED' THEN i.total END), 0) AS billed,
                COALESCE(SUM(CASE WHEN i.status != 'CANCELLED' THEN pd.paid_total END), 0) AS collected
         FROM invoices i
         LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
         GROUP BY i.period
         ORDER BY i.period DESC
         LIMIT ?`,
      )
      .bind(HISTORY_PERIODS),
  ]);

  const money = first<RevenueRow>(revenue);
  const roomRow = first<RoomsRow>(rooms);

  return {
    period: period,
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
  SELECT COALESCE(SUM(electricity_end - electricity_start), 0) AS electricity,
         COALESCE(SUM(water_end - water_start), 0) AS water
  FROM readings WHERE period = ?
`;

const TENANT_MONTHS = 24;

/**
 * The tenant's own months: meter usage and what was billed and paid.
 *
 * Periods come from a UNION of readings and invoices, not from either alone —
 * a month can have a reading the manager has not invoiced yet, and that is
 * exactly the month a tenant wants to see. `total` and `status` stay null
 * until the invoice exists.
 */
export async function getTenantDashboard(
  db: D1Database,
  roomId: number,
): Promise<TenantDashboard> {
  const [months, room] = await db.batch([
    db
      .prepare(
        `WITH periods AS (
           SELECT period FROM readings WHERE room_id = ?1
           UNION
           SELECT period FROM invoices WHERE room_id = ?1
         )
         SELECT p.period,
                rd.electricity_end - rd.electricity_start AS electricity_used,
                rd.water_end - rd.water_start             AS water_used,
                i.total,
                i.status,
                COALESCE(pd.paid_total, 0) AS paid
         FROM periods p
         LEFT JOIN readings rd ON rd.room_id = ?1 AND rd.period = p.period
         LEFT JOIN invoices i  ON i.room_id  = ?1 AND i.period  = p.period
         LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
         ORDER BY p.period DESC
         LIMIT ?2`,
      )
      .bind(roomId, TENANT_MONTHS),

    db.prepare("SELECT room_name FROM rooms WHERE id = ?").bind(roomId),
  ]);

  type MonthRow = {
    period: string;
    electricity_used: number | null;
    water_used: number | null;
    total: number | null;
    status: TenantMonth["status"];
    paid: number;
  };

  const rows = ((months.results ?? []) as MonthRow[]).map((row) => ({
    ...row,
    // A cancelled invoice was never owed, so it shows no balance due.
    outstanding:
      row.total === null || row.status === "CANCELLED"
        ? 0
        : Math.max(0, row.total - row.paid),
  }));

  return {
    room_name: first<{ room_name: string }>(room)?.room_name ?? "",
    months: rows,
    outstanding_total: rows.reduce((sum, row) => sum + row.outstanding, 0),
  };
}

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
