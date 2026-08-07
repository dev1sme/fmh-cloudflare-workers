import { Button, Group, Modal, NumberInput, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BuildingInput } from "../../../api";
import { dauPhanCach } from "../../../format";

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
  const { t } = useTranslation();

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
    <Modal opened={opened} onClose={onClose} title={t("settings.addBuilding")}>
      <Stack>
        <TextInput
          label={t("settings.buildingName")}
          placeholder="FMH 2"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />
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
        <Button onClick={save} loading={busy}>
          {t("settings.addBuilding")}
        </Button>
      </Stack>
    </Modal>
  );
}
