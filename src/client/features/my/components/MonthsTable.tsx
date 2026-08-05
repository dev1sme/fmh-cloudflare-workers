import { Table, Text } from "@mantine/core";

import type { TenantMonth } from "../../../../shared/types";
import { StatusBadge } from "../../../components/StatusBadge";
import { periodLabel, tien } from "../../../format";

const SO = new Intl.NumberFormat("vi-VN");

/**
 * One row per month: what the meters read and what was billed.
 *
 * A month can appear with usage but no invoice — the manager records the
 * meters first and generates invoices afterwards, so an empty money column
 * means "not billed yet", not "nothing owed".
 */
export function MonthsTable({ months }: { months: TenantMonth[] }) {
  return (
    <Table.ScrollContainer minWidth={640}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Tháng</Table.Th>
            <Table.Th ta="right">Điện</Table.Th>
            <Table.Th ta="right">Nước</Table.Th>
            <Table.Th ta="right">Tổng tiền</Table.Th>
            <Table.Th ta="right">Đã đóng</Table.Th>
            <Table.Th ta="right">Còn lại</Table.Th>
            <Table.Th>Trạng thái</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {months.map((month) => (
            <Table.Tr key={month.period}>
              <Table.Td fw={500}>{periodLabel(month.period)}</Table.Td>
              <Table.Td ta="right">
                {month.electricity_used === null ? (
                  <Text c="dimmed">—</Text>
                ) : (
                  `${SO.format(month.electricity_used)} kWh`
                )}
              </Table.Td>
              <Table.Td ta="right">
                {month.water_used === null ? (
                  <Text c="dimmed">—</Text>
                ) : (
                  `${SO.format(month.water_used)} m³`
                )}
              </Table.Td>
              <Table.Td ta="right" fw={600}>
                {month.total === null ? <Text c="dimmed">Chưa có hóa đơn</Text> : tien(month.total)}
              </Table.Td>
              <Table.Td ta="right">{month.total === null ? "—" : tien(month.paid)}</Table.Td>
              <Table.Td ta="right" fw={600} c={month.outstanding > 0 ? "orange" : undefined}>
                {month.total === null ? "—" : tien(month.outstanding)}
              </Table.Td>
              <Table.Td>
                {month.status ? <StatusBadge value={month.status} /> : <Text c="dimmed">—</Text>}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
