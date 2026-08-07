import { Button, Modal, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Account } from "../../../../shared/types";

export function RenameModal({
  account,
  onClose,
  onSubmit,
}: {
  account: Account | null;
  onClose: () => void;
  onSubmit: (code: string, username: string) => Promise<boolean>;
}) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (account) setUsername(account.username);
  }, [account]);

  async function save() {
    if (!account) return;
    setBusy(true);

    const ok = await onSubmit(account.code, username);

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      opened={account !== null}
      onClose={onClose}
      title={t("accounts.renameTitle", { name: account?.username ?? "" })}
    >
      <Stack>
        <TextInput
          label={t("accounts.newUsername")}
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
        />
        <Button onClick={save} loading={busy} disabled={username.trim() === ""}>
          {t("common.save")}
        </Button>
      </Stack>
    </Modal>
  );
}
