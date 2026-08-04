import { Table } from "@mantine/core";

import type { ReadingDetail } from "../../../../shared/types";
import { ngay, nhanKy } from "../../../format";

export function ReadingsHistoryTable({ chiSo }: { chiSo: ReadingDetail[] }) {
  return (
    <Table.ScrollContainer minWidth={620}>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Kỳ</Table.Th>
            <Table.Th>Điện (cũ → mới)</Table.Th>
            <Table.Th>Số điện</Table.Th>
            <Table.Th>Nước (cũ → mới)</Table.Th>
            <Table.Th>Số nước</Table.Th>
            <Table.Th>Ngày ghi</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {chiSo.map((reading) => (
            <Table.Tr key={reading.id}>
              <Table.Td fw={500}>{nhanKy(reading.ky)}</Table.Td>
              <Table.Td>
                {reading.dien_cu} → {reading.dien_moi}
              </Table.Td>
              <Table.Td>{reading.so_dien} kWh</Table.Td>
              <Table.Td>
                {reading.nuoc_cu} → {reading.nuoc_moi}
              </Table.Td>
              <Table.Td>{reading.so_nuoc} m³</Table.Td>
              <Table.Td>{ngay(reading.ngay_ghi)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
