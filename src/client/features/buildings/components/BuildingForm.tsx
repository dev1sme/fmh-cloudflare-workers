import { Button, Card, Divider, Group, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Building } from "../../../../shared/types";
import { separators } from "../../../format";
import { BankFields, type BankValue } from "./BankFields";

export function BuildingForm({
  building,
  onSave,
  onDelete,
}: {
  building: Building;
  onSave: (id: number, patch: Partial<Building>) => Promise<boolean>;
  onDelete: (building: Building) => void;
}) {
  const [name, setName] = useState(building.name);
  const [address, setAddress] = useState(building.address ?? "");
  const [electricityRate, setElectricityRate] = useState<number | string>(building.electricity_rate);
  const [waterRate, setWaterRate] = useState<number | string>(building.water_rate);
  const [bank, setBank] = useState<BankValue>({
    bin: building.bank_bin,
    accountNo: building.bank_account_no ?? "",
    accountName: building.bank_account_name ?? "",
    momoPhone: building.momo_phone ?? "",
    momoName: building.momo_name ?? "",
  });
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setName(building.name);
    setAddress(building.address ?? "");
    setElectricityRate(building.electricity_rate);
    setWaterRate(building.water_rate);
    setBank({
      bin: building.bank_bin,
      accountNo: building.bank_account_no ?? "",
      accountName: building.bank_account_name ?? "",
      momoPhone: building.momo_phone ?? "",
      momoName: building.momo_name ?? "",
    });
  }, [building]);

  async function save() {
    setBusy(true);

    await onSave(building.id, {
      name,
      address: address || null,
      electricity_rate: Number(electricityRate),
      water_rate: Number(waterRate),
      bank_bin: bank.bin || null,
      bank_account_no: bank.accountNo || null,
      bank_account_name: bank.accountName || null,
      momo_phone: bank.momoPhone || null,
      momo_name: bank.momoName || null,
    });

    setBusy(false);
  }

  return (
    <Card withBorder padding="md">
      <Stack>
        <TextInput label={t("buildings.buildingName")} value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <TextInput
          label={t("buildings.address")}
          value={address}
          onChange={(e) => setAddress(e.currentTarget.value)}
        />
        <Group grow>
          <NumberInput
            label={t("buildings.electricityRate")}
            value={electricityRate}
            onChange={setElectricityRate}
            min={0}
            step={500}
            {...separators()}
          />
          <NumberInput
            label={t("buildings.waterRate")}
            value={waterRate}
            onChange={setWaterRate}
            min={0}
            step={1000}
            {...separators()}
          />
        </Group>
        <Divider my="xs" />
        <BankFields value={bank} onChange={setBank} />
        <Divider my="xs" />

        <Group justify="space-between">
          <Button onClick={save} loading={busy}>
            {t("common.save")}
          </Button>
          <Button variant="subtle" color="red" onClick={() => onDelete(building)}>
            {t("buildings.deleteBuilding")}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
