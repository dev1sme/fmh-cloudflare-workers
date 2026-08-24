import { Card, Group, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * One headline number. `hint` carries the comparison or the breakdown.
 *
 * `to`, given, makes the whole card a link (`fmh-row-link` for the same hover
 * feedback `InvoiceCards` uses) instead of a static figure. The one caller that
 * uses it is "Chưa nhập chỉ số" pointing at `/readings` for the same period —
 * the count was previously informational only, so getting there meant
 * remembering to open Chỉ số điện nước and reselect the month by hand.
 */
export function StatCard({
  label,
  value,
  hint,
  color,
  icon,
  to,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  color?: string;
  icon?: ReactNode;
  to?: string;
}) {
  const content = (
    <>
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
    </>
  );

  // Two branches rather than `component={to ? Link : undefined}`: Card is
  // polymorphic on `component`, so `to` only type-checks when `component` is
  // statically `Link`, not a union that includes `undefined`.
  return to ? (
    <Card withBorder padding="md" radius="md" component={Link} to={to} className="fmh-row-link">
      {content}
    </Card>
  ) : (
    <Card withBorder padding="md" radius="md">
      {content}
    </Card>
  );
}
