import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { reports } from "../../api";
import { currentPeriod } from "../../format";
import { useResource } from "../../hooks/useResource";

const YEAR_RE = /^\d{4}$/;

export function currentYear(): number {
  return Number(currentPeriod().slice(0, 4));
}

/**
 * The selected year lives in `?year=`, like `?period=` on the monthly screens,
 * so a reload or a bookmark comes back to the same year instead of this one.
 */
export function useYearParam(): [number, (year: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("year");
  const year = raw && YEAR_RE.test(raw) ? Number(raw) : currentYear();

  const setYear = useCallback(
    (next: number) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("year", String(next));
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [year, setYear];
}

export function useRevenueReport(year: number) {
  const { data, loading, refreshing, error, reload } = useResource(
    () => reports.revenue(year),
    [year],
  );

  // Months that have not happened yet are dropped, not drawn as zero. The
  // server fills all twelve so a past year's gaps are real zeros; for the
  // current year, October at 0 đ in September reads as revenue collapsing.
  // The current month counts as "not yet" until its invoices are issued —
  // meters are read, then billed, and in between it is simply unfinished.
  const now = currentPeriod();
  const months =
    data?.months.filter((month) => month.period < now || (month.period === now && month.billed > 0)) ??
    [];

  return { report: data, months, loading, refreshing, error, reload };
}
