import { Group, Text } from "@mantine/core";

import type { InvoiceDetail } from "../../../../shared/types";
import { StatusBadge } from "../../../components/StatusBadge";
import { ngay, nhanKy } from "../../../format";

export function InvoiceHeader({ hoaDon }: { hoaDon: InvoiceDetail }) {
  return (
    <Group>
      <Text c="dimmed">{nhanKy(hoaDon.ky)}</Text>
      <StatusBadge value={hoaDon.trang_thai} />
      <Text c="dimmed" size="sm">
        Tạo ngày {ngay(hoaDon.ngay_tao)}
      </Text>
    </Group>
  );
}
