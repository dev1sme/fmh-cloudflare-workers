import { Stack, Text } from "@mantine/core";
import { Trans, useTranslation } from "react-i18next";

import type { BankTransfer } from "../../shared/types";
import { money } from "../format";
import { CopyableRow } from "./CopyableRow";
import { VietQR } from "./VietQR";

/**
 * Bank transfer details for one invoice: the QR, then each field to copy.
 * The memo carries the invoice code — that is what reconciles the transfer.
 *
 * The QR sits centred on its own panel, above the fields rather than beside
 * them: it is the first thing a tenant needs, and scanning is easier from a
 * code that is not squeezed into half the card width.
 *
 * Rendered inside `PaymentMethods`, which owns the card and the title. In
 * `preview` mode (the manager checking what the tenant sees) the scan hint
 * and the keep-the-memo note are left out — the manager never pays.
 */
export function BankTransferDetails({
  transfer,
  preview = false,
}: {
  transfer: BankTransfer;
  preview?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Stack
        align="center"
        gap="xs"
        p="md"
        style={{ backgroundColor: "var(--fmh-panel)", borderRadius: "var(--mantine-radius-lg)" }}
      >
        <VietQR payload={transfer.vietqr} />
        {!preview && (
          <Text size="sm" c="dimmed" ta="center">
            {t("payment.scanHint")}
          </Text>
        )}
      </Stack>

      <Stack gap="xs">
        <CopyableRow label={t("payment.accountNo")} value={transfer.bank_account_no} />
        {transfer.bank_account_name && (
          <CopyableRow label={t("payment.accountName")} value={transfer.bank_account_name} />
        )}
        {/* Copy the raw number: a banking app rejects "2.415.000 đ". */}
        <CopyableRow
          label={t("payment.amount")}
          value={String(transfer.amount)}
          display={money(transfer.amount)}
        />
        <CopyableRow label={t("payment.memo")} value={transfer.transfer_note} />
      </Stack>

      {!preview && (
        <Text size="xs" c="dimmed">
          {/* `Trans` rather than `t`, because the memo is bolded inside the
              sentence and the two languages put it in different places. */}
          <Trans
            i18nKey="payment.keepMemo"
            values={{ memo: transfer.transfer_note }}
            components={{ b: <b /> }}
          />
        </Text>
      )}
    </Stack>
  );
}
