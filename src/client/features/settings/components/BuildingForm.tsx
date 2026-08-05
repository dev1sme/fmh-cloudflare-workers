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
  const [dien, setDien] = useState<number | string>(nha.electricity_rate);
  const [nuoc, setNuoc] = useState<number | string>(nha.water_rate);
  const [bank, setBank] = useState<BankValue>({
    bin: nha.bank_bin,
    soTk: nha.bank_account_no ?? "",
    chuTk: nha.bank_account_name ?? "",
    momoSdt: nha.momo_phone ?? "",
    momoTen: nha.momo_name ?? "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(nha.name);
    setAddress(nha.address ?? "");
    setDien(nha.electricity_rate);
    setNuoc(nha.water_rate);
    setBank({
      bin: nha.bank_bin,
      soTk: nha.bank_account_no ?? "",
      chuTk: nha.bank_account_name ?? "",
      momoSdt: nha.momo_phone ?? "",
      momoTen: nha.momo_name ?? "",
    });
  }, [nha]);

  async function save() {
    setBusy(true);

    await onSave(nha.id, {
      name,
      address: address || null,
      electricity_rate: Number(dien),
      water_rate: Number(nuoc),
      bank_bin: bank.bin || null,
      bank_account_no: bank.soTk || null,
      bank_account_name: bank.chuTk || null,
      momo_phone: bank.momoSdt || null,
      momo_name: bank.momoTen || null,
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
