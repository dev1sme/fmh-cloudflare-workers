import { Table, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { RoomDetail } from "../../../../shared/types";
import { ngay, tien } from "../../../format";
import { RoomActions } from "./RoomActions";

export function RoomsTable({
  phong,
  onEdit,
  onMoveIn,
  onMoveOut,
  onDelete,
}: {
  phong: RoomDetail[];
  onEdit: (room: RoomDetail) => void;
  onMoveIn: (room: RoomDetail) => void;
  onMoveOut: (room: RoomDetail) => void;
  onDelete: (room: RoomDetail) => void;
}) {
  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={720}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("dashboard.colRoom")}</Table.Th>
            <Table.Th>{t("rooms.colRent")}</Table.Th>
            <Table.Th>{t("rooms.colArea")}</Table.Th>
            <Table.Th>{t("rooms.colTenant")}</Table.Th>
            <Table.Th>{t("rooms.colFrom")}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {phong.map((room) => (
            <Table.Tr key={room.id}>
              <Table.Td>
                <Text fw={500}>{room.room_name}</Text>
                <Text size="xs" c="dimmed">
                  {room.building_name}
                </Text>
              </Table.Td>
              <Table.Td>{tien(room.rent)}</Table.Td>
              <Table.Td>{room.area ? `${room.area} m²` : t("common.empty")}</Table.Td>
              <Table.Td>
                {room.tenant ? (
                  <>
                    <Text>{room.tenant.full_name}</Text>
                    <Text size="xs" c="dimmed">
                      {t("rooms.occupantsLine", {
                        count: room.tenant.occupants,
                        phone: room.tenant.phone ?? t("rooms.noPhone"),
                      })}
                    </Text>
                  </>
                ) : (
                  <Text c="dimmed">{t("rooms.vacant")}</Text>
                )}
              </Table.Td>
              <Table.Td>
                {room.tenant ? ngay(room.tenant.moved_in) : t("common.empty")}
              </Table.Td>
              <Table.Td>
                <RoomActions
                  room={room}
                  onEdit={onEdit}
                  onMoveIn={onMoveIn}
                  onMoveOut={onMoveOut}
                  onDelete={onDelete}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
