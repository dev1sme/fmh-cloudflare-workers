import { Card, Group, Stack, Text, Title } from "@mantine/core";

import { CollectionBar } from "../../../components/CollectionBar";
import { money } from "../../../format";

export type BreakdownRow = {
  key: number;
  name: string;
  meta?: string;
  billed: number;
  collected: number;
};

/**
 * Revenue split one way — by building, or by room — one line per entry.
 *
 * A list rather than a table, for the same reason as the tenant's month list:
 * the question per row is "how much, and is it all in", which is one figure
 * and one `CollectionBar`, not a grid of columns that has to scroll sideways
 * on a phone. The bar is the same one the invoice list uses, so amber-with-a-
 * percentage means the same thing on both screens.
 */
export function BreakdownList({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  return (
    <Card withBorder padding="lg">
      <Title order={5} mb="xs">
        {title}
      </Title>
      <Stack gap={0}>
        {rows.map((row, index) => (
          <Group
            key={row.key}
            justify="space-between"
            wrap="nowrap"
            gap="md"
            py="sm"
            style={{ borderTop: index === 0 ? undefined : "1px solid var(--fmh-rule)" }}
          >
            <div style={{ minWidth: 0 }}>
              <Text fw={600} truncate>
                {row.name}
              </Text>
              {row.meta && (
                <Text size="xs" c="dimmed">
                  {row.meta}
                </Text>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <Text fw={700} className="fmh-num">
                {money(row.billed)}
              </Text>
              <CollectionBar
                total={row.billed}
                paid={row.collected}
                status={row.collected >= row.billed ? "PAID" : "UNPAID"}
              />
            </div>
          </Group>
        ))}
      </Stack>
    </Card>
  );
}
