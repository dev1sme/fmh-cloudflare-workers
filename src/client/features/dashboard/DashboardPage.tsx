import { Group, Stack, Title } from "@mantine/core";
import { useState } from "react";

import { PageState } from "../../components/PageState";
import { PeriodPicker } from "../../components/PeriodPicker";
import { currentPeriod } from "../../format";
import { DebtsTable } from "./components/DebtsTable";
import { RevenueCards } from "./components/RevenueCards";
import { RevenueChart } from "./components/RevenueChart";
import { RoomsAndUsage } from "./components/RoomsAndUsage";
import { useDashboard } from "./useDashboard";

export function DashboardPage() {
  const [period, setPeriod] = useState(currentPeriod());
  const { soLieu, loading, error } = useDashboard(period);

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Tổng quan</Title>
        <PeriodPicker value={period} onChange={setPeriod} />
      </Group>

      <PageState loading={loading} error={error}>
        {soLieu && (
          <Stack>
            <RevenueCards revenue={soLieu.revenue} />
            <RoomsAndUsage rooms={soLieu.rooms} usage={soLieu.usage} />
            <RevenueChart history={soLieu.history} />
            <DebtsTable debts={soLieu.debts} />
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
