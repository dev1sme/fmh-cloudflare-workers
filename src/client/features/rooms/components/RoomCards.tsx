import { Card, Group, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { RoomDetail } from "../../../../shared/types";
import { CardField } from "../../../components/CardField";
import { formatDate, money } from "../../../format";
import { RoomActions } from "./RoomActions";

/**
 * The rooms list on a phone.
 *
 * `RoomsTable` sets `minWidth={720}`, so on a 390 px screen it is a sideways
 * scroll — and the first thing to leave the viewport is the room name, which is
 * the one column that identifies the row. Same facts, one card each.
 *
 * The rent leads because it is what the manager is usually checking, and it
 * keeps `.fmh-num` so the figures still line up down the stack.
 */
export function RoomCards({
  rooms,
  onEdit,
  onMoveIn,
  onMoveOut,
  onDelete,
}: {
  rooms: RoomDetail[];
  onEdit: (room: RoomDetail) => void;
  onMoveIn: (room: RoomDetail) => void;
  onMoveOut: (room: RoomDetail) => void;
  onDelete: (room: RoomDetail) => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack gap="xs">
      {rooms.map((room) => (
        <Card key={room.id} padding="md">
          <Stack gap="xs">
            <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start">
              <div style={{ minWidth: 0 }}>
                <Text fw={700}>{room.room_name}</Text>
                <Text size="xs" c="dimmed">
                  {room.building_name}
                </Text>
              </div>
              <Text fw={700} className="fmh-num">
                {money(room.rent)}
              </Text>
            </Group>

            <CardField label={t("rooms.colTenant")}>
              {room.tenant ? (
                <>
                  {room.tenant.full_name}
                  <Text size="xs" c="dimmed">
                    {t("rooms.occupantsLine", {
                      count: room.tenant.occupants,
                      phone: room.tenant.phone ?? t("rooms.noPhone"),
                    })}
                  </Text>
                </>
              ) : (
                <Text size="sm" c="dimmed">
                  {t("rooms.vacant")}
                </Text>
              )}
            </CardField>

            {/* Only shown once there is a tenancy — "Từ ngày —" is noise. */}
            {room.tenant && (
              <CardField label={t("rooms.colFrom")}>{formatDate(room.tenant.moved_in)}</CardField>
            )}

            {room.area !== null && (
              <CardField label={t("rooms.colArea")}>{`${room.area} m²`}</CardField>
            )}

            <RoomActions
              room={room}
              onEdit={onEdit}
              onMoveIn={onMoveIn}
              onMoveOut={onMoveOut}
              onDelete={onDelete}
            />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
