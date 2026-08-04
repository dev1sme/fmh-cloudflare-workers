import { Badge, Button, Group, Modal, NumberInput, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useEffect, useState } from "react";

import type { ReadingDetail, RoomDetail } from "../../../shared/types";
import { readings as readingsApi, rooms as roomsApi } from "../../api";
import { KyPicker } from "../../components/KyPicker";
import { PageState } from "../../components/PageState";
import { baoLoi, baoThanhCong } from "../../errors";
import { homNay, kyHienTai, ngay } from "../../format";
import { useResource } from "../../hooks/useResource";

type Target = { room: RoomDetail; reading: ReadingDetail | null };

export function ReadingsPage() {
  const [ky, setKy] = useState(kyHienTai());
  const rooms = useResource(() => roomsApi.list(), []);
  const readings = useResource(() => readingsApi.list({ ky }), [ky]);
  const [target, setTarget] = useState<Target | null>(null);

  const byRoom = new Map(readings.data?.readings.map((r) => [r.room_id, r]));

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Chỉ số điện nước</Title>
        <KyPicker value={ky} onChange={setKy} />
      </Group>

      <PageState
        loading={rooms.loading || readings.loading}
        error={rooms.error ?? readings.error}
      >
        <Table.ScrollContainer minWidth={760}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Phòng</Table.Th>
                <Table.Th>Điện (cũ → mới)</Table.Th>
                <Table.Th>Số điện</Table.Th>
                <Table.Th>Nước (cũ → mới)</Table.Th>
                <Table.Th>Số nước</Table.Th>
                <Table.Th>Ngày ghi</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rooms.data?.rooms.map((room) => {
                const reading = byRoom.get(room.id) ?? null;

                return (
                  <Table.Tr key={room.id}>
                    <Table.Td fw={500}>{room.ten_phong}</Table.Td>
                    <Table.Td>
                      {reading ? `${reading.dien_cu} → ${reading.dien_moi}` : <Badge color="gray" variant="light">Chưa nhập</Badge>}
                    </Table.Td>
                    <Table.Td>{reading ? `${reading.so_dien} kWh` : "—"}</Table.Td>
                    <Table.Td>{reading ? `${reading.nuoc_cu} → ${reading.nuoc_moi}` : "—"}</Table.Td>
                    <Table.Td>{reading ? `${reading.so_nuoc} m³` : "—"}</Table.Td>
                    <Table.Td>{reading ? ngay(reading.ngay_ghi) : "—"}</Table.Td>
                    <Table.Td>
                      <Group justify="flex-end" gap="xs" wrap="nowrap">
                        <Button size="xs" variant="light" onClick={() => setTarget({ room, reading })}>
                          {reading ? "Sửa" : "Nhập"}
                        </Button>
                        {reading && (
                          <Button
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={() => xoa(reading, readings.reload)}
                          >
                            Xoá
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
      </PageState>

      <ReadingModal
        ky={ky}
        target={target}
        onClose={() => setTarget(null)}
        onSaved={() => {
          setTarget(null);
          readings.reload();
        }}
      />
    </Stack>
  );
}

async function xoa(reading: ReadingDetail, reload: () => void) {
  if (!confirm(`Xoá chỉ số ${reading.ten_phong} kỳ ${reading.ky}?`)) return;

  try {
    await readingsApi.remove(reading.id);
    baoThanhCong("Đã xoá chỉ số.");
    reload();
  } catch (err) {
    baoLoi(err);
  }
}

function ReadingModal({
  ky,
  target,
  onClose,
  onSaved,
}: {
  ky: string;
  target: Target | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dienCu, setDienCu] = useState<number | string>(0);
  const [dienMoi, setDienMoi] = useState<number | string>(0);
  const [nuocCu, setNuocCu] = useState<number | string>(0);
  const [nuocMoi, setNuocMoi] = useState<number | string>(0);
  const [ngayGhi, setNgayGhi] = useState(homNay());
  const [goiY, setGoiY] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /**
   * Editing shows the stored numbers; a new entry pulls the opening numbers
   * from the previous period so the manager only types the two new readings.
   */
  useEffect(() => {
    if (!target) return;

    if (target.reading) {
      setDienCu(target.reading.dien_cu);
      setDienMoi(target.reading.dien_moi);
      setNuocCu(target.reading.nuoc_cu);
      setNuocMoi(target.reading.nuoc_moi);
      setNgayGhi(target.reading.ngay_ghi);
      setGoiY(null);
      return;
    }

    setDienMoi(0);
    setNuocMoi(0);
    setNgayGhi(homNay());

    readingsApi
      .suggest(target.room.id, ky)
      .then((suggestion) => {
        setDienCu(suggestion.dien_cu);
        setNuocCu(suggestion.nuoc_cu);
        setGoiY(
          suggestion.ky_truoc
            ? `Chỉ số đầu kỳ lấy từ kỳ ${suggestion.ky_truoc}.`
            : "Chưa có kỳ trước, chỉ số đầu kỳ mặc định 0.",
        );
      })
      .catch(baoLoi);
  }, [target, ky]);

  async function save() {
    if (!target) return;
    setBusy(true);

    const payload = {
      dien_cu: Number(dienCu),
      dien_moi: Number(dienMoi),
      nuoc_cu: Number(nuocCu),
      nuoc_moi: Number(nuocMoi),
      ngay_ghi: ngayGhi,
    };

    try {
      if (target.reading) {
        await readingsApi.update(target.reading.id, payload);
      } else {
        await readingsApi.create({ room_id: target.room.id, ky, ...payload });
      }
      baoThanhCong("Đã lưu chỉ số.");
      onSaved();
    } catch (err) {
      baoLoi(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      opened={target !== null}
      onClose={onClose}
      title={`Chỉ số ${target?.room.ten_phong ?? ""} — kỳ ${ky}`}
    >
      <Stack>
        {goiY && (
          <Text size="sm" c="dimmed">
            {goiY}
          </Text>
        )}

        <Group grow>
          <NumberInput label="Điện cũ" value={dienCu} onChange={setDienCu} min={0} />
          <NumberInput label="Điện mới" value={dienMoi} onChange={setDienMoi} min={0} />
        </Group>
        <Group grow>
          <NumberInput label="Nước cũ" value={nuocCu} onChange={setNuocCu} min={0} />
          <NumberInput label="Nước mới" value={nuocMoi} onChange={setNuocMoi} min={0} />
        </Group>
        <TextInput
          type="date"
          label="Ngày ghi"
          value={ngayGhi}
          onChange={(e) => setNgayGhi(e.currentTarget.value)}
        />

        <Text size="sm">
          Tiêu thụ: <b>{Math.max(0, Number(dienMoi) - Number(dienCu))} kWh</b> điện,{" "}
          <b>{Math.max(0, Number(nuocMoi) - Number(nuocCu))} m³</b> nước.
        </Text>

        <Button onClick={save} loading={busy}>
          Lưu
        </Button>
      </Stack>
    </Modal>
  );
}
