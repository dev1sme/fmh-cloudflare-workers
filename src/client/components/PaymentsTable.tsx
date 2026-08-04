import { Button, Table } from "@mantine/core";

import type { Payment } from "../../shared/types";
import { ngay, tien } from "../format";

export const TEN_PHUONG_THUC: Record<Payment["phuong_thuc"], string> = {
  chuyen_khoan: "Chuyển khoản",
  tien_mat: "Tiền mặt",
};

export function PaymentsTable({
  payments,
  onDelete,
}: {
  payments: Payment[];
  onDelete?: (payment: Payment) => void;
}) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Ngày</Table.Th>
          <Table.Th>Số tiền</Table.Th>
          <Table.Th>Hình thức</Table.Th>
          <Table.Th>Ghi chú</Table.Th>
          {onDelete && <Table.Th />}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {payments.map((payment) => (
          <Table.Tr key={payment.id}>
            <Table.Td>{ngay(payment.ngay_tt)}</Table.Td>
            <Table.Td>{tien(payment.so_tien)}</Table.Td>
            <Table.Td>{TEN_PHUONG_THUC[payment.phuong_thuc]}</Table.Td>
            <Table.Td>{payment.ghi_chu ?? "—"}</Table.Td>
            {onDelete && (
              <Table.Td>
                <Button size="xs" variant="subtle" color="red" onClick={() => onDelete(payment)}>
                  Xoá
                </Button>
              </Table.Td>
            )}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
