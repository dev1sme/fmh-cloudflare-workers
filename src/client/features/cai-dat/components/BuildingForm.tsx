import { Button, Card, Divider, Group, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

import type { Building } from "../../../../shared/types";
import { BankFields, type BankValue } from "./BankFields";

export function BuildingForm({
  nha,
  onSave,
  onDelete,
}: {
  nha: Building;
  onSave: (id: number, patch: Partial<Building>) => Promise<boolean>;
  onDelete: (nha: Building) => void;
}) {
  const [name, setName] = useState(nha.name);
  const [address, setAddress] = useState(nha.address ?? "");
  const [dien, setDien] = useState<number | string>(nha.don_gia_dien);
  const [nuoc, setNuoc] = useState<number | string>(nha.don_gia_nuoc);
  const [bank, setBank] = useState<BankValue>({
    bin: nha.bank_bin,
    soTk: nha.bank_so_tk ?? "",
    chuTk: nha.bank_chu_tk ?? "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(nha.name);
    setAddress(nha.address ?? "");
    setDien(nha.don_gia_dien);
    setNuoc(nha.don_gia_nuoc);
    setBank({ bin: nha.bank_bin, soTk: nha.bank_so_tk ?? "", chuTk: nha.bank_chu_tk ?? "" });
  }, [nha]);

  async function save() {
    setBusy(true);

    await onSave(nha.id, {
      name,
      address: address || null,
      don_gia_dien: Number(dien),
      don_gia_nuoc: Number(nuoc),
      bank_bin: bank.bin || null,
      bank_so_tk: bank.soTk || null,
      bank_chu_tk: bank.chuTk || null,
    });

    setBusy(false);
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
        <Divider my="xs" />
        <BankFields value={bank} onChange={setBank} />
        <Divider my="xs" />

        <Group justify="space-between">
          <Button onClick={save} loading={busy}>
            Lưu
          </Button>
          <Button variant="subtle" color="red" onClick={() => onDelete(nha)}>
            Xoá nhà
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
