import { ActionIcon, Table, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import type { Payment } from "../../shared/types";
import { formatDate, money } from "../format";

/**
 * Payments recorded against one invoice.
 *
 * Below `sm` the method and note columns fold under the date. Five columns
 * measured 389 px inside a 294 px card on a 375 px phone, and the overflow was
 * clipped — the delete column was off the card entirely, so a payment entered
 * by mistake could not be removed from a phone.
 *
 * Delete is an icon rather than a text button so the column stays narrow, at
 * 34 px so it is still a thumb-sized target.
 */
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
          <Table.Th className="fmh-num">{t("payment.amount")}</Table.Th>
          <Table.Th visibleFrom="sm">{t("payment.method")}</Table.Th>
          <Table.Th visibleFrom="sm">{t("payment.note")}</Table.Th>
          {onDelete && <Table.Th />}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {payments.map((payment) => (
          <Table.Tr key={payment.id}>
            <Table.Td>
              {formatDate(payment.paid_on)}
              <Text size="xs" c="dimmed" hiddenFrom="sm">
                {t(`method.${payment.method}`)}
                {payment.note && ` · ${payment.note}`}
              </Text>
            </Table.Td>
            <Table.Td className="fmh-num">{money(payment.amount)}</Table.Td>
            <Table.Td visibleFrom="sm">{t(`method.${payment.method}`)}</Table.Td>
            <Table.Td visibleFrom="sm">{payment.note ?? "—"}</Table.Td>
            {onDelete && (
              <Table.Td w={1}>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="lg"
                  onClick={() => onDelete(payment)}
                  aria-label={t("common.delete")}
                >
                  <IconTrash size={16} stroke={1.8} />
                </ActionIcon>
              </Table.Td>
            )}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
