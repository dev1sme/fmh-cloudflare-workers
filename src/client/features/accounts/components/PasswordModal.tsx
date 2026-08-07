import { Alert, Button, Code, CopyButton, Group, Modal, Stack, Text } from "@mantine/core";

import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <Modal
      opened={ketQua !== null}
      onClose={onClose}
      title={t("accounts.newPasswordTitle")}
      centered
      closeOnClickOutside={false}
    >
      <Stack>
        <Text size="sm">
          {t("accounts.forAccount")} <b>{ketQua?.account.username}</b>
          {ketQua?.account.room_name
            ? t("accounts.forRoom", { room: ketQua.account.room_name })
            : t("accounts.forManager")}
        </Text>

        <Code block fz="lg" ta="center" py="md">
          {ketQua?.password}
        </Code>

        <Alert color="yellow" variant="light">
          {t("accounts.shownOnce")}
        </Alert>

        <Group justify="flex-end">
          <CopyButton value={ketQua?.password ?? ""}>
            {({ copied, copy }) => (
              <Button variant="light" color={copied ? "teal" : undefined} onClick={copy}>
                {copied ? t("common.copied") : t("accounts.copyPassword")}
              </Button>
            )}
          </CopyButton>
          <Button onClick={onClose}>{t("accounts.savedIt")}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
