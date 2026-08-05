import { Button, Group, Menu, Table, Text } from "@mantine/core";

import type { RoomDetail } from "../../../../shared/types";
import { ngay, tien } from "../../../format";

export function RoomsTable({
  phong,
  onEdit,
  onMoveIn,
  onMoveOut,
  onDelete,
}: {
  phong: RoomDetail[];
  onEdit: (room: RoomDetail) => void;
  onMoveIn: (room: RoomDetail) => void;
  onMoveOut: (room: RoomDetail) => void;
  onDelete: (room: RoomDetail) => void;
}) {
  return (
    <Table.ScrollContainer minWidth={720}>
      <Table>
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
                <Text fw={500}>{room.room_name}</Text>
                <Text size="xs" c="dimmed">
                  {room.building_name}
                </Text>
              </Table.Td>
              <Table.Td>{tien(room.rent)}</Table.Td>
              <Table.Td>{room.area ? `${room.area} m²` : "—"}</Table.Td>
              <Table.Td>
                {room.tenant ? (
                  <>
                    <Text>{room.tenant.full_name}</Text>
                    <Text size="xs" c="dimmed">
                      {room.tenant.occupants} người ở ·{" "}
                      {room.tenant.phone ?? "chưa có số điện thoại"}
                    </Text>
                  </>
                ) : (
                  <Text c="dimmed">Đang trống</Text>
                )}
              </Table.Td>
              <Table.Td>{room.tenant ? ngay(room.tenant.moved_in) : "—"}</Table.Td>
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
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <Button size="xs" variant="subtle" color="gray">
                        ⋯
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item color="red" onClick={() => onDelete(room)}>
                        Xoá phòng
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
