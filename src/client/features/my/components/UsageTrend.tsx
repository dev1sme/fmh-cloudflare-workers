import { LineChart } from "@mantine/charts";
import { Card, SimpleGrid, Text, Title } from "@mantine/core";

import type { TenantMonth } from "../../../../shared/types";
import { periodTick } from "../../../format";

const SO = new Intl.NumberFormat("vi-VN");

type Diem = { period: string; value: number | null };

/**
 * Breathing room above and below the line, proportional rather than a fixed
 * number of units: electricity runs in the hundreds of kWh and water in the
 * tens of m³, so a pad that suits one squashes the other.
 *
 * The floor is clamped at 0 because negative usage does not exist — that only
 * bites when consumption is already near zero, where a zero baseline is honest
 * anyway.
 */
function daiTruc([min, max]: readonly [number, number]): [number, number] {
  const dem = Math.max((max - min) * 0.15, 1);
  return [Math.max(0, Math.floor(min - dem)), Math.ceil(max + dem)];
}

function Bieu({
  tieuDe,
  data,
  mau,
  donVi,
}: {
  tieuDe: string;
  data: Diem[];
  mau: string;
  donVi: string;
}) {
  return (
    <div>
      <Text size="xs" c="dimmed" mb={4}>
        {tieuDe}
      </Text>

      <LineChart
        h={140}
        data={data}
        dataKey="period"
        series={[{ name: "value", label: tieuDe, color: mau }]}
        // Straight segments between measurements, not the default `monotone`:
        // a smooth curve draws values between two months that were never read,
        // and can overshoot the highest point — showing a peak above the real
        // number.
        curveType="linear"
        // A month with no reading stays in the data as null and breaks the
        // line there. Dropping it instead would put 05/26 next to 07/26 as if
        // they were consecutive.
        connectNulls={false}
        valueFormatter={(v) => `${SO.format(v)} ${donVi}`}
        // Scaled to the data, not to zero. Household usage never approaches
        // zero, so a zero baseline spends most of the height on a range that
        // carries no information and flattens the change being asked about.
        yAxisProps={{ domain: daiTruc, width: 34 }}
        tickLine="y"
        gridAxis="y"
      />
    </div>
  );
}

/**
 * Electricity and water across the chosen window, so "sao tháng này điện cao
 * thế?" has an answer beyond the current bill.
 *
 * Lines, not bars. A bar has to start at zero — its length *is* the number, so
 * a cut axis lies — and household electricity sits around 150-250 kWh, which
 * pushes every real change into the top slice of the chart. A line only has to
 * put the point in the right place, so the axis can frame the range that
 * actually varies.
 *
 * Two single-metric charts, not one chart with two lines: electricity runs in
 * the hundreds of kWh and water in the tens of m³, so a shared axis flattens
 * water to a sliver. A second y-axis instead would scale the two lines
 * differently and invent crossings that mean nothing.
 *
 * Needs at least two months *with a reading* — one point is a number, not a
 * trend — so this renders nothing below that, same as the row list beside it
 * handles an empty history.
 */
export function UsageTrend({ months }: { months: TenantMonth[] }) {
  // `months` arrives newest-first; a chart reads left to right as time passing.
  const theoThoiGian = months.slice().reverse();
  if (theoThoiGian.filter((m) => m.electricity_used !== null).length < 2) return null;

  const dien = theoThoiGian.map((m) => ({
    period: periodTick(m.period),
    value: m.electricity_used,
  }));

  const nuoc = theoThoiGian.map((m) => ({
    period: periodTick(m.period),
    value: m.water_used,
  }));

  return (
    <Card>
      <Title order={5} mb="md">
        Điện, nước theo tháng
      </Title>

      <SimpleGrid cols={{ base: 1, xs: 2 }}>
        <Bieu tieuDe="Điện (kWh)" data={dien} mau="owed.5" donVi="kWh" />
        <Bieu tieuDe="Nước (m³)" data={nuoc} mau="settled.5" donVi="m³" />
      </SimpleGrid>
    </Card>
  );
}
