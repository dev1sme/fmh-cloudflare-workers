import { Badge } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { InvoiceStatus } from "../../shared/types";

const COLOURS: Record<InvoiceStatus, string> = {
  UNPAID: "owed",
  PAID: "settled",
  CANCELLED: "gray",
};

export function StatusBadge({ value }: { value: InvoiceStatus }) {
  const { t } = useTranslation();

  return (
    <Badge color={COLOURS[value]} variant="light">
      {t(`status.${value}`)}
    </Badge>
  );
}
