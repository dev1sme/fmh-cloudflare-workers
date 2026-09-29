import { Button, Card, Group, NumberInput, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { separators } from "../../../format";

export function OtherFeesCard({
  otherFees,
  onSave,
}: {
  otherFees: number;
  onSave: (value: number) => Promise<boolean>;
}) {
  const [value, setValue] = useState<number | string>(otherFees);
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => setValue(otherFees), [otherFees]);

  async function save() {
    setBusy(true);
    await onSave(Number(value));
    setBusy(false);
  }

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Text fw={500}>{t("invoice.otherFees")}</Text>
        <Group align="flex-end">
          <NumberInput
            value={value}
            onChange={setValue}
            min={0}
            step={10000}
            {...separators()}
            w={200}
          />
          <Button variant="light" onClick={save} loading={busy}>
            {t("common.save")}
          </Button>
        </Group>
        <Text size="xs" c="dimmed">
          {t("invoices.ratesLocked")}
        </Text>
      </Stack>
    </Card>
  );
}
