import { Card, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { CopyableRow } from "../../../components/CopyableRow";

/**
 * Fallback when the building has no bank details yet, so no VietQR code can be
 * built. The invoice code still has to reach the manager somehow — and it is
 * still the thing a tenant would otherwise retype by hand, so it gets the same
 * copy button as the full card.
 */
export function TransferInstructions({ invoiceCode }: { invoiceCode: string }) {
  const { t } = useTranslation();

  return (
    <Card withBorder padding="md">
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          {t("payment.noBankYet")}
        </Text>
        <CopyableRow label={t("payment.memo")} value={invoiceCode} />
      </Stack>
    </Card>
  );
}
