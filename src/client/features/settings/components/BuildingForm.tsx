import { Button, Card, Divider, Group, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Building } from "../../../../shared/types";
import { dauPhanCach } from "../../../format";
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
  const { t } = useTranslation();

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
        <TextInput label={t("settings.buildingName")} value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <TextInput
          label={t("settings.address")}
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
        />
        <Group grow>
          <NumberInput
            label={t("settings.electricityRate")}
            value={dien}
            onChange={setDien}
            min={0}
            step={500}
            {...dauPhanCach()}
          />
          <NumberInput
            label={t("settings.waterRate")}
            value={nuoc}
            onChange={setNuoc}
            min={0}
            step={1000}
            {...dauPhanCach()}
          />
        </Group>
        <Divider my="xs" />
        <BankFields value={bank} onChange={setBank} />
        <Divider my="xs" />

        <Group justify="space-between">
          <Button onClick={save} loading={busy}>
            {t("common.save")}
          </Button>
          <Button variant="subtle" color="red" onClick={() => onDelete(nha)}>
            {t("settings.deleteBuilding")}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
