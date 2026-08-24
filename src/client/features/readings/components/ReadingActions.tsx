import { Button, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { ReadingDetail, RoomDetail } from "../../../../shared/types";

/**
 * The buttons on one room's reading, shared by `ReadingsTable` and
 * `ReadingCards`.
 *
 * The label switches between "Nhập" and "Sửa" on whether a reading exists, and
 * delete only exists once one does — one place for both conditions.
 */
export function ReadingActions({
  room,
  reading,
  onEdit,
  onDelete,
}: {
  room: RoomDetail;
  reading: ReadingDetail | null;
  onEdit: (room: RoomDetail, reading: ReadingDetail | null) => void;
  onDelete: (reading: ReadingDetail) => void;
}) {
  const { t } = useTranslation();

  return (
    <Group justify="flex-end" gap="xs" wrap="nowrap">
      <Button size="xs" variant="light" onClick={() => onEdit(room, reading)}>
        {reading ? t("common.edit") : t("readings.enter")}
      </Button>

      {reading && (
        <Button size="xs" variant="subtle" color="red" onClick={() => onDelete(reading)}>
          {t("common.delete")}
        </Button>
      )}
    </Group>
  );
}
