import { Box, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { PageHeader } from "../../components/PageHeader";
import { PageState } from "../../components/PageState";
import { RevenueChart } from "../../components/RevenueChart";
import { BreakdownList } from "./components/BreakdownList";
import { YearPanel } from "./components/YearPanel";
import { YearPicker } from "./components/YearPicker";
import { YearsTable } from "./components/YearsTable";
import { currentYear, useRevenueReport, useYearParam } from "./useRevenueReport";

/**
 * Revenue for a whole year, and every year against each other.
 *
 * The dashboard answers "this month"; this answers "this year" and "compared
 * with last year", which the twelve-period chart there could not — anything
 * older than twelve periods had no screen at all.
 *
 * A screen of its own rather than a year mode on the dashboard: half of the
 * dashboard (occupancy, readings still missing) describes *now*, and has no
 * meaning summed over a year.
 */
export function ReportsPage() {
  const [year, setYear] = useYearParam();
  const { report, months, loading, refreshing, error, reload } = useRevenueReport(year);
  const { t } = useTranslation();

  const headerContext =
    loading || !report ? undefined : t("reports.context", { count: report.totals.invoice_count });

  return (
    <Stack>
      <PageHeader
        title={t("reports.title")}
        context={headerContext}
        actions={<YearPicker value={year} max={currentYear()} onChange={setYear} />}
      />

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {report && (
          <Stack>
            <YearPanel report={report} />

            {report.totals.billed > 0 && (
              <>
                <RevenueChart
                  history={months}
                  title={t("reports.monthsTitle", { year: report.year })}
                />

                <Box className="fmh-report-grid">
                  <BreakdownList
                    title={t("reports.byBuilding")}
                    rows={report.buildings.map((row) => ({
                      key: row.building_id,
                      name: row.building_name,
                      billed: row.billed,
                      collected: row.collected,
                    }))}
                  />
                  <BreakdownList
                    title={t("reports.byRoom")}
                    rows={report.rooms.map((row) => ({
                      key: row.room_id,
                      name: row.room_name,
                      meta: t("reports.roomMeta", {
                        building: row.building_name,
                        count: row.invoice_count,
                      }),
                      billed: row.billed,
                      collected: row.collected,
                    }))}
                  />
                </Box>
              </>
            )}

            {report.years.length > 0 && (
              <YearsTable years={report.years} selected={report.year} onSelect={setYear} />
            )}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
