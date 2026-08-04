import { Alert, Button, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
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
      <Stack>
        <Title order={3}>Quản Lý Nhà Trọ</Title>

        {loi && (
          <Alert color="red" variant="light">
            {loi}
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

        <Button type="submit" loading={dangChay} fullWidth>
          Đăng nhập
        </Button>
      </Stack>
    </form>
  );
}
