import { Card, Divider, Group, Stack, Text } from "@mantine/core";

import type { InvoiceDetail } from "../../shared/types";
import { tien } from "../format";

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
      <Text ta="right">{tien(value)}</Text>
    </Group>
  );
}

/** The invoice breakdown, shared by the manager and tenant views. */
export function InvoiceLines({ invoice }: { invoice: InvoiceDetail }) {
  const soDien = invoice.reading ? invoice.reading.electricity_end - invoice.reading.electricity_start : null;
  const soNuoc = invoice.reading ? invoice.reading.water_end - invoice.reading.water_start : null;

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Line label="Tiền phòng" value={invoice.rent_amount} />
        <Line
          label="Tiền điện"
          note={
            soDien === null
              ? `đơn giá ${tien(invoice.electricity_rate)}/kWh`
              : `${invoice.reading!.electricity_start} → ${invoice.reading!.electricity_end} = ${soDien} kWh × ${tien(invoice.electricity_rate)}`
          }
          value={invoice.electricity_amount}
        />
        <Line
          label="Tiền nước"
          note={
            soNuoc === null
              ? `đơn giá ${tien(invoice.water_rate)}/m³`
              : `${invoice.reading!.water_start} → ${invoice.reading!.water_end} = ${soNuoc} m³ × ${tien(invoice.water_rate)}`
          }
          value={invoice.water_amount}
        />
        {invoice.other_fees > 0 && <Line label="Phí khác" value={invoice.other_fees} />}

        <Divider />

        <Group justify="space-between">
          <Text fw={600}>Tổng cộng</Text>
          <Text fw={700} size="lg">
            {tien(invoice.total)}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text c="dimmed">Đã thu</Text>
          <Text c="dimmed">{tien(invoice.paid)}</Text>
        </Group>
        {invoice.outstanding > 0 && (
          <Group justify="space-between">
            <Text c="orange" fw={500}>
              Còn lại
            </Text>
            <Text c="orange" fw={600}>
              {tien(invoice.outstanding)}
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
