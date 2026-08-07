import { Card, Stack, Text } from "@mantine/core";
import { Trans, useTranslation } from "react-i18next";

import type { MomoInfo } from "../../shared/types";
import { tien } from "../format";
import { CopyableRow } from "./CopyableRow";

/**
 * MoMo as an alternative to the bank transfer. Text only, deliberately: MoMo's
 * personal QR payload is not a verified format, and a wrong guess would produce
 * a code that pays the wrong wallet.
 */
export function MomoCard({ momo, xemTruoc = false }: { momo: MomoInfo; xemTruoc?: boolean }) {
  const { t } = useTranslation();

  return (
    <Card withBorder padding="md">
      <Stack gap="xs">
        <div>
          <Text fw={500}>{t("payment.momoTitle")}</Text>
          {xemTruoc && (
            <Text size="xs" c="dimmed">
              {t("payment.previewShort")}
            </Text>
          )}
        </div>

        <CopyableRow label={t("payment.momoPhone")} value={momo.phone} />
        {momo.name && <CopyableRow label={t("payment.momoReceiver")} value={momo.name} />}
        <CopyableRow
          label={t("payment.amount")}
          value={String(momo.amount)}
          display={tien(momo.amount)}
        />
        <CopyableRow label={t("payment.memo")} value={momo.transfer_note} />

        {!xemTruoc && (
          <Text size="xs" c="dimmed" mt="xs">
            <Trans
              i18nKey="payment.momoHowTo"
              values={{ memo: momo.transfer_note }}
              components={{ b: <b /> }}
            />
          </Text>
        )}
      </Stack>
    </Card>
  );
}
