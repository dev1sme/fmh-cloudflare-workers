import { Card, Group, Progress, Stack, Text, Title } from "@mantine/core";
import { IconCircleCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import type { InvoiceDetail } from "../../shared/types";
import { money } from "../format";

function Line({ label, note, value }: { label: string; note?: string; value: number }) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <div>
        <Text fw={500}>{label}</Text>
        {note && (
          <Text size="xs" c="dimmed">
            {note}
          </Text>
        )}
      </div>
      <Text ta="right" className="fmh-num">
        {money(value)}
      </Text>
    </Group>
  );
}

/**
 * How much of the total is in, as one bar and a line under it.
 *
 * Green for what has been collected over an amber track for what is still
 * out, so the remainder is the amber that is left — the same reading as the
 * status panel above it, at the scale of one invoice. A cancelled invoice owed
 * nothing and gets no bar.
 */
function Collected({ invoice }: { invoice: InvoiceDetail }) {
  const { t } = useTranslation();
  if (invoice.status === "CANCELLED") return null;

  const ratio = invoice.total > 0 ? Math.min(100, (invoice.paid / invoice.total) * 100) : 0;
  const settled = invoice.outstanding <= 0;

  return (
    <Stack gap={6}>
      <Progress.Root size={10} radius="xl" style={{ backgroundColor: "var(--fmh-owed-edge)" }}>
        <Progress.Section value={ratio} color="settled" />
      </Progress.Root>
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Text size="sm" c="settled">
          {t("invoice.collected")} {money(invoice.paid)}
        </Text>
        {settled ? (
          <Group gap={4} c="settled" wrap="nowrap">
            <IconCircleCheck size={16} stroke={2} />
            <Text size="sm" fw={600}>
              {t("invoice.collectedAll")}
            </Text>
          </Group>
        ) : (
          <Text size="sm" c="owed" fw={700}>
            {t("invoice.stillOwed", { amount: money(invoice.outstanding) })}
          </Text>
        )}
      </Group>
    </Stack>
  );
}

/**
 * The invoice breakdown, shared by the manager and tenant views, laid out as a
 * receipt: a dashed rule under the heading, a tear-off line above the total.
 *
 * `heading` is the tenant's — their card has no page title above it saying
 * which month this is. The manager's page already names the invoice in its
 * header, so there it is left out rather than said twice.
 */
export function InvoiceLines({
  invoice,
  heading,
}: {
  invoice: InvoiceDetail;
  heading?: string;
}) {
  const { t } = useTranslation();

  const electricityUsed = invoice.reading
    ? invoice.reading.electricity_end - invoice.reading.electricity_start
    : null;
  const waterUsed = invoice.reading
    ? invoice.reading.water_end - invoice.reading.water_start
    : null;

  return (
    <Card withBorder padding="lg">
      <Stack gap="sm">
        {heading && (
          <>
            <Group justify="space-between" align="baseline" wrap="nowrap" gap="sm">
              <Title order={4}>{heading}</Title>
              <Text size="xs" c="dimmed" ff="monospace" style={{ letterSpacing: "0.04em" }}>
                #{invoice.code}
              </Text>
            </Group>
            <hr className="fmh-rule-dashed" />
          </>
        )}

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

        <hr className="fmh-tear" />

        <Group justify="space-between" align="baseline">
          <Text fw={700} size="lg">
            {t("invoice.total")}
          </Text>
          <Text fw={800} fz="xl" className="fmh-num">
            {money(invoice.total)}
          </Text>
        </Group>

        <Collected invoice={invoice} />
      </Stack>
    </Card>
  );
}
