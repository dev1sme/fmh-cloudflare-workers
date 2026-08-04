import { Button, Card, Group, NumberInput, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";

export function PhiKhacCard({
  phiKhac,
  onSave,
}: {
  phiKhac: number;
  onSave: (value: number) => Promise<boolean>;
}) {
  const [value, setValue] = useState<number | string>(phiKhac);
  const [busy, setBusy] = useState(false);

  useEffect(() => setValue(phiKhac), [phiKhac]);

  async function save() {
    setBusy(true);
    await onSave(Number(value));
    setBusy(false);
  }

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Text fw={500}>Phí khác</Text>
        <Group align="flex-end">
          <NumberInput
            value={value}
            onChange={setValue}
            min={0}
            step={10000}
            thousandSeparator="."
            decimalSeparator=","
            w={200}
          />
          <Button variant="light" onClick={save} loading={busy}>
            Lưu
          </Button>
        </Group>
        <Text size="xs" c="dimmed">
          Đơn giá điện/nước không sửa được — giá đã chốt lúc phát hành. Nếu sai giá, xoá hóa đơn rồi
          sinh lại.
        </Text>
      </Stack>
    </Card>
  );
}
