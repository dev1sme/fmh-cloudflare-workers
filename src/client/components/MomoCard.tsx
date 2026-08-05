import { Card, CopyButton, Group, Stack, Text } from "@mantine/core";

import type { MomoInfo } from "../../shared/types";
import { tien } from "../format";

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
 * MoMo as an alternative to the bank transfer. Text only, deliberately: MoMo's
 * personal QR payload is not a verified format, and a wrong guess would produce
 * a code that pays the wrong wallet.
 */
export function MomoCard({ momo, xemTruoc = false }: { momo: MomoInfo; xemTruoc?: boolean }) {
  return (
    <Card withBorder padding="md">
      <Stack gap="xs">
        <div>
          <Text fw={500}>Hoặc chuyển qua MoMo</Text>
          {xemTruoc && (
            <Text size="xs" c="dimmed">
              Xem trước để đối chiếu.
            </Text>
          )}
        </div>

        <Dong label="Số điện thoại" value={momo.phone} />
        {momo.name && <Dong label="Người nhận" value={momo.name} />}
        <Dong label="Số tiền" value={tien(momo.amount)} />
        <Dong label="Nội dung" value={momo.transfer_note} />

        {!xemTruoc && (
          <Text size="xs" c="dimmed" mt="xs">
            Mở app MoMo, chọn Chuyển tiền tới số điện thoại trên, ghi nội dung{" "}
            <b>{momo.transfer_note}</b>.
          </Text>
        )}
      </Stack>
    </Card>
  );
}
