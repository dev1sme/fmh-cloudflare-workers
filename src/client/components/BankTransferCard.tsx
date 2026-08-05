import { Card, CopyButton, Group, Stack, Text } from "@mantine/core";

import type { BankTransfer } from "../../shared/types";
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
 *
 * The tenant sees this to pay. The manager sees the same card in `xemTruoc`
 * mode, purely to check what the tenant is looking at — the manager never pays
 * their own invoice.
 */
export function BankTransferCard({
  chuyenKhoan,
  xemTruoc = false,
}: {
  chuyenKhoan: BankTransfer;
  xemTruoc?: boolean;
}) {
  return (
    <Card withBorder padding="md">
      <Stack>
        <div>
          <Text fw={500}>
            {xemTruoc ? "Mã QR người thuê nhìn thấy" : "Quét mã để chuyển khoản"}
          </Text>
          {xemTruoc && (
            <Text size="xs" c="dimmed">
              Xem trước để đối chiếu. Người thuê quét mã này trong tài khoản phòng.
            </Text>
          )}
        </div>

        <Group align="flex-start" wrap="wrap" gap="lg">
          <VietQR payload={chuyenKhoan.vietqr} />

          <Stack gap="xs" flex={1} miw={220}>
            <Dong label="Số tài khoản" value={chuyenKhoan.bank_account_no} />
            {chuyenKhoan.bank_account_name && <Dong label="Chủ tài khoản" value={chuyenKhoan.bank_account_name} />}
            <Dong label="Số tiền" value={tien(chuyenKhoan.amount)} />
            <Dong label="Nội dung" value={chuyenKhoan.transfer_note} />

            {!xemTruoc && (
              <Text size="xs" c="dimmed" mt="xs">
                Giữ nguyên nội dung <b>{chuyenKhoan.transfer_note}</b> khi chuyển khoản để đối chiếu
                đúng hóa đơn. Mã QR đã điền sẵn số tiền và nội dung.
              </Text>
            )}
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
}
