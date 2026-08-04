import { Button, Card, Group, NumberInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { useEffect, useState } from "react";

import type { Building } from "../../../shared/types";
import { buildings as buildingsApi } from "../../api";
import { PageState } from "../../components/PageState";
import { baoLoi, baoThanhCong } from "../../errors";
import { useResource } from "../../hooks/useResource";

export function SettingsPage() {
  const { data, loading, error, reload } = useResource(() => buildingsApi.list());

  return (
    <Stack>
      <Title order={3}>Cài đặt</Title>
      <Text c="dimmed" size="sm">
        Đơn giá ở đây chỉ áp dụng cho hóa đơn sinh từ giờ trở đi. Hóa đơn đã phát hành giữ nguyên
        đơn giá lúc phát hành.
      </Text>

      <PageState loading={loading} error={error}>
        <Stack>
          {data?.buildings.map((building) => (
            <BuildingCard key={building.id} building={building} onSaved={reload} />
          ))}
        </Stack>
      </PageState>
    </Stack>
  );
}

function BuildingCard({ building, onSaved }: { building: Building; onSaved: () => void }) {
  const [name, setName] = useState(building.name);
  const [address, setAddress] = useState(building.address ?? "");
  const [dien, setDien] = useState<number | string>(building.don_gia_dien);
  const [nuoc, setNuoc] = useState<number | string>(building.don_gia_nuoc);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(building.name);
    setAddress(building.address ?? "");
    setDien(building.don_gia_dien);
    setNuoc(building.don_gia_nuoc);
  }, [building]);

  async function save() {
    setBusy(true);

    try {
      await buildingsApi.update(building.id, {
        name,
        address: address || null,
        don_gia_dien: Number(dien),
        don_gia_nuoc: Number(nuoc),
      });
      baoThanhCong("Đã lưu cài đặt nhà.");
      onSaved();
    } catch (err) {
      baoLoi(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card withBorder padding="md">
      <Stack>
        <TextInput label="Tên nhà" value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <TextInput
          label="Địa chỉ"
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
        />
        <Group grow>
          <NumberInput
            label="Đơn giá điện (đ/kWh)"
            value={dien}
            onChange={setDien}
            min={0}
            step={500}
            thousandSeparator="."
            decimalSeparator=","
          />
          <NumberInput
            label="Đơn giá nước (đ/m³)"
            value={nuoc}
            onChange={setNuoc}
            min={0}
            step={1000}
            thousandSeparator="."
            decimalSeparator=","
          />
        </Group>
        <Group>
          <Button onClick={save} loading={busy}>
            Lưu
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
