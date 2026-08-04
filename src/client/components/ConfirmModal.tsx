import { Button, Group, Modal, Text } from "@mantine/core";

export function ConfirmModal({
  opened,
  title,
  message,
  confirmLabel = "Xác nhận",
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
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered size="sm">
      <Text size="sm">{message}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="subtle" color="gray" onClick={onClose}>
          Huỷ bỏ
        </Button>
        <Button color={color} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
