import { Card, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { InvoiceDetail, Payment } from "../../../../shared/types";
import { PaymentsTable } from "../../../components/PaymentsTable";
import type { NewPayment } from "../useInvoiceDetail";
import { PaymentForm } from "./PaymentForm";

export function PaymentsCard({
  invoice,
  onPay,
  onDeletePayment,
}: {
  invoice: InvoiceDetail;
  onPay: (input: NewPayment) => Promise<boolean>;
  onDeletePayment: (payment: Payment) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card withBorder padding="md">
      <Stack>
        <Text fw={500}>{t("invoices.paymentsTitle")}</Text>

        {invoice.payments.length > 0 && (
          <PaymentsTable payments={invoice.payments} onDelete={onDeletePayment} />
        )}

        {invoice.status === "CANCELLED" ? (
          <Text c="dimmed">{t("invoices.cancelledNoPayments")}</Text>
        ) : (
          <PaymentForm outstanding={invoice.outstanding} onSubmit={onPay} />
        )}
      </Stack>
    </Card>
  );
}
