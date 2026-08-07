import { Group, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { InvoiceDetail } from "../../../../shared/types";
import { StatusBadge } from "../../../components/StatusBadge";
import { ngay, periodLabel } from "../../../format";

export function InvoiceHeader({ hoaDon }: { hoaDon: InvoiceDetail }) {
  const { t } = useTranslation();

  return (
    <Group>
      <Text c="dimmed">{periodLabel(hoaDon.period)}</Text>
      <StatusBadge value={hoaDon.status} />
      <Text c="dimmed" size="sm">
        {t("invoices.createdOn", { date: ngay(hoaDon.created_at) })}
      </Text>
    </Group>
  );
}
