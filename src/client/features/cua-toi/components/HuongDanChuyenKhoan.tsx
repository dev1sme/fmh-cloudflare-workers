import { Card, Text } from "@mantine/core";

/**
 * Placeholder until the VietQR code is generated here — the transfer memo is
 * what lets the manager (or the SePay webhook) match a payment to an invoice.
 */
export function HuongDanChuyenKhoan({ maHoaDon }: { maHoaDon: string }) {
  return (
    <Card withBorder padding="md">
      <Text size="sm" c="dimmed">
        Chuyển khoản với nội dung <b>{maHoaDon}</b> để chủ nhà đối chiếu. Mã VietQR sẽ hiển thị ở
        đây sau khi được cấu hình.
      </Text>
    </Card>
  );
}
