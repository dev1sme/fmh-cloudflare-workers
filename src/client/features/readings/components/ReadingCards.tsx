import { Badge, Card, Group, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { ReadingDetail, RoomDetail } from "../../../../shared/types";
import { CardField } from "../../../components/CardField";
import { ngay } from "../../../format";
import { ReadingActions } from "./ReadingActions";

/**
 * The meter list on a phone.
 *
 * Seven columns at `minWidth={760}`: on a phone the room name scrolls away and
 * what is left is four pairs of bare numbers with nothing saying which meter
 * they belong to.
 *
 * A room with no reading yet collapses to the badge and the "Nhập" button
 * instead of four `—` rows. This is the screen the manager opens once a month
 * standing in front of the meters, so the rooms still to do have to be
 * countable at a glance.
 */
export function ReadingCards({
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
    <Stack gap="xs">
      {phong.map((room) => {
        const reading = chiSoCuaPhong(room.id);

        return (
          <Card key={room.id} padding="md">
            <Stack gap="xs">
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Text fw={700}>{room.room_name}</Text>
                {!reading && (
                  <Badge color="gray" variant="light">
                    {t("readings.notEntered")}
                  </Badge>
                )}
              </Group>

              {reading && (
                <>
                  <CardField label={t("readings.colElectricity")}>
                    <span className="fmh-num">
                      {reading.electricity_start} → {reading.electricity_end}
                    </span>
                    <Text size="xs" c="dimmed">
                      {`${reading.electricity_used} kWh`}
                    </Text>
                  </CardField>

                  <CardField label={t("readings.colWater")}>
                    <span className="fmh-num">
                      {reading.water_start} → {reading.water_end}
                    </span>
                    <Text size="xs" c="dimmed">
                      {`${reading.water_used} m³`}
                    </Text>
                  </CardField>

                  <CardField label={t("readings.colRecordedOn")}>
                    {ngay(reading.recorded_on)}
                  </CardField>
                </>
              )}

              <ReadingActions
                room={room}
                reading={reading}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
