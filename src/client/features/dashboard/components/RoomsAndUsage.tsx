import { SimpleGrid } from "@mantine/core";
import { IconBolt, IconDroplet, IconHome, IconNotebook } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import type { DashboardRooms, DashboardUsage } from "../../../../shared/types";
import { isEnglish } from "../../../i18n";
import { StatCard } from "./StatCard";

export function RoomsAndUsage({
  period,
  rooms,
  usage,
}: {
  period: string;
  rooms: DashboardRooms;
  usage: DashboardUsage;
}) {
  const { t } = useTranslation();
  const formatNumber = (value: number) => value.toLocaleString(isEnglish() ? "en-US" : "vi-VN");

  /** Signed percentage change, or the "no earlier period" note when there is
   *  nothing to compare against. */
  const changeLabel = (now: number, before: number): string => {
    if (before === 0) return t("dashboard.noPrevious");
    const percent = Math.round(((now - before) / before) * 100);
    return t("dashboard.changeVsPrevious", {
      percent: `${percent >= 0 ? "+" : ""}${percent}`,
    });
  };

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      <StatCard
        label={t("dashboard.occupied")}
        icon={<IconHome size={16} stroke={1.8} />}
        value={`${rooms.occupied}/${rooms.total}`}
        hint={t("dashboard.occupiedHint", {
          vacant: rooms.vacant,
          occupants: rooms.occupants,
        })}
      />
      <StatCard
        label={t("dashboard.missingReadings")}
        icon={<IconNotebook size={16} stroke={1.8} />}
        value={rooms.missing_readings}
        hint={
          rooms.missing_readings > 0
            ? t("dashboard.cannotGenerate")
            : t("dashboard.allRecorded")
        }
        color={rooms.missing_readings > 0 ? "owed" : "settled"}
        to={`/readings?period=${period}`}
      />
      <StatCard
        label={t("meter.electricityUsed")}
        icon={<IconBolt size={16} stroke={1.8} />}
        value={`${formatNumber(usage.electricity)} kWh`}
        hint={changeLabel(usage.electricity, usage.electricity_previous)}
      />
      <StatCard
        label={t("meter.waterUsed")}
        icon={<IconDroplet size={16} stroke={1.8} />}
        value={`${formatNumber(usage.water)} m³`}
        hint={changeLabel(usage.water, usage.water_previous)}
      />
    </SimpleGrid>
  );
}
