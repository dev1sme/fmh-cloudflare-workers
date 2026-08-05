import { Stack, Text, Title } from "@mantine/core";

import { PageState } from "../../components/PageState";
import { InvoiceCard } from "./components/InvoiceCard";
import { useInvoicesCuaToi, useRoomsCuaToi } from "./useMine";

export function MyInvoicesPage() {
  const { phong } = useRoomsCuaToi();
  const { hoaDon, loading, error } = useInvoicesCuaToi();

  return (
    <Stack>
      <Title order={3}>Hóa đơn của tôi</Title>
      {phong && (
        <Text c="dimmed">
          Phòng {phong.ten_phong} — {phong.building_name}
        </Text>
      )}

      <PageState loading={loading} error={error}>
        {hoaDon.length === 0 ? (
          <Text c="dimmed">Chưa có hóa đơn nào.</Text>
        ) : (
          <Stack gap="sm">
            {hoaDon.map((invoice) => (
              <InvoiceCard key={invoice.id} hoaDon={invoice} />
            ))}
          </Stack>
        )}
      </PageState>
    </Stack>
  );
}
