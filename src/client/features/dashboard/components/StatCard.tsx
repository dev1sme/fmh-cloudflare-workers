import { Card, Group, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

/** One headline number. `hint` carries the comparison or the breakdown. */
export function StatCard({
  label,
  value,
  hint,
  color,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <Card withBorder padding="md" radius="md">
      <Group gap="xs" wrap="nowrap">
        {icon && (
          <ThemeIcon variant="transparent" color={color ?? "gray"} size="sm">
            {icon}
          </ThemeIcon>
        )}
        <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.06em" }}>
          {label}
        </Text>
      </Group>
      <Group gap="xs" align="baseline" mt={4} wrap="nowrap">
        <Text fz="1.5rem" fw={700} c={color} lh={1.2} style={{ overflowWrap: "anywhere" }}>
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
