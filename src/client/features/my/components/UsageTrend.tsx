import { LineChart } from "@mantine/charts";
import { Card, Group, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { TenantMonth } from "../../../../shared/types";
import { isEnglish } from "../../../i18n";
import { periodTick } from "../../../format";

type ChartPoint = { period: string; value: number | null };

/**
 * Breathing room above and below the line, proportional rather than a fixed
 * number of units: electricity runs in the hundreds of kWh and water in the
 * tens of m³, so a pad that suits one squashes the other.
 *
 * The floor is clamped at 0 because negative usage does not exist — that only
 * bites when consumption is already near zero, where a zero baseline is honest
 * anyway.
 */
function axisDomain([min, max]: readonly [number, number]): [number, number] {
  const padding = Math.max((max - min) * 0.15, 1);
  return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
}

/**
 * One card per metric, stacked rather than side by side. Side by side, the
 * two split the history column — 0.85fr of the shell — into about 230px each,
 * which is not enough width for a year of points. Stacked, each gets the full
 * column.
 *
 * The unit sits beside the title because the y-axis ticks are bare numbers;
 * the tooltip carries it too, but that needs a hover the tenant may never do.
 */
function UsageChart({
  title,
  tooltipLabel,
  data,
  color,
  unit,
}: {
  /** Above the chart, where the axis already says the unit. */
  title: string;
  /** Inside the tooltip, which pops up over a bare point with no context. */
  tooltipLabel: string;
  data: ChartPoint[];
  color: string;
  unit: string;
}) {
  return (
    <Card>
      <Group justify="space-between" align="baseline" mb="md">
        <Title order={5}>{title}</Title>
        <Text size="xs" c="dimmed">
          {unit}
        </Text>
      </Group>

      <LineChart
        h={150}
        data={data}
        dataKey="period"
        series={[{ name: "value", label: tooltipLabel, color }]}
        // Straight segments between measurements, not the default `monotone`:
        // a smooth curve draws values between two months that were never read,
        // and can overshoot the highest point — showing a peak above the real
        // number.
        curveType="linear"
        // A month with no reading stays in the data as null and breaks the
        // line there. Dropping it instead would put 05/26 next to 07/26 as if
        // they were consecutive.
        connectNulls={false}
        valueFormatter={(v) =>
          `${v.toLocaleString(isEnglish() ? "en-US" : "vi-VN")} ${unit}`
        }
        // Scaled to the data, not to zero. Household usage never approaches
        // zero, so a zero baseline spends most of the height on a range that
        // carries no information and flattens the change being asked about.
        yAxisProps={{ domain: axisDomain, width: 34 }}
        tickLine="y"
        gridAxis="y"
      />
    </Card>
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
 * Returns them as siblings so the parent `Stack` spaces them like every other
 * card in the column, rather than wrapping them in a card of their own.
 *
 * Needs at least two months *with a reading* — one point is a number, not a
 * trend — so this renders nothing below that, same as the row list beside it
 * handles an empty history.
 */
export function UsageTrend({ months }: { months: TenantMonth[] }) {
  const { t } = useTranslation();

  // `months` arrives newest-first; a chart reads left to right as time passing.
  const chronological = months.slice().reverse();
  if (chronological.filter((m) => m.electricity_used !== null).length < 2) return null;

  const electricity = chronological.map((m) => ({
    period: periodTick(m.period),
    value: m.electricity_used,
  }));

  const water = chronological.map((m) => ({
    period: periodTick(m.period),
    value: m.water_used,
  }));

  return (
    <>
      <UsageChart
        title={t("meter.electricity")}
        tooltipLabel={t("meter.electricityUsed")}
        data={electricity}
        color="owed.5"
        unit="kWh"
      />
      <UsageChart
        title={t("meter.water")}
        tooltipLabel={t("meter.waterUsed")}
        data={water}
        color="settled.5"
        unit="m³"
      />
    </>
  );
}
