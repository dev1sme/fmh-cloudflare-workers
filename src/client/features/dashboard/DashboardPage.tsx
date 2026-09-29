import { Group, Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { PageState } from "../../components/PageState";
import { PeriodPicker } from "../../components/PeriodPicker";
import { usePeriodParam } from "../../hooks/usePeriodParam";
import { DebtsTable } from "./components/DebtsTable";
import { RevenueCards } from "./components/RevenueCards";
import { RevenueChart } from "./components/RevenueChart";
import { RoomsAndUsage } from "./components/RoomsAndUsage";
import { useDashboard } from "./useDashboard";

export function DashboardPage() {
  const [period, setPeriod] = usePeriodParam();
  const { dashboard, loading, refreshing, error, reload } = useDashboard(period);
  const { t } = useTranslation();

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>{t("nav.dashboard")}</Title>
        <PeriodPicker value={period} onChange={setPeriod} />
      </Group>

      <PageState loading={loading} refreshing={refreshing} error={error} onRetry={reload}>
        {dashboard && (
          <Stack>
            <RevenueCards revenue={dashboard.revenue} />
            <RoomsAndUsage period={period} rooms={dashboard.rooms} usage={dashboard.usage} />
            <RevenueChart history={dashboard.history} />
            <DebtsTable debts={dashboard.debts} />
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
