import { ActionIcon, Button, Group, Popover, SimpleGrid, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { currentPeriod, periodLabel } from "../format";

/**
 * Picks a billing period (`YYYY-MM`).
 *
 * This was `<TextInput type="month">`. Convenient, but `month` is not an input
 * type every browser implements, and the HTML spec says an unsupported `type`
 * falls back to **Text** — so where it is unsupported the manager gets a bare
 * box and has to type `2026-08` by hand, with a wrong guess coming back as
 * `INVALID_PERIOD` from the server. A control the whole app depends on should
 * not be optional browser functionality.
 *
 * Built here instead of pulling in `@mantine/dates`, which brings dayjs with
 * it: this needs one month and one year, not date ranges, times or locales.
 *
 * The arrows are the point. Stepping to the previous period is what the manager
 * actually does — read the meters, look at last month — and a native picker
 * makes that two interactions and a dropdown. The grid behind the label covers
 * jumping further back.
 */

/** `YYYY-MM` plus or minus n months, without going through Date. */
export function shiftPeriod(period: string, delta: number): string {
  const [year, month] = period.split("-").map(Number);
  // Zero-based month arithmetic, so a January step back lands on December of
  // the previous year rather than month 0.
  const total = year! * 12 + (month! - 1) + delta;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function PeriodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (period: string) => void;
}) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);

  // The year the grid is showing, which is not the selected year once the
  // manager pages back through it without picking anything.
  const [viewYear, setViewYear] = useState(() => Number(value.split("-")[0]));

  const currentYear = Number(currentPeriod().split("-")[0]);
  const selectedMonth = value.split("-")[1];
  const selectedYear = Number(value.split("-")[0]);

  function pick(month: number) {
    onChange(`${viewYear}-${String(month).padStart(2, "0")}`);
    setOpened(false);
  }

  return (
    <div>
      <Group gap={4} wrap="nowrap">
        <ActionIcon
          variant="default"
          size="lg"
          aria-label={t("period.previous")}
          onClick={() => onChange(shiftPeriod(value, -1))}
        >
          <IconChevronLeft size={16} stroke={1.8} />
        </ActionIcon>

        <Popover
          opened={opened}
          onChange={setOpened}
          position="bottom"
          withArrow
          shadow="md"
          trapFocus
        >
          <Popover.Target>
            <Button
              variant="default"
              onClick={() => {
                // Always reopen on the selected year, not wherever the grid was
                // left last time.
                setViewYear(selectedYear);
                setOpened((o) => !o);
              }}
              style={{ minWidth: 132 }}
            >
              {periodLabel(value)}
            </Button>
          </Popover.Target>

          <Popover.Dropdown>
            <Group justify="space-between" wrap="nowrap" mb="xs">
              <ActionIcon
                variant="subtle"
                aria-label={t("period.previousYear")}
                onClick={() => setViewYear((y) => y - 1)}
              >
                <IconChevronLeft size={16} stroke={1.8} />
              </ActionIcon>

              <Text fw={600}>{viewYear}</Text>

              <ActionIcon
                variant="subtle"
                aria-label={t("period.nextYear")}
                onClick={() => setViewYear((y) => y + 1)}
              >
                <IconChevronRight size={16} stroke={1.8} />
              </ActionIcon>
            </Group>

            <SimpleGrid cols={3} spacing={4}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const isSelected = viewYear === selectedYear && String(month).padStart(2, "0") === selectedMonth;

                return (
                  <Button
                    key={month}
                    size="xs"
                    variant={isSelected ? "filled" : "subtle"}
                    color={isSelected ? "settled" : "gray"}
                    onClick={() => pick(month)}
                  >
                    {t("period.monthShort", { month })}
                  </Button>
                );
              })}
            </SimpleGrid>

            {viewYear !== currentYear && (
              <Button
                fullWidth
                mt="xs"
                size="xs"
                variant="light"
                onClick={() => {
                  onChange(currentPeriod());
                  setOpened(false);
                }}
              >
                {t("period.thisMonth")}
              </Button>
            )}
          </Popover.Dropdown>
        </Popover>

        <ActionIcon
          variant="default"
          size="lg"
          aria-label={t("period.next")}
          onClick={() => onChange(shiftPeriod(value, 1))}
        >
          <IconChevronRight size={16} stroke={1.8} />
        </ActionIcon>
      </Group>
    </div>
  );
}
