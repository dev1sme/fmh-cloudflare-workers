import { Button, Table } from "@mantine/core";
import { Link } from "react-router-dom";

import type { InvoiceWithRoom } from "../../../../shared/types";
import { StatusBadge } from "../../../components/StatusBadge";
import { tien } from "../../../format";

export function InvoicesTable({
  hoaDon,
  tongTien,
}: {
  hoaDon: InvoiceWithRoom[];
  tongTien: number;
}) {
  return (
    <Table.ScrollContainer minWidth={820}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Mã</Table.Th>
            <Table.Th>Phòng</Table.Th>
            <Table.Th>Tiền phòng</Table.Th>
            <Table.Th>Điện</Table.Th>
            <Table.Th>Nước</Table.Th>
            <Table.Th>Phí khác</Table.Th>
            <Table.Th>Tổng</Table.Th>
            <Table.Th>Trạng thái</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {hoaDon.map((invoice) => (
            <Table.Tr key={invoice.id}>
              <Table.Td>{invoice.code}</Table.Td>
              <Table.Td fw={500}>{invoice.room_name}</Table.Td>
              <Table.Td>{tien(invoice.rent_amount)}</Table.Td>
              <Table.Td>{tien(invoice.electricity_amount)}</Table.Td>
              <Table.Td>{tien(invoice.water_amount)}</Table.Td>
              <Table.Td>{tien(invoice.other_fees)}</Table.Td>
              <Table.Td fw={600}>{tien(invoice.total)}</Table.Td>
              <Table.Td>
                <StatusBadge value={invoice.status} />
              </Table.Td>
              <Table.Td>
                <Button size="xs" variant="light" component={Link} to={`/invoices/${invoice.code}`}>
                  Chi tiết
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr>
            <Table.Td colSpan={6} ta="right" fw={500}>
              Tổng cộng
            </Table.Td>
            <Table.Td fw={700}>{tien(tongTien)}</Table.Td>
            <Table.Td colSpan={2} />
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </Table.ScrollContainer>
  );
}
