import { Card, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { Link } from "react-router-dom";

import type { TenantMonth } from "../../../../shared/types";
import { CollectionBar } from "../../../components/CollectionBar";
import { ngay, periodLabel, tien } from "../../../format";

/**
 * Every month besides the one featured above, one line each.
 *
 * Not strictly "earlier": the newest recorded period can end up here too, if
 * it has no invoice yet while an older period is still unpaid and gets
 * featured instead. Hence "khác" rather than "trước" in the heading below.
 *
 * A list rather than a table: on a phone a seven-column table scrolls
 * sideways, and a tenant reading their own history wants the month and the
 * amount, not a grid to compare rooms with.
 *
 * The secondary line shows the meter readings as they were taken (`old →
 * new`), not just the difference — that is what can actually be checked
 * against the dial on the wall. The date drops its year: the period above
 * already carries it, and the row is tight enough that repeating it is
 * wasted width.
 *
 * A month with no invoice yet is not a link — there is nothing to open.
 */
function Dong({ month }: { month: TenantMonth }) {
  const coChiSo = month.electricity_used !== null;

  const noiDung = (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <div style={{ minWidth: 0 }}>
        <Text fw={600}>{periodLabel(month.period)}</Text>
        <Text size="xs" c="dimmed">
          {coChiSo
            ? `${month.electricity_start} → ${month.electricity_end} kWh · ${month.water_start} → ${month.water_end} m³ · ghi ${ngay(month.recorded_on).slice(0, 5)}`
            : "chưa có chỉ số"}
        </Text>
      </div>

      <Group gap="md" wrap="nowrap">
        <div style={{ textAlign: "right" }}>
          <Text fw={700} className="fmh-num">
            {month.total === null ? "—" : tien(month.total)}
          </Text>
          {month.status && (
            <CollectionBar total={month.total ?? 0} paid={month.paid} status={month.status} />
          )}
        </div>
        {month.code && <IconChevronRight size={16} stroke={1.8} opacity={0.5} />}
      </Group>
    </Group>
  );

  if (!month.code) {
    return <div style={{ padding: "12px 14px" }}>{noiDung}</div>;
  }

  return (
    <UnstyledButton
      component={Link}
      to={`/my-invoices/${month.code}`}
      className="fmh-row-link"
      style={{ display: "block", padding: "12px 14px" }}
    >
      {noiDung}
    </UnstyledButton>
  );
}

export function MonthList({ months }: { months: TenantMonth[] }) {
  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.06em" }}>
        Các tháng khác
      </Text>

      <Card padding={0}>
        <Stack gap={0}>
          {months.map((month, i) => (
            <div
              key={month.period}
              style={{ borderTop: i === 0 ? undefined : "1px solid var(--fmh-rule)" }}
            >
              <Dong month={month} />
            </div>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
