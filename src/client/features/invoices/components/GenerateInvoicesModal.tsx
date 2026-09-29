import { Alert, Badge, Button, Checkbox, Group, Modal, Stack, Table, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PreviewRoom, GenerationStatus } from "../../../../shared/types";
import { PageState } from "../../../components/PageState";
import { periodLabel, money } from "../../../format";

/** Null is the billable case — anything else is the key for the reason the
 *  row is locked. */
const LOCK_REASON = {
  READY: null,
  MISSING_READING: "invoices.statusMissingReading",
  ALREADY_INVOICED: "invoices.statusAlreadyInvoiced",
} as const satisfies Record<GenerationStatus, string | null>;

/**
 * The room picker generation runs through. Rooms that cannot be billed are
 * listed but locked, so the manager sees *why* a room is missing instead of it
 * silently turning up in the skipped list afterwards.
 */
export function GenerateInvoicesModal({
  period,
  opened,
  rooms,
  loading,
  error,
  onRetry,
  busy,
  onClose,
  onSubmit,
}: {
  period: string;
  opened: boolean;
  rooms: PreviewRoom[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  busy: boolean;
  onClose: () => void;
  onSubmit: (roomIds: number[]) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const { t } = useTranslation();

  const ready = useMemo(
    () => rooms.filter((item) => item.status === "READY"),
    [rooms],
  );

  // Everything billable starts ticked — the common run is "all of them", and
  // unticking one room is less work than ticking eight.
  useEffect(() => {
    setSelected(ready.map((item) => item.room_id));
  }, [ready]);

  const byBuilding = useMemo(() => {
    const map = new Map<number, { name: string; rooms: PreviewRoom[] }>();

    for (const item of rooms) {
      const group = map.get(item.building_id) ?? { name: item.building_name, rooms: [] };
      group.rooms.push(item);
      map.set(item.building_id, group);
    }

    return [...map.values()];
  }, [rooms]);

  const selectedTotal = rooms
    .filter((item) => selected.includes(item.room_id))
    .reduce((sum, item) => sum + (item.estimate?.total ?? 0), 0);

  function toggle(roomId: number, tick: boolean) {
    setSelected((prev) => (tick ? [...prev, roomId] : prev.filter((id) => id !== roomId)));
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("invoices.generateTitle", { period: periodLabel(period) })}
      size="lg"
    >
      <PageState loading={loading} error={error} onRetry={onRetry}>
        {rooms.length === 0 ? (
          <Text c="dimmed">{t("invoices.noRooms")}</Text>
        ) : (
          <Stack>
            {ready.length === 0 && (
              <Alert
                color="gray"
                icon={<IconAlertTriangle size={18} stroke={1.8} />}
                title={t("invoices.noneReadyTitle")}
              >
                {t("invoices.noneReadyBody")}
              </Alert>
            )}

            <Checkbox
              label={t("invoices.selectAll", { count: ready.length })}
              disabled={ready.length === 0}
              checked={ready.length > 0 && selected.length === ready.length}
              indeterminate={selected.length > 0 && selected.length < ready.length}
              onChange={(event) =>
                setSelected(event.currentTarget.checked ? ready.map((item) => item.room_id) : [])
              }
            />

            <Table.ScrollContainer minWidth={520}>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={40} />
                    <Table.Th>{t("dashboard.colRoom")}</Table.Th>
                    <Table.Th>{t("invoices.colUsage")}</Table.Th>
                    <Table.Th ta="right">{t("invoices.colEstimate")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                {byBuilding.map((group) => (
                  <Table.Tbody key={group.name}>
                    <Table.Tr>
                      <Table.Td colSpan={4} fw={600} bg="var(--mantine-color-default-hover)">
                        {group.name}
                      </Table.Td>
                    </Table.Tr>

                    {group.rooms.map((item) => (
                      <RoomRow
                        key={item.room_id}
                        item={item}
                        checked={selected.includes(item.room_id)}
                        onChange={(tick) => toggle(item.room_id, tick)}
                      />
                    ))}
                  </Table.Tbody>
                ))}
              </Table>
            </Table.ScrollContainer>

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {t("invoices.selectedSummary", {
                  count: selected.length,
                  amount: money(selectedTotal),
                })}
              </Text>
              <Button
                onClick={() => onSubmit(selected)}
                loading={busy}
                disabled={selected.length === 0}
              >
                {t("invoices.generateN", { count: selected.length })}
              </Button>
            </Group>
          </Stack>
        )}
      </PageState>
    </Modal>
  );
}

function RoomRow({
  item,
  checked,
  onChange,
}: {
  item: PreviewRoom;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation();
  const lockReason = LOCK_REASON[item.status];

  return (
    <Table.Tr opacity={lockReason ? 0.6 : 1}>
      <Table.Td>
        <Checkbox
          checked={checked}
          disabled={lockReason !== null}
          aria-label={t("invoices.selectRoom", { room: item.room_name })}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
      </Table.Td>
      <Table.Td fw={500}>
        <Group gap="xs" wrap="nowrap">
          {item.room_name}
          {lockReason && (
            <Badge size="sm" variant="light" color="gray">
              {t(lockReason)}
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td c="dimmed">
        {item.estimate
          ? `${item.estimate.electricity_used} kWh · ${item.estimate.water_used} m³`
          : t("common.empty")}
      </Table.Td>
      <Table.Td ta="right" fw={600}>
        {item.estimate ? money(item.estimate.total) : t("common.empty")}
      </Table.Td>
    </Table.Tr>
  );
}
