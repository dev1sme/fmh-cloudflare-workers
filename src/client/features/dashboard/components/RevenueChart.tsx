import { LineChart } from "@mantine/charts";
import { Card, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { DashboardHistoryPoint } from "../../../../shared/types";
import { periodTick, money, moneyShort } from "../../../format";

/**
 * Billed against collected, one line each.
 *
 * Two lines rather than paired bars: what the manager reads here is the gap
 * between them — the money invoiced but not yet in the account. Bars put that
 * gap between two columns of different heights, which has to be measured;
 * lines put it between two tracks, which is seen at a glance, and it stays
 * legible across all twelve periods.
 *
 * **The axis starts at zero and must keep starting at zero.** This is the one
 * place in the app where that matters more than resolution: the vertical
 * distance between the lines is being read as an amount of money, and it only
 * means that if the baseline is nothing. Framing the axis to the data — right
 * for the tenant's usage chart, where the question is "higher or lower than
 * usual" — would turn 4.2tr collected against 4.5tr billed into a chasm.
 *
 * A period with no invoices is a real zero, not missing data, so the line
 * drops to the floor rather than breaking.
 */
export function RevenueChart({ history }: { history: DashboardHistoryPoint[] }) {
  const { t } = useTranslation();

  // Series names are the data keys, so they are stable English identifiers;
  // `label` is what the legend and tooltip actually show.
  const data = history.map((point) => ({
    period: periodTick(point.period),
    billed: point.billed,
    collected: point.collected,
  }));

  return (
    <Card withBorder padding="md" radius="md">
      <Title order={5} mb="sm">
        {t("dashboard.revenueTitle", { count: history.length })}
      </Title>

      {history.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t("dashboard.noInvoicesYet")}
        </Text>
      ) : (
        <LineChart
          h={260}
          data={data}
          dataKey="period"
          series={[
            { name: "billed", label: t("dashboard.billed"), color: "owed.5" },
            // Dashed, and drawn second. A fully collected month has both
            // values equal, so a solid line on top hides the one underneath
            // and the amber track looks like it stops. Through the gaps in a
            // dashed stroke both are visible where they coincide, and the two
            // still read apart where they diverge.
            {
              name: "collected",
              label: t("dashboard.collected"),
              color: "settled.5",
              strokeDasharray: "6 4",
            },
          ]}
          // Straight segments: each period is one measurement, and a smoothed
          // curve would draw revenue on dates that were never billed.
          curveType="linear"
          // Tooltip keeps the exact figure; the axis only needs magnitude, and
          // "6.000.000 đ" does not fit in a tick.
          valueFormatter={money}
          yAxisProps={{ tickFormatter: moneyShort, width: 46, domain: [0, "auto"] }}
          withLegend
          tickLine="y"
        />
      )}
    </Card>
  );
}
