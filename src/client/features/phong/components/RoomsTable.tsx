import { Button, Group, Table, Text } from "@mantine/core";

import type { RoomDetail } from "../../../../shared/types";
import { ngay, tien } from "../../../format";

export function RoomsTable({
  phong,
  onEdit,
  onMoveIn,
  onMoveOut,
}: {
  phong: RoomDetail[];
  onEdit: (room: RoomDetail) => void;
  onMoveIn: (room: RoomDetail) => void;
  onMoveOut: (room: RoomDetail) => void;
}) {
  return (
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
          {phong.map((room) => (
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
                      {room.tenant.so_nguoi} người ở ·{" "}
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
                  <Button size="xs" variant="light" onClick={() => onEdit(room)}>
                    Sửa
                  </Button>
                  {room.tenant ? (
                    <Button
                      size="xs"
                      variant="subtle"
                      color="orange"
                      onClick={() => onMoveOut(room)}
                    >
                      Chuyển đi
                    </Button>
                  ) : (
                    <Button size="xs" variant="subtle" onClick={() => onMoveIn(room)}>
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
  );
}
