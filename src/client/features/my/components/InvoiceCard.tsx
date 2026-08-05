import { Card, Group, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";

import type { InvoiceWithRoom } from "../../../../shared/types";
import { StatusBadge } from "../../../components/StatusBadge";
import { periodLabel, tien } from "../../../format";

export function InvoiceCard({ hoaDon }: { hoaDon: InvoiceWithRoom }) {
  return (
    <Card withBorder padding="md" component={Link} to={`/my-invoices/${hoaDon.code}`}>
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text fw={500}>{periodLabel(hoaDon.period)}</Text>
          <Text size="xs" c="dimmed">
            {hoaDon.code}
          </Text>
        </div>
        <Stack gap={4} align="flex-end">
          <Text fw={600}>{tien(hoaDon.total)}</Text>
          <StatusBadge value={hoaDon.status} />
        </Stack>
      </Group>
    </Card>
  );
}
