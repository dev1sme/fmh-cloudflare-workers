import { Alert, Button, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconAlertCircle, IconLock, IconUser } from "@tabler/icons-react";
import { useState } from "react";

export function LoginForm({
  onSubmit,
  loi,
  dangChay,
}: {
  onSubmit: (username: string, password: string) => void;
  loi: string | null;
  dangChay: boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(username, password);
      }}
    >
      <Stack gap="lg">
        <div>
          <Title order={3}>Đăng nhập</Title>
          {/* Both roles land here, so the copy names neither. */}
          <Text size="sm" c="dimmed" mt={4}>
            Dùng tài khoản chủ nhà cấp cho phòng của bạn.
          </Text>
        </div>

        {loi && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
            {loi}
          </Alert>
        )}

        <Stack gap="sm">
          <TextInput
            label="Tài khoản"
            placeholder="phong01"
            leftSection={<IconUser size={16} stroke={1.7} />}
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            autoComplete="username"
            autoFocus
            required
          />
          <PasswordInput
            label="Mật khẩu"
            leftSection={<IconLock size={16} stroke={1.7} />}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            autoComplete="current-password"
            required
          />
        </Stack>

        <Button type="submit" loading={dangChay} fullWidth size="md">
          Đăng nhập
        </Button>

        <Text size="xs" c="dimmed" ta="center">
          Quên mật khẩu? Liên hệ chủ nhà để được cấp lại.
        </Text>
      </Stack>
    </form>
  );
}
