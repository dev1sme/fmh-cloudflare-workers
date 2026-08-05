import { SimpleGrid } from "@mantine/core";
import { IconBolt, IconDroplet, IconHome, IconNotebook } from "@tabler/icons-react";

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
        icon={<IconHome size={16} stroke={1.8} />}
        value={`${rooms.occupied}/${rooms.total}`}
        hint={`${rooms.vacant} phòng trống · ${rooms.occupants} người ở`}
      />
      <StatCard
        label="Chưa nhập chỉ số"
        icon={<IconNotebook size={16} stroke={1.8} />}
        value={rooms.missing_readings}
        hint={rooms.missing_readings > 0 ? "Chưa sinh được hóa đơn" : "Đã nhập đủ kỳ này"}
        color={rooms.missing_readings > 0 ? "owed" : "settled"}
      />
      <StatCard
        label="Điện tiêu thụ"
        icon={<IconBolt size={16} stroke={1.8} />}
        value={`${SO.format(usage.electricity)} kWh`}
        hint={chenhLech(usage.electricity, usage.electricity_previous) ?? "Chưa có kỳ trước"}
      />
      <StatCard
        label="Nước tiêu thụ"
        icon={<IconDroplet size={16} stroke={1.8} />}
        value={`${SO.format(usage.water)} m³`}
        hint={chenhLech(usage.water, usage.water_previous) ?? "Chưa có kỳ trước"}
      />
    </SimpleGrid>
  );
}
