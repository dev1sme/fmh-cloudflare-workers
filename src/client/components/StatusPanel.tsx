import { Box, Group, Stack, Text } from "@mantine/core";
import { IconCircleCheck } from "@tabler/icons-react";
import type { ReactNode } from "react";

/**
 * The headline block of a screen: one figure, filled by its state.
 *
 * `owed` fills amber, `settled` fills green (`.fmh-status` in `theme.css`), so
 * the answer — is money still owed — reads from across the room before the
 * number does. Used once per screen at most: two of these would compete for
 * the same glance.
 *
 * `neutral` is for a figure that is neither owed nor collected — a period with
 * nothing invoiced yet. Green there would say "all paid", which is not true of
 * a bill that was never issued.
 */
export function StatusPanel({
  tone,
  label,
  value,
  hint,
  children,
}: {
  tone: "owed" | "settled" | "neutral";
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** Actions or a progress bar, under the figure. */
  children?: ReactNode;
}) {
  return (
    <Box className="fmh-status" data-tone={tone}>
      <Stack gap={6}>
        <Group gap={8} wrap="nowrap">
          {tone !== "settled" ? (
            <span className="fmh-status-dot" aria-hidden="true" />
          ) : (
            <Box c="settled" display="flex" aria-hidden="true">
              <IconCircleCheck size={18} stroke={2} />
            </Box>
          )}
          <Text size="sm" fw={600} c={tone === "neutral" ? "dimmed" : tone}>
            {label}
          </Text>
        </Group>

        <Text className="fmh-display" component="div">
          {value}
        </Text>

        {hint && (
          <Text size="sm" c="dimmed">
            {hint}
          </Text>
        )}

        {children && <Box mt="sm">{children}</Box>}
      </Stack>
    </Box>
  );
}
