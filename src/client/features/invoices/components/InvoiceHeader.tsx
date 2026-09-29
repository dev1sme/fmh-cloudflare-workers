import { Group, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { InvoiceDetail } from "../../../../shared/types";
import { StatusBadge } from "../../../components/StatusBadge";
import { formatDate, periodLabel } from "../../../format";

export function InvoiceHeader({ invoice }: { invoice: InvoiceDetail }) {
  const { t } = useTranslation();

  return (
    <Group>
      <Text c="dimmed">{periodLabel(invoice.period)}</Text>
      <StatusBadge value={invoice.status} />
      <Text c="dimmed" size="sm">
        {t("invoices.createdOn", { date: formatDate(invoice.created_at) })}
      </Text>
    </Group>
  );
}
