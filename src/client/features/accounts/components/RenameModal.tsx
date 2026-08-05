import { Button, Modal, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

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
      title={`Đổi tên đăng nhập — ${account?.username ?? ""}`}
    >
      <Stack>
        <TextInput
          label="Tên đăng nhập mới"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
        />
        <Button onClick={save} loading={busy} disabled={username.trim() === ""}>
          Lưu
        </Button>
      </Stack>
    </Modal>
  );
}
