import { Button, Group, Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { RoomDetail } from "../../../../shared/types";

/**
 * The buttons on one room, shared by `RoomsTable` and `RoomCards`.
 *
 * Extracted rather than written twice: the move-in / move-out choice depends on
 * whether the room has a tenant, and two copies of that condition would drift
 * the first time one of them gains a case.
 */
export function RoomActions({
  room,
  onEdit,
  onMoveIn,
  onMoveOut,
  onDelete,
}: {
  room: RoomDetail;
  onEdit: (room: RoomDetail) => void;
  onMoveIn: (room: RoomDetail) => void;
  onMoveOut: (room: RoomDetail) => void;
  onDelete: (room: RoomDetail) => void;
}) {
  const { t } = useTranslation();

  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap">
      <Button size="xs" variant="light" onClick={() => onEdit(room)}>
        {t("common.edit")}
      </Button>

      {room.tenant ? (
        <Button size="xs" variant="subtle" color="orange" onClick={() => onMoveOut(room)}>
          {t("rooms.moveOut")}
        </Button>
      ) : (
        <Button size="xs" variant="subtle" onClick={() => onMoveIn(room)}>
          {t("rooms.moveIn")}
        </Button>
      )}

      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <Button size="xs" variant="subtle" color="gray" aria-label={t("common.more")}>
            ⋯
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item color="red" onClick={() => onDelete(room)}>
            {t("rooms.delete")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
