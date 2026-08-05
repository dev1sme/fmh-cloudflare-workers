import { Badge } from "@mantine/core";

import type { InvoiceStatus } from "../../shared/types";

const LABELS: Record<InvoiceStatus, { text: string; color: string }> = {
  chua_thanh_toan: { text: "Chưa thanh toán", color: "orange" },
  da_thanh_toan: { text: "Đã thanh toán", color: "teal" },
  huy: { text: "Đã huỷ", color: "gray" },
};

export function StatusBadge({ value }: { value: InvoiceStatus }) {
  const { text, color } = LABELS[value];
  return (
    <Badge color={color} variant="light">
      {text}
    </Badge>
  );
}
