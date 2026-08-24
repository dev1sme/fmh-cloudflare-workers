import { Stack, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

/**
 * What a screen says when it has nothing to show.
 *
 * The tables it replaces rendered a header row over an empty body — six column
 * labels and no rows, which reads as "loading finished and there is nothing to
 * see" only if you already know the app. A fresh install showed exactly that on
 * /rooms, /readings and Cài đặt, with no clue that a building has to exist
 * first.
 *
 * Three parts, all deliberate:
 *
 * - `title` names the state ("Chưa có phòng nào") — the fact.
 * - `hint` says what to do about it, and is where the useful half lives. A
 *   title alone is what the bare `<Text c="dimmed">` already did.
 * - `action` is the way to do it. Optional, because some empty states are not
 *   the manager's to fix from here.
 *
 * Deliberately quiet: dimmed icon, no illustration, no card. This is a tool
 * opened twenty times a day, and an empty period on /invoices is a normal
 * mid-month state, not a problem to dramatise.
 */
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <Stack align="center" gap="xs" py="xl" px="md">
      <ThemeIcon size={44} radius="xl" variant="light" color="gray">
        {icon}
      </ThemeIcon>

      <Text fw={500} ta="center">
        {title}
      </Text>

      {hint && (
        <Text size="sm" c="dimmed" ta="center" maw={420}>
          {hint}
        </Text>
      )}

      {action && <div style={{ marginTop: "var(--mantine-spacing-xs)" }}>{action}</div>}
    </Stack>
  );
}
