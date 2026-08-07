import { BarChart } from "@mantine/charts";
import { Card, Text, Title } from "@mantine/core";

import type { DashboardHistoryPoint } from "../../../../shared/types";
import { periodTick, tien, tienRutGon } from "../../../format";

export function RevenueChart({ history }: { history: DashboardHistoryPoint[] }) {
  const data = history.map((point) => ({
    period: periodTick(point.period),
    "Phải thu": point.billed,
    "Đã thu": point.collected,
  }));

  return (
    <Card withBorder padding="md" radius="md">
      <Title order={5} mb="sm">
        Doanh thu {history.length} kỳ gần nhất
      </Title>

      {history.length === 0 ? (
        <Text c="dimmed" size="sm">
          Chưa có hóa đơn nào để thống kê.
        </Text>
      ) : (
        <BarChart
          h={260}
          data={data}
          dataKey="period"
          series={[
            { name: "Phải thu", color: "owed.5" },
            { name: "Đã thu", color: "settled.5" },
          ]}
          // Tooltip keeps the exact figure; the axis only needs magnitude, and
          // "6.000.000 đ" does not fit in a tick.
          valueFormatter={tien}
          yAxisProps={{ tickFormatter: tienRutGon, width: 46 }}
          withLegend
          tickLine="y"
        />
      )}
    </Card>
  );
}
