import { SimpleGrid } from "@mantine/core";
import { IconCash, IconCoin, IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import type { DashboardRevenue } from "../../../../shared/types";
import { tien } from "../../../format";
import { StatCard } from "./StatCard";

/** Money for the selected period. Cancelled invoices are already excluded. */
export function RevenueCards({ revenue }: { revenue: DashboardRevenue }) {
  const { counts } = revenue;
  const { t } = useTranslation();

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, lg: 3 }}>
      <StatCard
        label={t("dashboard.billed")}
        icon={<IconCoin size={16} stroke={1.8} />}
        value={tien(revenue.billed)}
        hint={
          counts.cancelled > 0
            ? t("dashboard.invoicesWithCancelled", {
                count: counts.unpaid + counts.paid,
                cancelled: counts.cancelled,
              })
            : t("dashboard.invoices", { count: counts.unpaid + counts.paid })
        }
      />
      <StatCard
        label={t("dashboard.collected")}
        icon={<IconCash size={16} stroke={1.8} />}
        value={tien(revenue.collected)}
        hint={t("dashboard.paidCount", { count: counts.paid })}
        color="settled"
      />
      <StatCard
        label={t("dashboard.outstanding")}
        icon={<IconAlertTriangle size={16} stroke={1.8} />}
        value={tien(revenue.outstanding)}
        hint={t("dashboard.unpaidCount", { count: counts.unpaid })}
        color={revenue.outstanding > 0 ? "owed" : undefined}
      />
    </SimpleGrid>
  );
}
