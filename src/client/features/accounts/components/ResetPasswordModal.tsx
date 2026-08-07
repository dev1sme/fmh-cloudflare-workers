import { Button, Modal, PasswordInput, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Account } from "../../../../shared/types";

/** No current password is asked for: the manager resets other people's access. */
export function ResetPasswordModal({
  account,
  onClose,
  onSubmit,
}: {
  account: Account | null;
  onClose: () => void;
  onSubmit: (code: string, password?: string) => Promise<boolean>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (account) setPassword("");
  }, [account]);

  async function submit(tuSinh: boolean) {
    if (!account) return;
    setBusy(true);

    const ok = await onSubmit(account.code, tuSinh ? undefined : password);

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={account !== null}
      onClose={onClose}
      title={t("accounts.resetTitle", { name: account?.username ?? "" })}
    >
      <Stack>
        <Text size="sm" c="dimmed">
          {t("accounts.resetNote")}
        </Text>

        <Button onClick={() => submit(true)} loading={busy}>
          {t("accounts.generateRandom")}
        </Button>

        <PasswordInput
          label={t("accounts.orSetOwn")}
          description={t("changePassword.minChars", { count: 8 })}
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        <Button
          variant="light"
          disabled={password.length < 8}
          loading={busy}
          onClick={() => submit(false)}
        >
          {t("accounts.useThis")}
        </Button>
      </Stack>
    </Modal>
  );
}
