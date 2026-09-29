import { Button, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

export function InvoiceActions({
  cancelled,
  onCancel,
  onDelete,
}: {
  cancelled: boolean;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Group>
      {!cancelled && (
        <Button variant="light" color="red" onClick={onCancel}>
          {t("invoices.cancel")}
        </Button>
      )}
      <Button variant="subtle" color="red" onClick={onDelete}>
        {t("invoices.delete")}
      </Button>
    </Group>
  );
}
