import { Button, Group, Menu } from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
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
  size = "xs",
  onEdit,
  onMoveIn,
  onMoveOut,
  onDelete,
}: {
  room: RoomDetail;
  /** `xs` in a table row under a mouse; `sm` on a card, which is a finger on a phone. */
  size?: "xs" | "sm";
  onEdit: (room: RoomDetail) => void;
  onMoveIn: (room: RoomDetail) => void;
  onMoveOut: (room: RoomDetail) => void;
  onDelete: (room: RoomDetail) => void;
}) {
  const { t } = useTranslation();

  return (
    <Group gap="xs" justify="flex-end" wrap="nowrap">
      <Button size={size} variant="light" onClick={() => onEdit(room)}>
        {t("common.edit")}
      </Button>

      {room.tenant ? (
        <Button size={size} variant="subtle" color="red" onClick={() => onMoveOut(room)}>
          {t("rooms.moveOut")}
        </Button>
      ) : (
        <Button size={size} variant="subtle" onClick={() => onMoveIn(room)}>
          {t("rooms.moveIn")}
        </Button>
      )}

      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <Button size={size} variant="subtle" color="gray" aria-label={t("common.more")}>
            <IconDots size={16} stroke={1.8} />
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
