import { Box, Group, Text, Tooltip } from "@mantine/core";

import type { InvoiceStatus } from "../../shared/types";
import { tien } from "../format";

/**
 * How much of one invoice has actually been collected.
 *
 * This replaces a status badge on purpose. `CHƯA THANH TOÁN` answers a yes/no
 * question, but the manager's real question is *how much is still out* — an
 * invoice half paid and one untouched are the same badge and very different
 * situations. The bar answers both at once: colour says which state, length
 * says how far along.
 *
 * Cancelled invoices get no bar. Nothing was ever owed, so a progress ratio
 * would be a lie; they get a flat neutral label instead.
 */
export function CollectionBar({
  total,
  paid,
  status,
}: {
  total: number;
  paid: number;
  status: InvoiceStatus;
}) {
  if (status === "CANCELLED") {
    return (
      <Text size="xs" c="dimmed" fw={500}>
        Đã huỷ
      </Text>
    );
  }

  const ratio = total > 0 ? Math.min(1, paid / total) : 0;
  const done = ratio >= 1;
  const outstanding = Math.max(0, total - paid);

  return (
    <Tooltip
      label={done ? "Đã thu đủ" : `Còn ${tien(outstanding)}`}
      withArrow
      position="left"
    >
      <Group gap="xs" wrap="nowrap" style={{ minWidth: 120 }}>
        <Box
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "var(--fmh-rule)",
          }}
        >
          <Box
            style={{
              width: `${ratio * 100}%`,
              height: "100%",
              backgroundColor: done
                ? "var(--mantine-color-settled-6)"
                : "var(--mantine-color-owed-6)",
              // Zero-width bars still need to read as "nothing collected".
              minWidth: ratio > 0 ? 3 : 0,
            }}
          />
        </Box>
        <Text size="xs" c={done ? "settled.6" : "owed.6"} fw={600} style={{ whiteSpace: "nowrap" }}>
          {done ? "đủ" : `${Math.round(ratio * 100)}%`}
        </Text>
      </Group>
    </Tooltip>
  );
}
