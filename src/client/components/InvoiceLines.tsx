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
  const soDien = invoice.reading ? invoice.reading.dien_moi - invoice.reading.dien_cu : null;
  const soNuoc = invoice.reading ? invoice.reading.nuoc_moi - invoice.reading.nuoc_cu : null;

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Line label="Tiền phòng" value={invoice.tien_phong} />
        <Line
          label="Tiền điện"
          note={
            soDien === null
              ? `đơn giá ${tien(invoice.don_gia_dien)}/kWh`
              : `${invoice.reading!.dien_cu} → ${invoice.reading!.dien_moi} = ${soDien} kWh × ${tien(invoice.don_gia_dien)}`
          }
          value={invoice.tien_dien}
        />
        <Line
          label="Tiền nước"
          note={
            soNuoc === null
              ? `đơn giá ${tien(invoice.don_gia_nuoc)}/m³`
              : `${invoice.reading!.nuoc_cu} → ${invoice.reading!.nuoc_moi} = ${soNuoc} m³ × ${tien(invoice.don_gia_nuoc)}`
          }
          value={invoice.tien_nuoc}
        />
        {invoice.phi_khac > 0 && <Line label="Phí khác" value={invoice.phi_khac} />}

        <Divider />

        <Group justify="space-between">
          <Text fw={600}>Tổng cộng</Text>
          <Text fw={700} size="lg">
            {tien(invoice.tong_tien)}
          </Text>
        </Group>
        <Group justify="space-between">
          <Text c="dimmed">Đã thu</Text>
          <Text c="dimmed">{tien(invoice.da_thu)}</Text>
        </Group>
        {invoice.con_lai > 0 && (
          <Group justify="space-between">
            <Text c="orange" fw={500}>
              Còn lại
            </Text>
            <Text c="orange" fw={600}>
              {tien(invoice.con_lai)}
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
