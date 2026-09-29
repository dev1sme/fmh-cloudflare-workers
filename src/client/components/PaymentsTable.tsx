import { Button, Table } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { Payment } from "../../shared/types";
import { formatDate, money } from "../format";

export function PaymentsTable({
  payments,
  onDelete,
}: {
  payments: Payment[];
  onDelete?: (payment: Payment) => void;
}) {
  const { t } = useTranslation();

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t("payment.date")}</Table.Th>
          <Table.Th>{t("payment.amount")}</Table.Th>
          <Table.Th>{t("payment.method")}</Table.Th>
          <Table.Th>{t("payment.note")}</Table.Th>
          {onDelete && <Table.Th />}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {payments.map((payment) => (
          <Table.Tr key={payment.id}>
            <Table.Td>{formatDate(payment.paid_on)}</Table.Td>
            <Table.Td>{money(payment.amount)}</Table.Td>
            <Table.Td>{t(`method.${payment.method}`)}</Table.Td>
            <Table.Td>{payment.note ?? "—"}</Table.Td>
            {onDelete && (
              <Table.Td>
                <Button size="xs" variant="subtle" color="red" onClick={() => onDelete(payment)}>
                  {t("common.delete")}
                </Button>
              </Table.Td>
            )}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
