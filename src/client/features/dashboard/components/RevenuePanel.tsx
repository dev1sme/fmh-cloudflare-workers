import { Group, Progress, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { DashboardRevenue } from "../../../../shared/types";
import { StatusPanel } from "../../../components/StatusPanel";
import { money } from "../../../format";

/**
 * Money for the selected period, as the dashboard's one focal point.
 * Cancelled invoices are already excluded.
 *
 * This was three equal cards — billed, collected, outstanding — and the one
 * the landlord opens the screen for was the same size as the other two. Now
 * the outstanding figure leads, filled by state, and billed / collected sit in
 * the bar under it: they are the two ends of the same progress, not separate
 * facts.
 */
export function RevenuePanel({ revenue }: { revenue: DashboardRevenue }) {
  const { counts } = revenue;
  const { t } = useTranslation();

  const invoiceCount = counts.unpaid + counts.paid;
  const invoices =
    counts.cancelled > 0
      ? t("dashboard.invoicesWithCancelled", { count: invoiceCount, cancelled: counts.cancelled })
      : t("dashboard.invoices", { count: invoiceCount });

  if (revenue.billed === 0) {
    return (
      <StatusPanel tone="neutral" label={t("dashboard.nothingBilled")} value={money(0)} hint={invoices} />
    );
  }

  const owed = revenue.outstanding > 0;
  const ratio = Math.min(100, (revenue.collected / revenue.billed) * 100);

  return (
    <StatusPanel
      tone={owed ? "owed" : "settled"}
      label={owed ? t("dashboard.toCollect") : t("dashboard.allCollected")}
      value={money(revenue.outstanding)}
      hint={owed ? t("dashboard.unpaidCount", { count: counts.unpaid }) : invoices}
    >
      <Stack gap={6} maw={560}>
        <Progress.Root size={10} radius="xl" style={{ backgroundColor: "var(--fmh-owed-edge)" }}>
          <Progress.Section value={ratio} color="settled" />
        </Progress.Root>
        <Group justify="space-between" gap="xs" wrap="wrap">
          <Text size="sm" c="settled" fw={500}>
            {t("dashboard.collectedOfBilled", {
              collected: money(revenue.collected),
              billed: money(revenue.billed),
            })}
          </Text>
          {owed && (
            <Text size="sm" c="dimmed">
              {invoices}
            </Text>
          )}
        </Group>
      </Stack>
    </StatusPanel>
  );
}
