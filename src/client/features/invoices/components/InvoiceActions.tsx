import { Button, Group } from "@mantine/core";

export function InvoiceActions({
  daHuy,
  onCancel,
  onDelete,
}: {
  daHuy: boolean;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <Group>
      {!daHuy && (
        <Button variant="light" color="orange" onClick={onCancel}>
          Huỷ hóa đơn
        </Button>
      )}
      <Button variant="subtle" color="red" onClick={onDelete}>
        Xoá hóa đơn
      </Button>
    </Group>
  );
}
