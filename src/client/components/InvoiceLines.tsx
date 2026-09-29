import { Card, Divider, Group, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { InvoiceDetail } from "../../shared/types";
import { money } from "../format";

function Line({ label, note, value }: { label: string; note?: string; value: number }) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <div>
        <Text>{label}</Text>
        {note && (
          <Text size="xs" c="dimmed">
            {note}
          </Text>
        )}
      </div>
      <Text ta="right">{money(value)}</Text>
    </Group>
  );
}

/** The invoice breakdown, shared by the manager and tenant views. */
export function InvoiceLines({ invoice }: { invoice: InvoiceDetail }) {
  const { t } = useTranslation();

  const electricityUsed = invoice.reading
    ? invoice.reading.electricity_end - invoice.reading.electricity_start
    : null;
  const waterUsed = invoice.reading
    ? invoice.reading.water_end - invoice.reading.water_start
    : null;

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Line label={t("invoice.rent")} value={invoice.rent_amount} />
        <Line
          label={t("invoice.electricity")}
          note={
            electricityUsed === null
              ? t("invoice.unitPrice", { price: money(invoice.electricity_rate), unit: "kWh" })
              : t("invoice.meterNote", {
                  start: invoice.reading!.electricity_start,
                  end: invoice.reading!.electricity_end,
                  used: electricityUsed,
                  unit: "kWh",
                  price: money(invoice.electricity_rate),
                })
          }
          value={invoice.electricity_amount}
        />
        <Line
          label={t("invoice.water")}
          note={
            waterUsed === null
              ? t("invoice.unitPrice", { price: money(invoice.water_rate), unit: "m³" })
              : t("invoice.meterNote", {
                  start: invoice.reading!.water_start,
                  end: invoice.reading!.water_end,
                  used: waterUsed,
                  unit: "m³",
                  price: money(invoice.water_rate),
                })
          }
          value={invoice.water_amount}
        />
        {invoice.other_fees > 0 && (
          <Line label={t("invoice.otherFees")} value={invoice.other_fees} />
        )}

        <Divider />

        <Group justify="space-between">
          <Text fw={600}>{t("invoice.total")}</Text>
          <Text fw={700} size="lg">
            {money(invoice.total)}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text c="dimmed">{t("invoice.collected")}</Text>
          <Text c="dimmed">{money(invoice.paid)}</Text>
        </Group>
        {invoice.outstanding > 0 && (
          <Group justify="space-between">
            <Text c="orange" fw={500}>
              {t("invoice.outstanding")}
            </Text>
            <Text c="orange" fw={600}>
              {money(invoice.outstanding)}
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
