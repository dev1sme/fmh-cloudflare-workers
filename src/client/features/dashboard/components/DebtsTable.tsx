import { Anchor, Card, Table, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { DashboardDebt } from "../../../../shared/types";
import { periodLabel, money } from "../../../format";

/**
 * Who still owes money, worst first, across every period — not just the one
 * selected above. An invoice from three months ago is exactly what this list
 * exists to surface.
 */
export function DebtsTable({ debts }: { debts: DashboardDebt[] }) {
  const { t } = useTranslation();

  return (
    <Card withBorder padding="md" radius="md">
      <Title order={5} mb="sm">
        {t("dashboard.debtsTitle")}
      </Title>

      {debts.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t("dashboard.noDebts")}
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={420}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("dashboard.colRoom")}</Table.Th>
                <Table.Th>{t("dashboard.colInvoices")}</Table.Th>
                <Table.Th>{t("dashboard.colOldest")}</Table.Th>
                <Table.Th ta="right">{t("dashboard.colOutstanding")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {debts.map((debt) => (
                <Table.Tr key={debt.room_id}>
                  <Table.Td fw={500}>
                    {/* No room filter on the invoices screen yet, so link to
                        the list rather than promise a filter that is ignored. */}
                    <Anchor component={Link} to="/invoices" inherit>
                      {debt.room_name}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{debt.invoice_count}</Table.Td>
                  <Table.Td c="dimmed">{periodLabel(debt.oldest_period)}</Table.Td>
                  <Table.Td className="fmh-num" fw={600} c="owed.6">
                    {money(debt.amount)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Card>
  );
}
