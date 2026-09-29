import { ActionIcon, Group, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

/**
 * `‹ 2026 ›`. The next arrow stops at this year: a future year has nothing in
 * it, and landing on an empty report by one click too many reads as "the data
 * is gone".
 */
export function YearPicker({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (year: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <Group gap={6} wrap="nowrap">
      <ActionIcon
        variant="default"
        size="lg"
        onClick={() => onChange(value - 1)}
        aria-label={t("period.previousYear")}
      >
        <IconChevronLeft size={16} stroke={1.8} />
      </ActionIcon>
      <Text fw={600} className="fmh-num" miw={56} ta="center">
        {value}
      </Text>
      <ActionIcon
        variant="default"
        size="lg"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={t("period.nextYear")}
      >
        <IconChevronRight size={16} stroke={1.8} />
      </ActionIcon>
    </Group>
  );
}
