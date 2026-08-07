import { Alert, List } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { GenerateResult } from "../../../../shared/types";

const LY_DO = {
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
    <Alert color="yellow" title={t("invoices.skippedTitle")} withCloseButton onClose={onClose}>
      <List size="sm">
        {skipped.map((item) => (
          <List.Item key={item.room_id}>
            {item.room_name} — {t(LY_DO[item.reason])}
          </List.Item>
        ))}
      </List>
    </Alert>
  );
}
