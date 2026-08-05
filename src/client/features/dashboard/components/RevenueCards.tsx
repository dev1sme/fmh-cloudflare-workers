import { SimpleGrid } from "@mantine/core";
import { IconCash, IconCoin, IconAlertTriangle } from "@tabler/icons-react";

import type { DashboardRevenue } from "../../../../shared/types";
import { tien } from "../../../format";
import { StatCard } from "./StatCard";

/** Money for the selected period. Cancelled invoices are already excluded. */
export function RevenueCards({ revenue }: { revenue: DashboardRevenue }) {
  const { counts } = revenue;

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, lg: 3 }}>
      <StatCard
        label="Phải thu"
        icon={<IconCoin size={16} stroke={1.8} />}
        value={tien(revenue.billed)}
        hint={`${counts.unpaid + counts.paid} hóa đơn${
          counts.cancelled > 0 ? ` · ${counts.cancelled} đã huỷ` : ""
        }`}
      />
      <StatCard
        label="Đã thu"
        icon={<IconCash size={16} stroke={1.8} />}
        value={tien(revenue.collected)}
        hint={`${counts.paid} hóa đơn đã thanh toán`}
        color="settled"
      />
      <StatCard
        label="Còn nợ"
        icon={<IconAlertTriangle size={16} stroke={1.8} />}
        value={tien(revenue.outstanding)}
        hint={`${counts.unpaid} hóa đơn chưa thanh toán`}
        color={revenue.outstanding > 0 ? "owed" : undefined}
      />
    </SimpleGrid>
  );
}
