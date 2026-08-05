import { Card, Stack, Text } from "@mantine/core";

import { CopyableRow } from "../../../components/CopyableRow";

/**
 * Fallback when the building has no bank details yet, so no VietQR code can be
 * built. The invoice code still has to reach the manager somehow — and it is
 * still the thing a tenant would otherwise retype by hand, so it gets the same
 * copy button as the full card.
 */
export function TransferInstructions({ maHoaDon }: { maHoaDon: string }) {
  return (
    <Card withBorder padding="md">
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          Chủ nhà chưa cấu hình tài khoản nhận tiền nên chưa có mã QR. Khi chuyển khoản, ghi nội
          dung dưới đây để đối chiếu.
        </Text>
        <CopyableRow label="Nội dung" value={maHoaDon} />
      </Stack>
    </Card>
  );
}
