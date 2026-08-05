import { Card, Group, Text } from "@mantine/core";
import type { ReactNode } from "react";

/** One headline number. `hint` carries the comparison or the breakdown. */
export function StatCard({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  color?: string;
}) {
  return (
    <Card withBorder padding="md" radius="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Group gap="xs" align="baseline" mt={4} wrap="nowrap">
        <Text fz={26} fw={700} c={color} lh={1.2}>
          {value}
        </Text>
      </Group>
      {hint && (
        <Text size="sm" c="dimmed" mt={4}>
          {hint}
        </Text>
      )}
    </Card>
  );
}
