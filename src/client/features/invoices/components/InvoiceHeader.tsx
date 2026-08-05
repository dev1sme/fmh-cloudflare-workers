import { Group, Text } from "@mantine/core";

import type { InvoiceDetail } from "../../../../shared/types";
import { StatusBadge } from "../../../components/StatusBadge";
import { ngay, periodLabel } from "../../../format";

export function InvoiceHeader({ hoaDon }: { hoaDon: InvoiceDetail }) {
  return (
    <Group>
      <Text c="dimmed">{periodLabel(hoaDon.period)}</Text>
      <StatusBadge value={hoaDon.status} />
      <Text c="dimmed" size="sm">
        Tạo ngày {ngay(hoaDon.created_at)}
      </Text>
    </Group>
  );
}
