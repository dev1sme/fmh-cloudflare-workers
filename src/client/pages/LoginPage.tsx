import {
  Alert,
  Button,
  Card,
  Center,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";

import { ApiError, auth, type SessionUser } from "../api";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Sai tài khoản hoặc mật khẩu.",
  missing_credentials: "Nhập đủ tài khoản và mật khẩu.",
};

export function LoginPage({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const { user } = await auth.login(username, password);
      onLogin(user);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "unknown";
      setError(MESSAGES[code] ?? "Không đăng nhập được, thử lại sau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Center mih="100dvh" p="md">
      <Card withBorder shadow="sm" padding="lg" w={360}>
        <form onSubmit={submit}>
          <Stack>
            <Title order={3}>Quản Lý Nhà Trọ</Title>

            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            <TextInput
              label="Tài khoản"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              autoComplete="username"
              autoFocus
              required
            />
            <PasswordInput
              label="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              autoComplete="current-password"
              required
            />

            <Button type="submit" loading={busy} fullWidth>
              Đăng nhập
            </Button>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
