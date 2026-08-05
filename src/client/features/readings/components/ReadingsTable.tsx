import { Badge, Button, Group, Table } from "@mantine/core";

import type { ReadingDetail, RoomDetail } from "../../../../shared/types";
import { ngay } from "../../../format";

export function ReadingsTable({
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
  return (
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
          {phong.map((room) => {
            const reading = chiSoCuaPhong(room.id);

            return (
              <Table.Tr key={room.id}>
                <Table.Td fw={500}>{room.room_name}</Table.Td>
                <Table.Td>
                  {reading ? (
                    `${reading.electricity_start} → ${reading.electricity_end}`
                  ) : (
                    <Badge color="gray" variant="light">
                      Chưa nhập
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>{reading ? `${reading.electricity_used} kWh` : "—"}</Table.Td>
                <Table.Td>{reading ? `${reading.water_start} → ${reading.water_end}` : "—"}</Table.Td>
                <Table.Td>{reading ? `${reading.water_used} m³` : "—"}</Table.Td>
                <Table.Td>{reading ? ngay(reading.recorded_on) : "—"}</Table.Td>
                <Table.Td>
                  <Group justify="flex-end" gap="xs" wrap="nowrap">
                    <Button size="xs" variant="light" onClick={() => onEdit(room, reading)}>
                      {reading ? "Sửa" : "Nhập"}
                    </Button>
                    {reading && (
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => onDelete(reading)}
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
  );
}
