import { Card, Table, Title, UnstyledButton } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { RevenueYear } from "../../../../shared/types";
import { money } from "../../../format";

/**
 * Every year side by side, newest first. A row opens that year.
 *
 * Below `sm` the collected and cash-in columns drop out: five money columns do
 * not fit 375 px, and a table inside a card cannot usefully scroll sideways.
 * Revenue and what is still owed are the two a phone keeps — the rest is one
 * tap away on the year itself.
 */
export function YearsTable({
  years,
  selected,
  onSelect,
}: {
  years: RevenueYear[];
  selected: number;
  onSelect: (year: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card withBorder padding="lg">
      <Title order={5} mb="xs">
        {t("reports.years")}
      </Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("reports.colYear")}</Table.Th>
            <Table.Th className="fmh-num">{t("reports.colBilled")}</Table.Th>
            <Table.Th className="fmh-num" visibleFrom="sm">
              {t("reports.colCollected")}
            </Table.Th>
            <Table.Th className="fmh-num">{t("reports.colOutstanding")}</Table.Th>
            <Table.Th className="fmh-num" visibleFrom="sm">
              {t("reports.colCashIn")}
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {years.map((row) => (
            <Table.Tr
              key={row.year}
              onClick={() => onSelect(row.year)}
              className={row.outstanding > 0 ? "fmh-owes" : undefined}
              style={{
                cursor: "pointer",
                fontWeight: row.year === selected ? 700 : undefined,
              }}
            >
              <Table.Td>
                {/* A real button, so the row is reachable and operable from
                    the keyboard. It has no handler of its own: its click —
                    Enter and Space included — bubbles to the row's. */}
                <UnstyledButton
                  aria-current={row.year === selected ? "true" : undefined}
                  fw="inherit"
                >
                  {row.year}
                </UnstyledButton>
              </Table.Td>
              <Table.Td className="fmh-num">{money(row.billed)}</Table.Td>
              <Table.Td className="fmh-num" visibleFrom="sm">
                {money(row.collected)}
              </Table.Td>
              <Table.Td className="fmh-num" c={row.outstanding > 0 ? "owed" : undefined}>
                {money(row.outstanding)}
              </Table.Td>
              <Table.Td className="fmh-num" visibleFrom="sm">
                {money(row.cash_in)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
