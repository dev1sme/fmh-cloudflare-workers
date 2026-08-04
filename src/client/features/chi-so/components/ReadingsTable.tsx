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
                <Table.Td fw={500}>{room.ten_phong}</Table.Td>
                <Table.Td>
                  {reading ? (
                    `${reading.dien_cu} → ${reading.dien_moi}`
                  ) : (
                    <Badge color="gray" variant="light">
                      Chưa nhập
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>{reading ? `${reading.so_dien} kWh` : "—"}</Table.Td>
                <Table.Td>{reading ? `${reading.nuoc_cu} → ${reading.nuoc_moi}` : "—"}</Table.Td>
                <Table.Td>{reading ? `${reading.so_nuoc} m³` : "—"}</Table.Td>
                <Table.Td>{reading ? ngay(reading.ngay_ghi) : "—"}</Table.Td>
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
