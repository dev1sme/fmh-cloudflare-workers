import { Text } from "@mantine/core";

/** Consumption between two meter numbers, never negative while typing. */
export function TieuThu({ cu, moi, donVi }: { cu: number; moi: number; donVi: string }) {
  return (
    <Text span fw={600}>
      {Math.max(0, moi - cu)} {donVi}
    </Text>
  );
}
