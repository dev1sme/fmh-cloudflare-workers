import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { currentPeriod } from "../format";

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * The billing period, kept in the URL (`?period=YYYY-MM`) instead of a
 * `useState`.
 *
 * Tổng quan, Chỉ số điện nước and Hóa đơn each picked their own period
 * independently — three separate `useState(currentPeriod())`. Reading last
 * month's meters, then clicking "Hóa đơn" to generate from them, silently
 * reset the period back to the current month, because the invoices screen had
 * no idea what period the readings screen was just showing. Putting the same
 * param in the URL is what lets `AppLayout`'s sidebar carry it across that
 * click without the three pages knowing about each other.
 *
 * It also means a refreshed tab or a pasted link reopens on the month it was
 * showing rather than jumping to today's.
 *
 * `replace: true` on every change: stepping through six months with the arrow
 * buttons should not leave six entries for the back button to climb out of —
 * a period is a filter, not a page the manager navigated to.
 */
export function usePeriodParam(): [string, (period: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("period");
  const period = raw && PERIOD_RE.test(raw) ? raw : currentPeriod();

  const setPeriod = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("period", next);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [period, setPeriod];
}
