import { Text } from "@mantine/core";

/** Consumption between two meter numbers, never negative while typing. */
export function Consumption({ from, to, unit }: { from: number; to: number; unit: string }) {
  return (
    <Text span fw={600}>
      {Math.max(0, to - from)} {unit}
    </Text>
  );
}
