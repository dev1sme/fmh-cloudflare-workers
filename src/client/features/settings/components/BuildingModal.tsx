import { Button, Group, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

import type { BuildingInput } from "../../../api";

/** Creating a building. Editing one happens inline on its card. */
export function BuildingModal({
  opened,
  onClose,
  onSubmit,
}: {
  opened: boolean;
  onClose: () => void;
  onSubmit: (input: BuildingInput) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [dien, setDien] = useState<number | string>(3000);
  const [nuoc, setNuoc] = useState<number | string>(15000);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setName("");
    setAddress("");
    setDien(3000);
    setNuoc(15000);
  }, [opened]);

  async function save() {
    setBusy(true);

    const ok = await onSubmit({
      name,
      address: address || null,
      electricity_rate: Number(dien),
      water_rate: Number(nuoc),
    });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Thêm nhà">
      <Stack>
        <TextInput
          label="Tên nhà"
          placeholder="FMH 2"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />
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
        <Button onClick={save} loading={busy}>
          Thêm nhà
        </Button>
      </Stack>
    </Modal>
  );
}
