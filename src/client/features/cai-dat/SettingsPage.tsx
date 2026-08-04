import { Stack, Text, Title } from "@mantine/core";

import { PageState } from "../../components/PageState";
import { BuildingForm } from "./components/BuildingForm";
import { useDanhSachNha, useThaoTacNha } from "./useCaiDat";

export function SettingsPage() {
  const { nha, loading, error, reload } = useDanhSachNha();
  const { luu } = useThaoTacNha(reload);

  return (
    <Stack>
      <Title order={3}>Cài đặt</Title>
      <Text c="dimmed" size="sm">
        Đơn giá ở đây chỉ áp dụng cho hóa đơn sinh từ giờ trở đi. Hóa đơn đã phát hành giữ nguyên
        đơn giá lúc phát hành.
      </Text>

      <PageState loading={loading} error={error}>
        <Stack>
          {nha.map((item) => (
            <BuildingForm key={item.id} nha={item} onSave={luu} />
          ))}
        </Stack>
      </PageState>
    </Stack>
  );
}
