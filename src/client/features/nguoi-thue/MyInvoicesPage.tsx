import { Stack, Text, Title } from "@mantine/core";

import { PageState } from "../../components/PageState";
import { InvoiceCard } from "./components/InvoiceCard";
import { useHoaDonCuaToi, usePhongCuaToi } from "./useCuaToi";

export function MyInvoicesPage() {
  const { phong } = usePhongCuaToi();
  const { hoaDon, loading, error } = useHoaDonCuaToi();

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
