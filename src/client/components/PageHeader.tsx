import { Box, Group, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

/**
 * Title row for a manager screen: the name, one line of context under it, and
 * the screen's controls on the right.
 *
 * The context line is what a bare title never said — which period, how many
 * rooms, how much is still out — so the manager knows what they are looking
 * at before reading the table. Every screen used to hand-roll the same
 * `Group` + `Title order={3}`; this is that, plus the line.
 */
export function PageHeader({
  title,
  context,
  actions,
}: {
  title: ReactNode;
  context?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
      <div style={{ minWidth: 0 }}>
        <Title order={3}>{title}</Title>
        {/* A string is a line of text; anything else (a badge beside a date)
            brings its own layout and must not land inside a <p>. */}
        {typeof context === "string" ? (
          <Text size="sm" c="dimmed" mt={2}>
            {context}
          </Text>
        ) : (
          context && <Box mt={4}>{context}</Box>
        )}
      </div>
      {actions && (
        <Group gap="sm" align="flex-end" wrap="wrap">
          {actions}
        </Group>
      )}
    </Group>
  );
}
