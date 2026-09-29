import { Button, Table, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { InvoiceWithRoom } from "../../../../shared/types";
import { CollectionBar } from "../../../components/CollectionBar";
import { money } from "../../../format";

/** Not cancelled and not fully paid — the rows that get the amber edge. */
function owes(invoice: InvoiceWithRoom): boolean {
  return invoice.status !== "CANCELLED" && invoice.paid < invoice.total;
}

export function InvoicesTable({
  invoices,
  grandTotal,
}: {
  invoices: InvoiceWithRoom[];
  grandTotal: number;
}) {
  const { t } = useTranslation();

  return (
    <Table.ScrollContainer minWidth={860}>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("invoices.colCode")}</Table.Th>
            <Table.Th>{t("dashboard.colRoom")}</Table.Th>
            <Table.Th ta="right">{t("invoice.rent")}</Table.Th>
            <Table.Th ta="right">{t("meter.electricity")}</Table.Th>
            <Table.Th ta="right">{t("meter.water")}</Table.Th>
            <Table.Th ta="right">{t("invoice.otherFees")}</Table.Th>
            <Table.Th ta="right">{t("invoices.colTotal")}</Table.Th>
            <Table.Th>{t("invoice.collected")}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {invoices.map((invoice) => (
            <Table.Tr key={invoice.id} className={owes(invoice) ? "fmh-owes" : undefined}>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {invoice.code}
                </Text>
              </Table.Td>
              <Table.Td fw={600}>{invoice.room_name}</Table.Td>
              <Table.Td className="fmh-num">{money(invoice.rent_amount)}</Table.Td>
              <Table.Td className="fmh-num">{money(invoice.electricity_amount)}</Table.Td>
              <Table.Td className="fmh-num">{money(invoice.water_amount)}</Table.Td>
              <Table.Td className="fmh-num">{money(invoice.other_fees)}</Table.Td>
              <Table.Td className="fmh-num" fw={700}>
                {money(invoice.total)}
              </Table.Td>
              <Table.Td>
                <CollectionBar
                  total={invoice.total}
                  paid={invoice.paid}
                  status={invoice.status}
                />
              </Table.Td>
              <Table.Td>
                <Button size="compact-sm" variant="subtle" component={Link} to={`/invoices/${invoice.code}`}>
                  {t("invoices.details")}
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>

        <Table.Tfoot>
          <Table.Tr>
            <Table.Td colSpan={6} ta="right">
              <Text size="xs" tt="uppercase" c="dimmed" fw={600} style={{ letterSpacing: "0.06em" }}>
                {t("invoice.total")}
              </Text>
            </Table.Td>
            <Table.Td className="fmh-num" fw={700}>
              {money(grandTotal)}
            </Table.Td>
            <Table.Td colSpan={2} />
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </Table.ScrollContainer>
  );
}
