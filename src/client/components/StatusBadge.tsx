import { Badge } from "@mantine/core";

import type { InvoiceStatus } from "../../shared/types";

const LABELS: Record<InvoiceStatus, { text: string; color: string }> = {
  UNPAID: { text: "Chưa thanh toán", color: "orange" },
  PAID: { text: "Đã thanh toán", color: "teal" },
  CANCELLED: { text: "Đã huỷ", color: "gray" },
};

export function StatusBadge({ value }: { value: InvoiceStatus }) {
  const { text, color } = LABELS[value];
  return (
    <Badge color={color} variant="light">
      {text}
    </Badge>
  );
}
