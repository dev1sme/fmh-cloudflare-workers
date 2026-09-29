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
 * `value` is the display figure; pass a string with the currency split off via
 * `unit` so the unit renders smaller than the digits.
 */
export function StatusPanel({
  tone,
  label,
  value,
  unit,
  hint,
  children,
}: {
  tone: "owed" | "settled";
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  /** Actions or a progress bar, under the figure. */
  children?: ReactNode;
}) {
  return (
    <Box className="fmh-status" data-tone={tone}>
      <Stack gap={6}>
        <Group gap={8} wrap="nowrap">
          {tone === "owed" ? (
            <span className="fmh-status-dot" aria-hidden="true" />
          ) : (
            <Box c="settled" display="flex" aria-hidden="true">
              <IconCircleCheck size={18} stroke={2} />
            </Box>
          )}
          <Text size="sm" fw={600} c={tone}>
            {label}
          </Text>
        </Group>

        <Text className="fmh-display" component="div">
          {value}
          {unit && <span className="fmh-display-unit">{unit}</span>}
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
