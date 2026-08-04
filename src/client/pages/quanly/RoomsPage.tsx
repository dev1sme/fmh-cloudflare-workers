import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";

import type { RoomDetail } from "../../../shared/types";
import { rooms as roomsApi, tenants as tenantsApi } from "../../api";
import { PageState } from "../../components/PageState";
import { baoLoi, baoThanhCong } from "../../errors";
import { homNay, ngay, tien } from "../../format";
import { useResource } from "../../hooks/useResource";

export function RoomsPage() {
  const { data, loading, error, reload } = useResource(() => roomsApi.list());
  const [editing, setEditing] = useState<RoomDetail | null>(null);
  const [movingIn, setMovingIn] = useState<RoomDetail | null>(null);

  return (
    <Stack>
      <Title order={3}>Phòng</Title>

      <PageState loading={loading} error={error}>
        <Table.ScrollContainer minWidth={720}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Phòng</Table.Th>
                <Table.Th>Giá phòng</Table.Th>
                <Table.Th>Diện tích</Table.Th>
                <Table.Th>Người thuê</Table.Th>
                <Table.Th>Từ ngày</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data?.rooms.map((room) => (
                <Table.Tr key={room.id}>
                  <Table.Td>
                    <Text fw={500}>{room.ten_phong}</Text>
                    <Text size="xs" c="dimmed">
                      {room.building_name}
                    </Text>
                  </Table.Td>
                  <Table.Td>{tien(room.gia_phong)}</Table.Td>
                  <Table.Td>{room.dien_tich ? `${room.dien_tich} m²` : "—"}</Table.Td>
                  <Table.Td>
                    {room.tenant ? (
                      <>
                        <Text>{room.tenant.ho_ten}</Text>
                        <Text size="xs" c="dimmed">
                          {room.tenant.sdt ?? "chưa có số điện thoại"}
                        </Text>
                      </>
                    ) : (
                      <Text c="dimmed">Đang trống</Text>
                    )}
                  </Table.Td>
                  <Table.Td>{room.tenant ? ngay(room.tenant.ngay_vao) : "—"}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      <Button size="xs" variant="light" onClick={() => setEditing(room)}>
                        Sửa
                      </Button>
                      {room.tenant ? (
                        <Button
                          size="xs"
                          variant="subtle"
                          color="orange"
                          onClick={() => chuyenDi(room, reload)}
                        >
                          Chuyển đi
                        </Button>
                      ) : (
                        <Button size="xs" variant="subtle" onClick={() => setMovingIn(room)}>
                          Thêm người thuê
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </PageState>

      <EditRoomModal
        room={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
      <MoveInModal
        room={movingIn}
        onClose={() => setMovingIn(null)}
        onSaved={() => {
          setMovingIn(null);
          reload();
        }}
      />
    </Stack>
  );
}

async function chuyenDi(room: RoomDetail, reload: () => void) {
  if (!room.tenant) return;
  if (!confirm(`Xác nhận ${room.tenant.ho_ten} đã chuyển khỏi ${room.ten_phong}?`)) return;

  try {
    await tenantsApi.update(room.tenant.id, { ngay_ra: homNay() });
    baoThanhCong("Đã ghi nhận chuyển đi.");
    reload();
  } catch (err) {
    baoLoi(err);
  }
}

function EditRoomModal({
  room,
  onClose,
  onSaved,
}: {
  room: RoomDetail | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [giaPhong, setGiaPhong] = useState<number | string>(0);
  const [dienTich, setDienTich] = useState<number | string>("");
  const [tenPhong, setTenPhong] = useState("");
  const [busy, setBusy] = useState(false);

  // The modal stays mounted between openings; seed the fields each time a room
  // is selected.
  useEffect(() => {
    if (!room) return;
    setTenPhong(room.ten_phong);
    setGiaPhong(room.gia_phong);
    setDienTich(room.dien_tich ?? "");
  }, [room]);

  async function save() {
    if (!room) return;
    setBusy(true);

    try {
      await roomsApi.update(room.id, {
        ten_phong: tenPhong,
        gia_phong: Number(giaPhong),
        dien_tich: dienTich === "" ? null : Number(dienTich),
      });
      baoThanhCong("Đã lưu phòng.");
      onSaved();
    } catch (err) {
      baoLoi(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal opened={room !== null} onClose={onClose} title="Sửa phòng">
      <Stack>
        <TextInput
          label="Tên phòng"
          value={tenPhong}
          onChange={(e) => setTenPhong(e.currentTarget.value)}
        />
        <NumberInput
          label="Giá phòng (đ/tháng)"
          value={giaPhong}
          onChange={setGiaPhong}
          min={0}
          step={100000}
          thousandSeparator="."
          decimalSeparator=","
        />
        <NumberInput
          label="Diện tích (m²)"
          value={dienTich}
          onChange={setDienTich}
          min={0}
          allowDecimal
        />
        <Button onClick={save} loading={busy}>
          Lưu
        </Button>
      </Stack>
    </Modal>
  );
}

function MoveInModal({
  room,
  onClose,
  onSaved,
}: {
  room: RoomDetail | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [ngayVao, setNgayVao] = useState(homNay());
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!room) return;
    setBusy(true);

    try {
      await tenantsApi.create({
        room_id: room.id,
        ho_ten: hoTen,
        sdt: sdt || null,
        ngay_vao: ngayVao,
      });
      baoThanhCong("Đã thêm người thuê.");
      setHoTen("");
      setSdt("");
      onSaved();
    } catch (err) {
      baoLoi(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal opened={room !== null} onClose={onClose} title={`Thêm người thuê — ${room?.ten_phong}`}>
      <Stack>
        <TextInput
          label="Họ tên"
          value={hoTen}
          onChange={(e) => setHoTen(e.currentTarget.value)}
          required
        />
        <TextInput label="Số điện thoại" value={sdt} onChange={(e) => setSdt(e.currentTarget.value)} />
        <TextInput
          type="date"
          label="Ngày vào"
          value={ngayVao}
          onChange={(e) => setNgayVao(e.currentTarget.value)}
        />
        <Button onClick={save} loading={busy}>
          Lưu
        </Button>
      </Stack>
    </Modal>
  );
}
