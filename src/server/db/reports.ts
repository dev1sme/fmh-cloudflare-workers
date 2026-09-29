import type {
  RevenueByBuilding,
  RevenueByRoom,
  RevenueMonth,
  RevenueReport,
  RevenueYear,
} from "../../shared/types";

/**
 * Revenue across a year and across every year, for the reports screen.
 *
 * Two bases, never mixed in one figure (see `RevenueFigures`):
 * - billed / collected follow `invoices.period`, like the dashboard;
 * - cash_in follows `payments.paid_on`.
 *
 * Cancelled invoices — and any payment against one — are excluded everywhere:
 * a cancelled invoice was never owed.
 *
 * Six statements in one `db.batch()`, for the same reason as the dashboard:
 * the Worker has ~10 ms of CPU and a chain of awaits spends it waiting.
 */

/** Paid-so-far per invoice. Joined rather than correlated so it scans once. */
const PAID_PER_INVOICE = `
  SELECT invoice_id, SUM(amount) AS paid_total FROM payments GROUP BY invoice_id
`;

/** Payments that count: not against a cancelled invoice. */
const LIVE_PAYMENTS = `
  FROM payments p
  JOIN invoices i ON i.id = p.invoice_id
  WHERE i.status != 'CANCELLED'
`;

type YearBilledRow = { year: number; billed: number; collected: number; invoice_count: number };
type YearCashRow = { year: number; cash_in: number };
type MonthBilledRow = { period: string; billed: number; collected: number };
type MonthCashRow = { period: string; cash_in: number };
type BuildingRow = Omit<RevenueByBuilding, "outstanding">;
type RoomRow = Omit<RevenueByRoom, "outstanding">;

export async function getRevenueReport(db: D1Database, year: number): Promise<RevenueReport> {
  // Ranges rather than `substr(period, 1, 4) = ?`, so `idx_invoices_period`
  // is usable. Periods are `YYYY-MM` and dates `YYYY-MM-DD`, both of which
  // sort as text in calendar order.
  const firstPeriod = `${year}-01`;
  const lastPeriod = `${year}-12`;
  const firstDay = `${year}-01-01`;
  const nextYearFirstDay = `${year + 1}-01-01`;

  const [billedByYear, cashByYear, billedByMonth, cashByMonth, byBuilding, byRoom] =
    await db.batch([
      db.prepare(
        `SELECT CAST(substr(i.period, 1, 4) AS INTEGER) AS year,
                SUM(i.total) AS billed,
                COALESCE(SUM(pd.paid_total), 0) AS collected,
                COUNT(*) AS invoice_count
         FROM invoices i
         LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
         WHERE i.status != 'CANCELLED'
         GROUP BY year`,
      ),

      db.prepare(
        `SELECT CAST(substr(p.paid_on, 1, 4) AS INTEGER) AS year, SUM(p.amount) AS cash_in
         ${LIVE_PAYMENTS}
         GROUP BY year`,
      ),

      db
        .prepare(
          `SELECT i.period AS period,
                  SUM(i.total) AS billed,
                  COALESCE(SUM(pd.paid_total), 0) AS collected
           FROM invoices i
           LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
           WHERE i.status != 'CANCELLED' AND i.period BETWEEN ? AND ?
           GROUP BY i.period`,
        )
        .bind(firstPeriod, lastPeriod),

      db
        .prepare(
          `SELECT substr(p.paid_on, 1, 7) AS period, SUM(p.amount) AS cash_in
           ${LIVE_PAYMENTS} AND p.paid_on >= ? AND p.paid_on < ?
           GROUP BY period`,
        )
        .bind(firstDay, nextYearFirstDay),

      db
        .prepare(
          `SELECT b.id AS building_id, b.name AS building_name,
                  SUM(i.total) AS billed,
                  COALESCE(SUM(pd.paid_total), 0) AS collected
           FROM invoices i
           JOIN rooms r ON r.id = i.room_id
           JOIN buildings b ON b.id = r.building_id
           LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
           WHERE i.status != 'CANCELLED' AND i.period BETWEEN ? AND ?
           GROUP BY b.id, b.name
           ORDER BY billed DESC`,
        )
        .bind(firstPeriod, lastPeriod),

      db
        .prepare(
          `SELECT r.id AS room_id, r.room_name, b.name AS building_name,
                  SUM(i.total) AS billed,
                  COALESCE(SUM(pd.paid_total), 0) AS collected,
                  COUNT(*) AS invoice_count
           FROM invoices i
           JOIN rooms r ON r.id = i.room_id
           JOIN buildings b ON b.id = r.building_id
           LEFT JOIN (${PAID_PER_INVOICE}) pd ON pd.invoice_id = i.id
           WHERE i.status != 'CANCELLED' AND i.period BETWEEN ? AND ?
           GROUP BY r.id, r.room_name, b.name
           ORDER BY b.name, r.room_name`,
        )
        .bind(firstPeriod, lastPeriod),
    ]);

  const years = mergeYears(rows<YearBilledRow>(billedByYear), rows<YearCashRow>(cashByYear));
  const selected = years.find((row) => row.year === year);
  const selectedCount = rows<YearBilledRow>(billedByYear).find((row) => row.year === year)?.invoice_count ?? 0;

  return {
    year,
    totals: {
      billed: selected?.billed ?? 0,
      collected: selected?.collected ?? 0,
      outstanding: selected?.outstanding ?? 0,
      cash_in: selected?.cash_in ?? 0,
      invoice_count: selectedCount,
    },
    months: twelveMonths(year, rows<MonthBilledRow>(billedByMonth), rows<MonthCashRow>(cashByMonth)),
    buildings: rows<BuildingRow>(byBuilding).map((row) => ({ ...row, outstanding: owed(row) })),
    rooms: rows<RoomRow>(byRoom).map((row) => ({ ...row, outstanding: owed(row) })),
    years,
  };
}

/**
 * One row per year that has either an invoice or a payment. A year can have
 * cash and no invoices — January paying off December — and still belongs in
 * the list.
 */
function mergeYears(billed: YearBilledRow[], cash: YearCashRow[]): RevenueYear[] {
  const byYear = new Map<number, RevenueYear>();
  const at = (year: number) => {
    let row = byYear.get(year);
    if (!row) {
      row = { year, billed: 0, collected: 0, outstanding: 0, cash_in: 0 };
      byYear.set(year, row);
    }
    return row;
  };

  for (const row of billed) {
    const entry = at(row.year);
    entry.billed = row.billed;
    entry.collected = row.collected;
    entry.outstanding = owed(row);
  }
  for (const row of cash) at(row.year).cash_in = row.cash_in;

  return [...byYear.values()].sort((a, b) => b.year - a.year);
}

/** January to December, zero-filled, so the chart always has twelve bars. */
function twelveMonths(year: number, billed: MonthBilledRow[], cash: MonthCashRow[]): RevenueMonth[] {
  return Array.from({ length: 12 }, (_, index) => {
    const period = `${year}-${String(index + 1).padStart(2, "0")}`;
    const bill = billed.find((row) => row.period === period);
    const paid = cash.find((row) => row.period === period);
    const figures = { billed: bill?.billed ?? 0, collected: bill?.collected ?? 0 };
    return { period, ...figures, outstanding: owed(figures), cash_in: paid?.cash_in ?? 0 };
  });
}

function owed(row: { billed: number; collected: number }): number {
  return Math.max(0, row.billed - row.collected);
}

function rows<T>(result: D1Result): T[] {
  return (result.results ?? []) as T[];
}
