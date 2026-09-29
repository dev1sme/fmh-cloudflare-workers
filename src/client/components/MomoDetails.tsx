import { Stack, Text } from "@mantine/core";
import { Trans, useTranslation } from "react-i18next";

import type { MomoInfo } from "../../shared/types";
import { money } from "../format";
import { CopyableRow } from "./CopyableRow";

/**
 * MoMo as an alternative to the bank transfer. Text only, deliberately: MoMo's
 * personal QR payload is not a verified format, and a wrong guess would produce
 * a code that pays the wrong wallet.
 *
 * Rendered inside `PaymentMethods`, which owns the card and the title.
 */
export function MomoDetails({ momo, preview = false }: { momo: MomoInfo; preview?: boolean }) {
  const { t } = useTranslation();

  return (
    <Stack gap="xs">
      <CopyableRow label={t("payment.momoPhone")} value={momo.phone} />
      {momo.name && <CopyableRow label={t("payment.momoReceiver")} value={momo.name} />}
      <CopyableRow
        label={t("payment.amount")}
        value={String(momo.amount)}
        display={money(momo.amount)}
      />
      <CopyableRow label={t("payment.memo")} value={momo.transfer_note} />

      {!preview && (
        <Text size="xs" c="dimmed" mt="xs">
          <Trans
            i18nKey="payment.momoHowTo"
            values={{ memo: momo.transfer_note }}
            components={{ b: <b /> }}
          />
        </Text>
      )}
    </Stack>
  );
}
