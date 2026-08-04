import { Box } from "@mantine/core";
import encodeQR from "@paulmillr/qr";
import { useMemo } from "react";

/**
 * Renders a VietQR payload as an SVG, encoded in the browser — nothing is
 * requested from a QR image service, so no third party sees who owes what.
 */
export function VietQR({ payload, size = 220 }: { payload: string; size?: number }) {
  const svg = useMemo(() => encodeQR(payload, "svg", { border: 1 }), [payload]);

  return (
    <Box
      w={size}
      h={size}
      // The QR must stay dark-on-light in dark mode too, or scanners fail.
      bg="white"
      p="xs"
      style={{ borderRadius: 8 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
