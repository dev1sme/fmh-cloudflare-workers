import { Card, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { Link } from "react-router-dom";

import type { InvoiceWithRoom } from "../../../../shared/types";
import { CollectionBar } from "../../../components/CollectionBar";
import { tien } from "../../../format";

/**
 * The invoice list on a phone.
 *
 * The table has nine columns; on a 390px screen that is a sideways scroll
 * through numbers with the room name off-screen, which defeats the point of
 * putting them in columns. Each invoice becomes one card instead, carrying the
 * three facts that matter — room, total, how much is collected — with the
 * breakdown a tap away.
 */
export function InvoiceCards({ hoaDon }: { hoaDon: InvoiceWithRoom[] }) {
  return (
    <Stack gap="xs">
      {hoaDon.map((invoice) => (
        <Card key={invoice.id} padding={0}>
          <UnstyledButton
            component={Link}
            to={`/invoices/${invoice.code}`}
            className="fmh-row-link"
            style={{ display: "block", padding: "14px" }}
          >
            <Stack gap="xs">
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <div style={{ minWidth: 0 }}>
                  <Text fw={700}>{invoice.room_name}</Text>
                  <Text size="xs" c="dimmed">
                    {invoice.code}
                  </Text>
                </div>
                <Group gap="xs" wrap="nowrap">
                  <Text fw={700} className="fmh-num">
                    {tien(invoice.total)}
                  </Text>
                  <IconChevronRight size={16} stroke={1.8} opacity={0.5} />
                </Group>
              </Group>

              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Text size="xs" c="dimmed">
                  Phòng {tien(invoice.rent_amount)} · Điện {tien(invoice.electricity_amount)} · Nước{" "}
                  {tien(invoice.water_amount)}
                </Text>
              </Group>

              <CollectionBar total={invoice.total} paid={invoice.paid} status={invoice.status} />
            </Stack>
          </UnstyledButton>
        </Card>
      ))}
    </Stack>
  );
}
