import { Button, Modal, PasswordInput, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";

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
      title={`Đặt lại mật khẩu — ${account?.username ?? ""}`}
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Không cần mật khẩu hiện tại. Mật khẩu cũ ngừng dùng được ngay sau khi đặt lại.
        </Text>

        <Button onClick={() => submit(true)} loading={busy}>
          Sinh mật khẩu ngẫu nhiên
        </Button>

        <PasswordInput
          label="Hoặc tự đặt mật khẩu"
          description="Tối thiểu 8 ký tự"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        <Button
          variant="light"
          disabled={password.length < 8}
          loading={busy}
          onClick={() => submit(false)}
        >
          Dùng mật khẩu này
        </Button>
      </Stack>
    </Modal>
  );
}
