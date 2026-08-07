import { Button, Modal, PasswordInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RoomDetail } from "../../../../shared/types";
import type { AccountInput } from "../../../api";

export function AccountModal({
  opened,
  phong,
  onClose,
  onSubmit,
}: {
  opened: boolean;
  phong: RoomDetail[];
  onClose: () => void;
  onSubmit: (input: AccountInput) => Promise<boolean>;
}) {
  const [username, setUsername] = useState("");
  const [vaiTro, setVaiTro] = useState<string | null>("TENANT");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!opened) return;
    setUsername("");
    setVaiTro("TENANT");
    setRoomId(phong[0] ? String(phong[0].id) : null);
    setPassword("");
  }, [opened, phong]);

  async function save() {
    setBusy(true);

    const ok = await onSubmit({
      username,
      role: vaiTro === "MANAGER" ? "MANAGER" : "TENANT",
      room_id: vaiTro === "MANAGER" ? null : Number(roomId),
      // Empty means "generate one" — the server decides and returns it once.
      password: password || undefined,
    });

    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t("accounts.add")}>
      <Stack>
        <TextInput
          label={t("accounts.colUsername")}
          placeholder="phong03"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
        />
        <Select
          label={t("accounts.role")}
          value={vaiTro}
          onChange={setVaiTro}
          data={[
            { value: "TENANT", label: t("accounts.roleTenant") },
            { value: "MANAGER", label: t("accounts.roleManager") },
          ]}
          allowDeselect={false}
        />
        {vaiTro === "TENANT" && (
          <Select
            label={t("dashboard.colRoom")}
            description={t("accounts.roomHint")}
            value={roomId}
            onChange={setRoomId}
            data={phong.map((room) => ({ value: String(room.id), label: room.room_name }))}
            allowDeselect={false}
          />
        )}
        <PasswordInput
          label={t("login.password")}
          description={t("accounts.passwordHint")}
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />

        <Text size="xs" c="dimmed">
          {t("accounts.hashedNote")}
        </Text>

        <Button onClick={save} loading={busy}>
          {t("accounts.create")}
        </Button>
      </Stack>
    </Modal>
  );
}
