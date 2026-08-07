import { Badge, Button, Group, Table } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { ReadingDetail, RoomDetail } from "../../../../shared/types";
import { ngay } from "../../../format";

export function ReadingsTable({
  phong,
  chiSoCuaPhong,
  onEdit,
  onDelete,
}: {
  phong: RoomDetail[];
  chiSoCuaPhong: (roomId: number) => ReadingDetail | null;
  onEdit: (room: RoomDetail, reading: ReadingDetail | null) => void;
  onDelete: (reading: ReadingDetail) => void;
}) {
  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("dashboard.colRoom")}</Table.Th>
            <Table.Th>{t("readings.colElectricity")}</Table.Th>
            <Table.Th>{t("readings.colElectricityUsed")}</Table.Th>
            <Table.Th>{t("readings.colWater")}</Table.Th>
            <Table.Th>{t("readings.colWaterUsed")}</Table.Th>
            <Table.Th>{t("readings.colRecordedOn")}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {phong.map((room) => {
            const reading = chiSoCuaPhong(room.id);

            return (
              <Table.Tr key={room.id}>
                <Table.Td fw={500}>{room.room_name}</Table.Td>
                <Table.Td>
                  {reading ? (
                    `${reading.electricity_start} → ${reading.electricity_end}`
                  ) : (
                    <Badge color="gray" variant="light">
                      {t("readings.notEntered")}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>{reading ? `${reading.electricity_used} kWh` : t("common.empty")}</Table.Td>
                <Table.Td>{reading ? `${reading.water_start} → ${reading.water_end}` : t("common.empty")}</Table.Td>
                <Table.Td>{reading ? `${reading.water_used} m³` : t("common.empty")}</Table.Td>
                <Table.Td>{reading ? ngay(reading.recorded_on) : t("common.empty")}</Table.Td>
                <Table.Td>
                  <Group justify="flex-end" gap="xs" wrap="nowrap">
                    <Button size="xs" variant="light" onClick={() => onEdit(room, reading)}>
                      {reading ? t("common.edit") : t("readings.enter")}
                    </Button>
                    {reading && (
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => onDelete(reading)}
                      >
                        {t("common.delete")}
                      </Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
