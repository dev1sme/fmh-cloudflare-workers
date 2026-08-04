import { Alert, Button, Code, CopyButton, Group, Modal, Stack, Text } from "@mantine/core";

import type { AccountWithPassword } from "../../../api";

/**
 * Shows a freshly created or reset password once.
 *
 * This is the only moment the plaintext exists outside the tenant's hands: it
 * is stored hashed and no endpoint returns it again. Forgotten means reset.
 */
export function PasswordModal({
  ketQua,
  onClose,
}: {
  ketQua: AccountWithPassword | null;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={ketQua !== null}
      onClose={onClose}
      title="Mật khẩu mới"
      centered
      closeOnClickOutside={false}
    >
      <Stack>
        <Text size="sm">
          Tài khoản <b>{ketQua?.account.username}</b>
          {ketQua?.account.ten_phong ? ` — phòng ${ketQua.account.ten_phong}` : " — quản lý"}
        </Text>

        <Code block fz="lg" ta="center" py="md">
          {ketQua?.password}
        </Code>

        <Alert color="yellow" variant="light">
          Mật khẩu chỉ hiện lần này. Hệ thống lưu dạng đã băm nên không xem lại được — quên thì đặt
          lại mật khẩu mới.
        </Alert>

        <Group justify="flex-end">
          <CopyButton value={ketQua?.password ?? ""}>
            {({ copied, copy }) => (
              <Button variant="light" color={copied ? "teal" : undefined} onClick={copy}>
                {copied ? "Đã copy" : "Copy mật khẩu"}
              </Button>
            )}
          </CopyButton>
          <Button onClick={onClose}>Đã lưu lại</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
