import { Card, Group, Stack, Text } from "@mantine/core";
import { Trans, useTranslation } from "react-i18next";

import type { BankTransfer } from "../../shared/types";
import { money } from "../format";
import { CopyableRow } from "./CopyableRow";
import { VietQR } from "./VietQR";

/**
 * Payment instructions for one invoice: scan the QR, or type the details.
 * The memo carries the invoice code — that is what reconciles the transfer.
 *
 * The tenant sees this to pay. The manager sees the same card in `preview`
 * mode, purely to check what the tenant is looking at — the manager never pays
 * their own invoice.
 */
export function BankTransferCard({
  transfer,
  preview = false,
}: {
  transfer: BankTransfer;
  preview?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Card withBorder padding="md">
      <Stack>
        <div>
          <Text fw={500}>{preview ? t("payment.previewTitle") : t("payment.scanToPay")}</Text>
          {preview && (
            <Text size="xs" c="dimmed">
              {t("payment.previewNote")}
            </Text>
          )}
        </div>

        <Group align="flex-start" wrap="wrap" gap="lg">
          <VietQR payload={transfer.vietqr} />

          <Stack gap="xs" flex={1} miw={220}>
            <CopyableRow label={t("payment.accountNo")} value={transfer.bank_account_no} />
            {transfer.bank_account_name && (
              <CopyableRow
                label={t("payment.accountName")}
                value={transfer.bank_account_name}
              />
            )}
            {/* Copy the raw number: a banking app rejects "2.415.000 đ". */}
            <CopyableRow
              label={t("payment.amount")}
              value={String(transfer.amount)}
              display={money(transfer.amount)}
            />
            <CopyableRow label={t("payment.memo")} value={transfer.transfer_note} />

            {!preview && (
              <Text size="xs" c="dimmed" mt="xs">
                {/* `Trans` rather than `t`, because the memo is bolded inside
                    the sentence and the two languages put it in different
                    places. */}
                <Trans
                  i18nKey="payment.keepMemo"
                  values={{ memo: transfer.transfer_note }}
                  components={{ b: <b /> }}
                />
              </Text>
            )}
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
}
