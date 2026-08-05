import { SimpleGrid } from "@mantine/core";

import type { DashboardRooms, DashboardUsage } from "../../../../shared/types";
import { StatCard } from "./StatCard";

const SO = new Intl.NumberFormat("vi-VN");

/** Signed percentage change, or null when there is no earlier figure to compare. */
function chenhLech(now: number, before: number): string | null {
  if (before === 0) return null;
  const percent = Math.round(((now - before) / before) * 100);
  return `${percent >= 0 ? "+" : ""}${percent}% so với kỳ trước`;
}

export function RoomsAndUsage({
  rooms,
  usage,
}: {
  rooms: DashboardRooms;
  usage: DashboardUsage;
}) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      <StatCard
        label="Phòng đang thuê"
        value={`${rooms.occupied}/${rooms.total}`}
        hint={`${rooms.vacant} phòng trống · ${rooms.occupants} người ở`}
      />
      <StatCard
        label="Chưa nhập chỉ số"
        value={rooms.missing_readings}
        hint={rooms.missing_readings > 0 ? "Chưa sinh được hóa đơn" : "Đã nhập đủ kỳ này"}
        color={rooms.missing_readings > 0 ? "orange" : "teal"}
      />
      <StatCard
        label="Điện tiêu thụ"
        value={`${SO.format(usage.electricity)} kWh`}
        hint={chenhLech(usage.electricity, usage.electricity_previous) ?? "Chưa có kỳ trước"}
      />
      <StatCard
        label="Nước tiêu thụ"
        value={`${SO.format(usage.water)} m³`}
        hint={chenhLech(usage.water, usage.water_previous) ?? "Chưa có kỳ trước"}
      />
    </SimpleGrid>
  );
}
