import { BarChart } from "@mantine/charts";
import { Card, Text, Title } from "@mantine/core";

import type { DashboardHistoryPoint } from "../../../../shared/types";
import { tien } from "../../../format";

/** "2026-08" -> "08/26", short enough for an axis tick. */
function nhan(period: string): string {
  const [year, month] = period.split("-");
  return `${month}/${year?.slice(2)}`;
}

export function RevenueChart({ history }: { history: DashboardHistoryPoint[] }) {
  const data = history.map((point) => ({
    ky: nhan(point.period),
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
          dataKey="ky"
          series={[
            { name: "Phải thu", color: "blue.6" },
            { name: "Đã thu", color: "teal.6" },
          ]}
          valueFormatter={tien}
          withLegend
          tickLine="y"
        />
      )}
    </Card>
  );
}
