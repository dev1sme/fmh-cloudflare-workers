import { Card, CopyButton, Group, Stack, Text } from "@mantine/core";

import type { ChuyenKhoan } from "../../shared/types";
import { tien } from "../format";
import { VietQR } from "./VietQR";

function Dong({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" gap="xl" wrap="nowrap">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <CopyButton value={value}>
        {({ copied, copy }) => (
          <Text
            size="sm"
            fw={500}
            ta="right"
            style={{ cursor: "pointer" }}
            onClick={copy}
            title="Bấm để copy"
          >
            {copied ? "đã copy" : value}
          </Text>
        )}
      </CopyButton>
    </Group>
  );
}

/**
 * Payment instructions for one invoice: scan the QR, or type the details.
 * The memo carries the invoice code — that is what reconciles the transfer.
 */
export function ChuyenKhoanCard({ chuyenKhoan }: { chuyenKhoan: ChuyenKhoan }) {
  return (
    <Card withBorder padding="md">
      <Stack>
        <Text fw={500}>Quét mã để chuyển khoản</Text>

        <Group align="flex-start" wrap="wrap" gap="lg">
          <VietQR payload={chuyenKhoan.vietqr} />

          <Stack gap="xs" flex={1} miw={220}>
            <Dong label="Số tài khoản" value={chuyenKhoan.bank_so_tk} />
            {chuyenKhoan.bank_chu_tk && <Dong label="Chủ tài khoản" value={chuyenKhoan.bank_chu_tk} />}
            <Dong label="Số tiền" value={tien(chuyenKhoan.so_tien)} />
            <Dong label="Nội dung" value={chuyenKhoan.noi_dung} />

            <Text size="xs" c="dimmed" mt="xs">
              Giữ nguyên nội dung <b>{chuyenKhoan.noi_dung}</b> khi chuyển khoản để đối chiếu đúng
              hóa đơn. Mã QR đã điền sẵn số tiền và nội dung.
            </Text>
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
}
