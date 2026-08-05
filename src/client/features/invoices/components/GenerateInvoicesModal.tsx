import { Alert, Badge, Button, Checkbox, Group, Modal, Stack, Table, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

import type { PreviewRoom, GenerationStatus } from "../../../../shared/types";
import { PageState } from "../../../components/PageState";
import { periodLabel, tien } from "../../../format";

/** Null is the billable case — anything else is the reason the row is locked. */
const KHONG_SINH_DUOC: Record<GenerationStatus, string | null> = {
  READY: null,
  MISSING_READING: "Chưa nhập chỉ số",
  ALREADY_INVOICED: "Đã có hóa đơn",
};

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
  dangChay,
  onClose,
  onSubmit,
}: {
  period: string;
  opened: boolean;
  rooms: PreviewRoom[];
  loading: boolean;
  error: unknown;
  dangChay: boolean;
  onClose: () => void;
  onSubmit: (roomIds: number[]) => void;
}) {
  const [chon, setChon] = useState<number[]>([]);

  const sanSang = useMemo(
    () => rooms.filter((item) => item.status === "READY"),
    [rooms],
  );

  // Everything billable starts ticked — the common run is "all of them", and
  // unticking one room is less work than ticking eight.
  useEffect(() => {
    setChon(sanSang.map((item) => item.room_id));
  }, [sanSang]);

  const nhomTheoToa = useMemo(() => {
    const map = new Map<number, { ten: string; rooms: PreviewRoom[] }>();

    for (const item of rooms) {
      const nhom = map.get(item.building_id) ?? { ten: item.building_name, rooms: [] };
      nhom.rooms.push(item);
      map.set(item.building_id, nhom);
    }

    return [...map.values()];
  }, [rooms]);

  const tongChon = rooms
    .filter((item) => chon.includes(item.room_id))
    .reduce((sum, item) => sum + (item.estimate?.total ?? 0), 0);

  function doi(roomId: number, tick: boolean) {
    setChon((truoc) => (tick ? [...truoc, roomId] : truoc.filter((id) => id !== roomId)));
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Sinh hóa đơn — ${periodLabel(period).toLowerCase()}`}
      size="lg"
    >
      <PageState loading={loading} error={error}>
        {rooms.length === 0 ? (
          <Text c="dimmed">Chưa có phòng nào.</Text>
        ) : (
          <Stack>
            {sanSang.length === 0 && (
              <Alert color="yellow" title="Không có phòng nào sinh được">
                Kỳ này đã sinh xong, hoặc các phòng còn lại chưa nhập chỉ số.
              </Alert>
            )}

            <Checkbox
              label={`Chọn tất cả phòng sẵn sàng (${sanSang.length})`}
              disabled={sanSang.length === 0}
              checked={sanSang.length > 0 && chon.length === sanSang.length}
              indeterminate={chon.length > 0 && chon.length < sanSang.length}
              onChange={(event) =>
                setChon(event.currentTarget.checked ? sanSang.map((item) => item.room_id) : [])
              }
            />

            <Table.ScrollContainer minWidth={520}>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={40} />
                    <Table.Th>Phòng</Table.Th>
                    <Table.Th>Tiêu thụ</Table.Th>
                    <Table.Th ta="right">Tạm tính</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                {nhomTheoToa.map((nhom) => (
                  <Table.Tbody key={nhom.ten}>
                    <Table.Tr>
                      <Table.Td colSpan={4} fw={600} bg="var(--mantine-color-default-hover)">
                        {nhom.ten}
                      </Table.Td>
                    </Table.Tr>

                    {nhom.rooms.map((item) => (
                      <DongPhong
                        key={item.room_id}
                        item={item}
                        checked={chon.includes(item.room_id)}
                        onChange={(tick) => doi(item.room_id, tick)}
                      />
                    ))}
                  </Table.Tbody>
                ))}
              </Table>
            </Table.ScrollContainer>

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Đã chọn {chon.length} phòng — {tien(tongChon)}
              </Text>
              <Button
                onClick={() => onSubmit(chon)}
                loading={dangChay}
                disabled={chon.length === 0}
              >
                Sinh {chon.length} hóa đơn
              </Button>
            </Group>
          </Stack>
        )}
      </PageState>
    </Modal>
  );
}

function DongPhong({
  item,
  checked,
  onChange,
}: {
  item: PreviewRoom;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const lyDo = KHONG_SINH_DUOC[item.status];

  return (
    <Table.Tr opacity={lyDo ? 0.6 : 1}>
      <Table.Td>
        <Checkbox
          checked={checked}
          disabled={lyDo !== null}
          aria-label={`Chọn ${item.room_name}`}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
      </Table.Td>
      <Table.Td fw={500}>
        <Group gap="xs" wrap="nowrap">
          {item.room_name}
          {lyDo && (
            <Badge size="sm" variant="light" color="gray">
              {lyDo}
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td c="dimmed">
        {item.estimate
          ? `${item.estimate.electricity_used} kWh · ${item.estimate.water_used} m³`
          : "—"}
      </Table.Td>
      <Table.Td ta="right" fw={600}>
        {item.estimate ? tien(item.estimate.total) : "—"}
      </Table.Td>
    </Table.Tr>
  );
}
