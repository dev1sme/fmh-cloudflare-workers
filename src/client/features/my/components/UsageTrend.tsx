import { LineChart } from "@mantine/charts";
import { Card, Group, Text, Title } from "@mantine/core";
import type { TFunction } from "i18next";
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
/**
 * "Tháng gần nhất 198 kWh · −3% so với tháng trước", in words, above the chart.
 *
 * The chart shows the shape; this says the one comparison a tenant actually
 * makes — is this month more than last — without asking them to read two
 * points off an axis. Neutral grey on purpose: green here would say "paid",
 * which is what green means everywhere else in the app, and using less power
 * is not that.
 *
 * Compares the last two months *with* a reading, so a month with no reading
 * in between does not turn the change into a comparison against nothing.
 */
function latestSummary(data: ChartPoint[], unit: string, t: TFunction): string | null {
  const read = data.filter((point): point is { period: string; value: number } => point.value !== null);
  const latest = read.at(-1);
  if (!latest) return null;

  const format = (value: number) => value.toLocaleString(isEnglish() ? "en-US" : "vi-VN");
  const previous = read.at(-2);
  if (!previous || previous.value === 0) {
    return t("meter.latest", { value: format(latest.value), unit });
  }

  const pct = Math.round(((latest.value - previous.value) / previous.value) * 100);
  // A real minus sign, not a hyphen: it lines up with "+" in tabular figures.
  const change = pct === 0 ? "±0%" : `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
  return t("meter.latestChange", { value: format(latest.value), unit, change });
}

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
  const { t } = useTranslation();
  const summary = latestSummary(data, unit, t);

  return (
    <Card>
      <Group justify="space-between" align="baseline" mb={summary ? 2 : "md"}>
        <Title order={5}>{title}</Title>
        <Text size="xs" c="dimmed">
          {unit}
        </Text>
      </Group>
      {summary && (
        <Text size="sm" c="dimmed" mb="md">
          {summary}
        </Text>
      )}

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
        //
        // `tickFormatter` is set here because Mantine otherwise formats the
        // ticks with `valueFormatter`, unit included — "215 kWh" does not fit
        // 34 px and wrapped onto two lines under every tick.
        yAxisProps={{
          domain: axisDomain,
          width: 34,
          tickFormatter: (v: number) => v.toLocaleString(isEnglish() ? "en-US" : "vi-VN"),
        }}
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
