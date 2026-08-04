import { Card, Group, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

import { me } from "../../api";
import { PageState } from "../../components/PageState";
import { TrangThaiBadge } from "../../components/TrangThaiBadge";
import { nhanKy, tien } from "../../format";
import { useResource } from "../../hooks/useResource";

export function MyInvoicesPage() {
  const room = useResource(() => me.room(), []);
  const invoices = useResource(() => me.invoices(), []);

  return (
    <Stack>
      <Title order={3}>Hóa đơn của tôi</Title>
      {room.data && (
        <Text c="dimmed">
          Phòng {room.data.room.ten_phong} — {room.data.room.building_name}
        </Text>
      )}

      <PageState loading={invoices.loading} error={invoices.error}>
        {invoices.data && invoices.data.invoices.length === 0 ? (
          <Text c="dimmed">Chưa có hóa đơn nào.</Text>
        ) : (
          <Stack gap="sm">
            {invoices.data?.invoices.map((invoice) => (
              <Card
                key={invoice.id}
                withBorder
                padding="md"
                component={Link}
                to={`/hoa-don-cua-toi/${invoice.id}`}
              >
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Text fw={500}>{nhanKy(invoice.ky)}</Text>
                    <Text size="xs" c="dimmed">
                      {invoice.ma_hoa_don}
                    </Text>
                  </div>
                  <Stack gap={4} align="flex-end">
                    <Text fw={600}>{tien(invoice.tong_tien)}</Text>
                    <TrangThaiBadge value={invoice.trang_thai} />
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
