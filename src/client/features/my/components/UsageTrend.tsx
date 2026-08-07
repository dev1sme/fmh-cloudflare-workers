import { BarChart } from "@mantine/charts";
import { Card, SimpleGrid, Text, Title } from "@mantine/core";

import type { TenantMonth } from "../../../../shared/types";
import { periodTick } from "../../../format";

const SO = new Intl.NumberFormat("vi-VN");

/**
 * Electricity and water across recent months, so "sao tháng này điện cao thế?"
 * has an answer beyond the current bill.
 *
 * Two single-metric charts, not one grouped chart: electricity runs in the
 * hundreds of kWh and water in the tens of m³, so a shared axis would flatten
 * water to a sliver next to electricity.
 *
 * Needs at least two months with a reading — one point is a number, not a
 * trend — so this renders nothing below that, same as the row list above it
 * handles an empty history.
 */
export function UsageTrend({ months }: { months: TenantMonth[] }) {
  // `months` arrives newest-first; a chart reads left to right as time passing.
  const coChiSo = months.filter((m) => m.electricity_used !== null).slice().reverse();
  if (coChiSo.length < 2) return null;

  const data = coChiSo.map((m) => ({
    period: periodTick(m.period),
    "Điện": m.electricity_used ?? 0,
    "Nước": m.water_used ?? 0,
  }));

  return (
    <Card>
      <Title order={5} mb="md">
        Điện, nước theo tháng
      </Title>

      <SimpleGrid cols={{ base: 1, xs: 2 }}>
        <div>
          <Text size="xs" c="dimmed" mb={4}>
            Điện (kWh)
          </Text>
          <BarChart
            h={130}
            data={data}
            dataKey="period"
            series={[{ name: "Điện", color: "owed.5" }]}
            valueFormatter={(v) => `${SO.format(v)} kWh`}
            tickLine="y"
          />
        </div>

        <div>
          <Text size="xs" c="dimmed" mb={4}>
            Nước (m³)
          </Text>
          <BarChart
            h={130}
            data={data}
            dataKey="period"
            series={[{ name: "Nước", color: "settled.5" }]}
            valueFormatter={(v) => `${SO.format(v)} m³`}
            tickLine="y"
          />
        </div>
      </SimpleGrid>
    </Card>
  );
}
