import { Group, Progress, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { RevenueReport } from "../../../../shared/types";
import { StatusPanel } from "../../../components/StatusPanel";
import { money } from "../../../format";

/**
 * The year's revenue as the screen's one focal point.
 *
 * The figure is what was invoiced for the year's periods; the fill says
 * whether any of it is still out — amber while it is, green once all of it is
 * in. Under it: how far collection has got, the change on the year before,
 * and the cash that actually arrived during the year, which differs when
 * December is paid in January (see `RevenueFigures`).
 */
export function YearPanel({ report }: { report: RevenueReport }) {
  const { t } = useTranslation();
  const { year, totals } = report;

  if (totals.billed === 0) {
    return (
      <StatusPanel
        tone="neutral"
        label={t("reports.nothingBilled", { year })}
        value={money(0)}
        hint={totals.cash_in > 0 ? t("reports.cashIn", { amount: money(totals.cash_in) }) : undefined}
      />
    );
  }

  const previous = report.years.find((row) => row.year === year - 1);
  const change = previous && previous.billed > 0 ? percentChange(totals.billed, previous.billed) : null;
  const ratio = Math.min(100, (totals.collected / totals.billed) * 100);

  return (
    <StatusPanel
      tone={totals.outstanding > 0 ? "owed" : "settled"}
      label={t("reports.revenueOf", { year })}
      value={money(totals.billed)}
      hint={change && t("reports.versusYear", { change, year: year - 1 })}
    >
      <Stack gap={6} maw={560}>
        <Progress.Root size={10} radius="xl" style={{ backgroundColor: "var(--fmh-owed-edge)" }}>
          <Progress.Section value={ratio} color="settled" />
        </Progress.Root>
        <Group justify="space-between" gap="xs" wrap="wrap">
          <Text size="sm" c="settled" fw={500}>
            {t("reports.collectedOfBilled", {
              collected: money(totals.collected),
              billed: money(totals.billed),
            })}
          </Text>
          {totals.outstanding > 0 && (
            <Text size="sm" c="owed" fw={600}>
              {t("reports.stillToCollect", { amount: money(totals.outstanding) })}
            </Text>
          )}
        </Group>
        <Text size="sm" c="dimmed">
          {t("reports.cashIn", { amount: money(totals.cash_in) })}
        </Text>
      </Stack>
    </StatusPanel>
  );
}

/** "+12%", "−3%", "±0%" — a real minus sign, which lines up with "+". */
function percentChange(current: number, previous: number): string {
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "±0%";
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
}
