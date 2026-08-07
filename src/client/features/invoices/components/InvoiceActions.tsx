import { Button, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

export function InvoiceActions({
  daHuy,
  onCancel,
  onDelete,
}: {
  daHuy: boolean;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Group>
      {!daHuy && (
        <Button variant="light" color="orange" onClick={onCancel}>
          {t("invoices.cancel")}
        </Button>
      )}
      <Button variant="subtle" color="red" onClick={onDelete}>
        {t("invoices.delete")}
      </Button>
    </Group>
  );
}
