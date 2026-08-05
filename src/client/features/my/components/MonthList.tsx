import { Card, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { Link } from "react-router-dom";

import type { TenantMonth } from "../../../../shared/types";
import { CollectionBar } from "../../../components/CollectionBar";
import { periodLabel, tien } from "../../../format";

const SO = new Intl.NumberFormat("vi-VN");

/**
 * Earlier months, one line each.
 *
 * A list rather than a table: on a phone a seven-column table scrolls
 * sideways, and a tenant reading their own history wants the month and the
 * amount, not a grid to compare rooms with.
 *
 * A month with no invoice yet is not a link — there is nothing to open.
 */
function Dong({ month }: { month: TenantMonth }) {
  const noiDung = (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <div style={{ minWidth: 0 }}>
        <Text fw={600}>{periodLabel(month.period)}</Text>
        <Text size="xs" c="dimmed">
          {month.electricity_used === null
            ? "chưa có chỉ số"
            : `${SO.format(month.electricity_used)} kWh · ${SO.format(month.water_used ?? 0)} m³`}
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
        Các tháng trước
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
