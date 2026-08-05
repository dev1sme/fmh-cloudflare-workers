import { Table } from "@mantine/core";

import type { ReadingDetail } from "../../../../shared/types";
import { ngay, periodLabel } from "../../../format";

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
              <Table.Td fw={500}>{periodLabel(reading.period)}</Table.Td>
              <Table.Td>
                {reading.electricity_start} → {reading.electricity_end}
              </Table.Td>
              <Table.Td>{reading.electricity_used} kWh</Table.Td>
              <Table.Td>
                {reading.water_start} → {reading.water_end}
              </Table.Td>
              <Table.Td>{reading.water_used} m³</Table.Td>
              <Table.Td>{ngay(reading.recorded_on)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
