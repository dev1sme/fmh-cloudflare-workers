import { Card, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { InvoiceDetail, Payment } from "../../../../shared/types";
import { PaymentsTable } from "../../../components/PaymentsTable";
import type { ThanhToanMoi } from "../useInvoiceDetail";
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
  const { t } = useTranslation();

  return (
    <Card withBorder padding="md">
      <Stack>
        <Text fw={500}>{t("invoices.paymentsTitle")}</Text>

        {hoaDon.payments.length > 0 && (
          <PaymentsTable payments={hoaDon.payments} onDelete={onDeletePayment} />
        )}

        {hoaDon.status === "CANCELLED" ? (
          <Text c="dimmed">{t("invoices.cancelledNoPayments")}</Text>
        ) : (
          <PaymentForm conLai={hoaDon.outstanding} onSubmit={onPay} />
        )}
      </Stack>
    </Card>
  );
}
