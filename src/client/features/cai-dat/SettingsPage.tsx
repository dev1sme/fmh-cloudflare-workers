import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

import type { Building } from "../../../shared/types";
import { PageState } from "../../components/PageState";
import { useConfirm } from "../../hooks/useConfirm";
import { BuildingForm } from "./components/BuildingForm";
import { BuildingModal } from "./components/BuildingModal";
import { useDanhSachNha, useThaoTacNha } from "./useCaiDat";

export function SettingsPage() {
  const { nha, loading, error, reload } = useDanhSachNha();
  const { them, luu, xoa } = useThaoTacNha(reload);
  const { xacNhan, hopThoai } = useConfirm();

  const [dangThem, setDangThem] = useState(false);

  function hoiXoa(item: Building) {
    xacNhan({
      title: "Xoá nhà",
      message: `Xoá "${item.name}"? Chỉ xoá được khi nhà không còn phòng nào.`,
      confirmLabel: "Xoá",
      onConfirm: () => xoa(item.id),
    });
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Cài đặt</Title>
        <Button onClick={() => setDangThem(true)}>Thêm nhà</Button>
      </Group>

      <Text c="dimmed" size="sm">
        Đơn giá ở đây chỉ áp dụng cho hóa đơn sinh từ giờ trở đi. Hóa đơn đã phát hành giữ nguyên
        đơn giá lúc phát hành.
      </Text>

      <PageState loading={loading} error={error}>
        <Stack>
          {nha.map((item) => (
            <BuildingForm key={item.id} nha={item} onSave={luu} onDelete={hoiXoa} />
          ))}
        </Stack>
      </PageState>

      <BuildingModal opened={dangThem} onClose={() => setDangThem(false)} onSubmit={them} />
      {hopThoai}
    </Stack>
  );
}
