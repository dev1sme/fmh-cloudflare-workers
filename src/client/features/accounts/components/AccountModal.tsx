import { Button, Modal, PasswordInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

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
    <Modal opened={opened} onClose={onClose} title="Thêm tài khoản">
      <Stack>
        <TextInput
          label="Tên đăng nhập"
          placeholder="phong03"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
        />
        <Select
          label="Vai trò"
          value={vaiTro}
          onChange={setVaiTro}
          data={[
            { value: "TENANT", label: "Người thuê — chỉ xem hóa đơn phòng mình" },
            { value: "MANAGER", label: "Quản lý — toàn quyền" },
          ]}
          allowDeselect={false}
        />
        {vaiTro === "TENANT" && (
          <Select
            label="Phòng"
            description="Mỗi phòng chỉ có một tài khoản"
            value={roomId}
            onChange={setRoomId}
            data={phong.map((room) => ({ value: String(room.id), label: room.room_name }))}
            allowDeselect={false}
          />
        )}
        <PasswordInput
          label="Mật khẩu"
          description="Để trống thì hệ thống tự sinh mật khẩu mạnh và hiện ra một lần"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />

        <Text size="xs" c="dimmed">
          Mật khẩu được băm trước khi lưu, không xem lại được. Quên thì đặt lại.
        </Text>

        <Button onClick={save} loading={busy}>
          Tạo tài khoản
        </Button>
      </Stack>
    </Modal>
  );
}
