import { Button, Group, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BuildingInput } from "../../../api";
import { separators } from "../../../format";

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
  const [electricityRate, setElectricityRate] = useState<number | string>(3000);
  const [waterRate, setWaterRate] = useState<number | string>(15000);
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!opened) return;
    setName("");
    setAddress("");
    setElectricityRate(3000);
    setWaterRate(15000);
  }, [opened]);

  async function save() {
    setBusy(true);

    const ok = await onSubmit({
      name,
      address: address || null,
      electricity_rate: Number(electricityRate),
      water_rate: Number(waterRate),
    });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t("buildings.addBuilding")}>
      <Stack>
        <TextInput
          label={t("buildings.buildingName")}
          placeholder="FMH 2"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />
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
        <Button onClick={save} loading={busy}>
          {t("buildings.addBuilding")}
        </Button>
      </Stack>
    </Modal>
  );
}
