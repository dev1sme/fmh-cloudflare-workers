import { Card, Stack, Text } from "@mantine/core";

import type { InvoiceDetail, Payment } from "../../../../shared/types";
import { PaymentsTable } from "../../../components/PaymentsTable";
import type { ThanhToanMoi } from "../useHoaDonChiTiet";
import { PaymentForm } from "./PaymentForm";

export function PaymentsCard({
  hoaDon,
  onPay,
  onDeletePayment,
}: {
  hoaDon: InvoiceDetail;
  onPay: (input: ThanhToanMoi) => Promise<boolean>;
  onDeletePayment: (payment: Payment) => void;
}) {
  return (
    <Card withBorder padding="md">
      <Stack>
        <Text fw={500}>Thanh toán</Text>

        {hoaDon.payments.length > 0 && (
          <PaymentsTable payments={hoaDon.payments} onDelete={onDeletePayment} />
        )}

        {hoaDon.trang_thai === "huy" ? (
          <Text c="dimmed">Hóa đơn đã huỷ, không ghi nhận thêm thanh toán.</Text>
        ) : (
          <PaymentForm conLai={hoaDon.con_lai} onSubmit={onPay} />
        )}
      </Stack>
    </Card>
  );
}
