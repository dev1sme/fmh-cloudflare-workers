import { Card, Group, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { BankTransfer, MomoInfo } from "../../shared/types";
import { BankTransferDetails } from "./BankTransferDetails";
import { MomoDetails } from "./MomoDetails";

type Method = "bank" | "momo";

/**
 * Every way to pay one invoice, in one card.
 *
 * Bank transfer and MoMo used to be two cards stacked one after the other,
 * which put the MoMo details a full screen below the QR on a phone — and a
 * tenant pays by one method, not both. With both configured they are two tabs
 * of the same card, bank first; with one, there is no switch at all.
 *
 * Renders nothing when neither exists: the server leaves both null once the
 * invoice is paid or cancelled, so a settled invoice shows no QR to pay again.
 *
 * `id` is the scroll target for the "Thanh toán ngay" button on the tenant's
 * status panel.
 */
export function PaymentMethods({
  transfer,
  momo,
  preview = false,
  id,
}: {
  transfer: BankTransfer | null;
  momo: MomoInfo | null;
  preview?: boolean;
  id?: string;
}) {
  const { t } = useTranslation();
  const [method, setMethod] = useState<Method>(transfer ? "bank" : "momo");

  if (!transfer && !momo) return null;

  const shown: Method = transfer && momo ? method : transfer ? "bank" : "momo";

  return (
    <Card withBorder padding="lg" id={id} style={{ scrollMarginTop: 16 }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <div>
            <Title order={4}>{preview ? t("payment.previewTitle") : t("payment.payTitle")}</Title>
            {preview && (
              <Text size="xs" c="dimmed">
                {t("payment.previewNote")}
              </Text>
            )}
          </div>

          {transfer && momo && (
            <SegmentedControl
              value={method}
              onChange={(value) => setMethod(value as Method)}
              data={[
                { value: "bank", label: t("payment.methodBank") },
                { value: "momo", label: t("payment.methodMomo") },
              ]}
              aria-label={t("payment.methodLabel")}
            />
          )}
        </Group>

        {shown === "bank" && transfer && <BankTransferDetails transfer={transfer} preview={preview} />}
        {shown === "momo" && momo && <MomoDetails momo={momo} preview={preview} />}
      </Stack>
    </Card>
  );
}
