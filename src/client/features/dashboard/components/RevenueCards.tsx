import { SimpleGrid } from "@mantine/core";

import type { DashboardRevenue } from "../../../../shared/types";
import { tien } from "../../../format";
import { StatCard } from "./StatCard";

/** Money for the selected period. Cancelled invoices are already excluded. */
export function RevenueCards({ revenue }: { revenue: DashboardRevenue }) {
  const { counts } = revenue;

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }}>
      <StatCard
        label="Phải thu"
        value={tien(revenue.billed)}
        hint={`${counts.unpaid + counts.paid} hóa đơn${
          counts.cancelled > 0 ? ` · ${counts.cancelled} đã huỷ` : ""
        }`}
      />
      <StatCard
        label="Đã thu"
        value={tien(revenue.collected)}
        hint={`${counts.paid} hóa đơn đã thanh toán`}
        color="teal"
      />
      <StatCard
        label="Còn nợ"
        value={tien(revenue.outstanding)}
        hint={`${counts.unpaid} hóa đơn chưa thanh toán`}
        color={revenue.outstanding > 0 ? "orange" : undefined}
      />
    </SimpleGrid>
  );
}
