import { Group, Text } from "@mantine/core";
import type { ReactNode } from "react";

/**
 * One labelled fact inside a card, for the phone layouts that replace a table.
 *
 * A table puts its label in a column header once and repeats only values. A
 * card has no header, so each value has to carry its own label or it becomes an
 * unexplained number — which is exactly what a `320 → 415` cell looks like once
 * the "Điện" header is gone.
 *
 * The value is a `ReactNode`, not a string: several of these hold a `Badge`.
 */
export function CardField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm" align="baseline">
      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Text size="sm" component="div" ta="right" style={{ minWidth: 0 }}>
        {children}
      </Text>
    </Group>
  );
}
