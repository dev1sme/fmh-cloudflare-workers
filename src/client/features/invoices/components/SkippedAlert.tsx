import { Alert, List } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import type { GenerateResult } from "../../../../shared/types";

const REASON_KEYS = {
  MISSING_READING: "invoices.skipMissingReading",
  ALREADY_INVOICED: "invoices.skipAlreadyInvoiced",
} as const satisfies Record<GenerateResult["skipped"][number]["reason"], string>;

/** Rooms that generation deliberately passed over, so nothing looks missing. */
export function SkippedAlert({
  skipped,
  onClose,
}: {
  skipped: GenerateResult["skipped"];
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (skipped.length === 0) return null;

  return (
    <Alert
      color="gray"
      icon={<IconAlertTriangle size={18} stroke={1.8} />}
      title={t("invoices.skippedTitle")}
      withCloseButton
      onClose={onClose}
    >
      <List size="sm">
        {skipped.map((item) => (
          <List.Item key={item.room_id}>
            {item.room_name} — {t(REASON_KEYS[item.reason])}
          </List.Item>
        ))}
      </List>
    </Alert>
  );
}
