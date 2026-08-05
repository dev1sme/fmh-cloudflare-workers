import { TextInput } from "@mantine/core";

/** Native month input — its value is already `YYYY-MM`, the format the API wants. */
export function PeriodPicker({
  value,
  onChange,
  label = "Kỳ",
}: {
  value: string;
  onChange: (period: string) => void;
  label?: string;
}) {
  return (
    <TextInput
      type="month"
      label={label}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      w={160}
    />
  );
}
