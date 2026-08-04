import { Card, Group, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";

import type { InvoiceWithRoom } from "../../../../shared/types";
import { TrangThaiBadge } from "../../../components/TrangThaiBadge";
import { nhanKy, tien } from "../../../format";

export function InvoiceCard({ hoaDon }: { hoaDon: InvoiceWithRoom }) {
  return (
    <Card withBorder padding="md" component={Link} to={`/hoa-don-cua-toi/${hoaDon.id}`}>
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text fw={500}>{nhanKy(hoaDon.ky)}</Text>
          <Text size="xs" c="dimmed">
            {hoaDon.ma_hoa_don}
          </Text>
        </div>
        <Stack gap={4} align="flex-end">
          <Text fw={600}>{tien(hoaDon.tong_tien)}</Text>
          <TrangThaiBadge value={hoaDon.trang_thai} />
        </Stack>
      </Group>
    </Card>
  );
}
