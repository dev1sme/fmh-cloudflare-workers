import { Button, Group, Modal, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

export function ConfirmModal({
  opened,
  title,
  message,
  confirmLabel,
  color = "red",
  busy = false,
  onConfirm,
  onClose,
}: {
  opened: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  color?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered size="sm">
      <Text size="sm">{message}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="subtle" color="gray" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        {/* Default resolved here, not in the signature: a default parameter is
            evaluated once per render but `t` has to be read after the hook. */}
        <Button color={color} onClick={onConfirm} loading={busy}>
          {confirmLabel ?? t("common.confirm")}
        </Button>
      </Group>
    </Modal>
  );
}
