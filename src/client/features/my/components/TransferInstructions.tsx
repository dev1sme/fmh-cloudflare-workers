import { Card, Text } from "@mantine/core";

/**
 * Fallback when the building has no bank details yet, so no VietQR code can be
 * built. The invoice code still has to reach the manager somehow.
 */
export function TransferInstructions({ maHoaDon }: { maHoaDon: string }) {
  return (
    <Card withBorder padding="md">
      <Text size="sm" c="dimmed">
        Chủ nhà chưa cấu hình tài khoản nhận tiền nên chưa có mã QR. Khi chuyển khoản, ghi nội dung{" "}
        <b>{maHoaDon}</b> để đối chiếu.
      </Text>
    </Card>
  );
}
