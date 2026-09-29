import { Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { PageHeader } from "../../components/PageHeader";
import { PageState } from "../../components/PageState";
import { PeriodPicker } from "../../components/PeriodPicker";
import { usePeriodParam } from "../../hooks/usePeriodParam";
import { DebtsTable } from "./components/DebtsTable";
import { RevenuePanel } from "./components/RevenuePanel";
import { RevenueChart } from "../../components/RevenueChart";
import { RoomsAndUsage } from "./components/RoomsAndUsage";
import { useDashboard } from "./useDashboard";

export function DashboardPage() {
  const [period, setPeriod] = usePeriodParam();
  const { dashboard, loading, refreshing, error, reload } = useDashboard(period);
  const { t } = useTranslation();

  return (
    <Stack>
      <PageHeader
        title={t("nav.dashboard")}
        actions={
          <>
            <PeriodPicker value={period} onChange={setPeriod} />
          </>
        }
      />

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {dashboard && (
          <Stack>
            <RevenuePanel revenue={dashboard.revenue} />
            <RoomsAndUsage period={period} rooms={dashboard.rooms} usage={dashboard.usage} />
            <RevenueChart history={dashboard.history} />
            <DebtsTable debts={dashboard.debts} />
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
