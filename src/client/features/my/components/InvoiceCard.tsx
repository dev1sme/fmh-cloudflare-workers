import { Card, Group, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";

import type { InvoiceWithRoom } from "../../../../shared/types";
import { StatusBadge } from "../../../components/StatusBadge";
import { nhanKy, tien } from "../../../format";

export function InvoiceCard({ hoaDon }: { hoaDon: InvoiceWithRoom }) {
  return (
    <Card withBorder padding="md" component={Link} to={`/my-invoices/${hoaDon.id}`}>
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text fw={500}>{nhanKy(hoaDon.ky)}</Text>
          <Text size="xs" c="dimmed">
            {hoaDon.ma_hoa_don}
          </Text>
        </div>
        <Stack gap={4} align="flex-end">
          <Text fw={600}>{tien(hoaDon.tong_tien)}</Text>
          <StatusBadge value={hoaDon.trang_thai} />
        </Stack>
      </Group>
    </Card>
  );
}
